import "server-only";
import { z } from "zod";
import { auditHackerDNA, type HackerDnaAuditResult } from "@/lib/dna-auditor";
import type { GithubStats, TopRepo, VerifiedSkills } from "@/types";

const GITHUB_API = "https://api.github.com";
const REPOS_TO_LIST = 15;
const REPOS_TO_ANALYZE = 8;
const TOP_LANGUAGES = 5;
const REQUEST_TIMEOUT_MS = 8_000;

export class GithubRateLimitError extends Error {
  constructor(public readonly resetAt: Date | null) {
    super(
      resetAt
        ? `GitHub rate limit reached. Try again after ${resetAt.toLocaleTimeString("en-IN")}.`
        : "GitHub rate limit reached. Try again in a few minutes.",
    );
    this.name = "GithubRateLimitError";
  }
}

export class GithubAuthError extends Error {
  constructor() {
    super("GitHub rejected the access token.");
    this.name = "GithubAuthError";
  }
}

const repoSchema = z.object({
  name: z.string(),
  html_url: z.string(),
  fork: z.boolean(),
  private: z.boolean().optional(),
  languages_url: z
    .string()
    .url()
    .refine((url) => url.startsWith("https://api.github.com/"), {
      message: "languages_url must target api.github.com",
    }),
  language: z.string().nullable(),
  size: z.number(), // KB
  stargazers_count: z.number(),
});
type GithubRepo = z.infer<typeof repoSchema>;

const userSchema = z.object({
  login: z.string(),
  public_repos: z.number(),
  followers: z.number(),
  avatar_url: z.string().nullable().optional(),
});

const languagesSchema = z.record(z.string(), z.number());
const commitSearchSchema = z.object({ total_count: z.number() });

function isRateLimited(res: Response): boolean {
  if (res.status === 429) return true;
  if (res.status !== 403) return false;
  // Primary limit: remaining hits 0. Secondary limit: retry-after is set.
  return res.headers.get("x-ratelimit-remaining") === "0" || res.headers.has("retry-after");
}

function resetTime(res: Response): Date | null {
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter && /^\d+$/.test(retryAfter)) {
    return new Date(Date.now() + Number(retryAfter) * 1000);
  }
  const reset = res.headers.get("x-ratelimit-reset");
  return reset && /^\d+$/.test(reset) ? new Date(Number(reset) * 1000) : null;
}

async function githubGet<T>(
  url: string,
  token: string | null,
  schema: z.ZodType<T>,
  accept = "application/vnd.github+json",
): Promise<T> {
  const headers: HeadersInit = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "hackathon-matchmaker",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (isRateLimited(res)) throw new GithubRateLimitError(resetTime(res));
  if (res.status === 401) throw new GithubAuthError();
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${new URL(url).pathname}`);

  return schema.parse(await res.json());
}

export interface GithubSkillsResult {
  githubUsername: string;
  avatarUrl: string | null;
  verifiedSkills: VerifiedSkills;
  stats: Omit<GithubStats, "synced_at" | "source">;
  dnaAudit: HackerDnaAuditResult;
}

/** Sums byte counts across repos and returns the top languages as percentages. */
export function aggregateLanguageBytes(perRepo: Record<string, number>[]): VerifiedSkills {
  const totals = new Map<string, number>();
  for (const langs of perRepo) {
    for (const [lang, bytes] of Object.entries(langs)) {
      totals.set(lang, (totals.get(lang) ?? 0) + bytes);
    }
  }
  const grand = [...totals.values()].reduce((a, b) => a + b, 0);
  if (grand === 0) return {};

  return Object.fromEntries(
    [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_LANGUAGES)
      .map(([lang, bytes]) => [lang, Math.round((bytes / grand) * 1000) / 10]),
  );
}

/** Rate-limit fallback: attribute a repo's whole size to its primary language. */
function approximateLanguages(repo: GithubRepo): Record<string, number> {
  return repo.language ? { [repo.language]: Math.max(repo.size, 1) * 1024 } : {};
}

/**
 * Inspects the user's most recently pushed public repositories and converts
 * their language byte counts into verified skill percentages.
 *
 * With an OAuth `token` it reads the authenticated user's own repos; without
 * one it falls back to the public API for `username` (optionally using the
 * server's GITHUB_TOKEN for a higher rate limit).
 *
 * Throws GithubRateLimitError only if the repository listing itself is
 * rate-limited. Per-repo language lookups that hit a limit degrade to an
 * approximation and set `stats.partial`.
 */
export async function fetchAndAggregateGithubSkills(
  token: string | null,
  username?: string,
): Promise<GithubSkillsResult> {
  const authToken = token ?? process.env.GITHUB_TOKEN ?? null;

  let user: z.infer<typeof userSchema>;
  let repos: GithubRepo[];

  if (token) {
    [user, repos] = await Promise.all([
      githubGet(`${GITHUB_API}/user`, authToken, userSchema),
      githubGet(
        `${GITHUB_API}/user/repos?per_page=${REPOS_TO_LIST}&sort=pushed&visibility=public&affiliation=owner`,
        authToken,
        z.array(repoSchema),
      ),
    ]);
  } else {
    if (!username) throw new Error("A GitHub username is required without an OAuth token.");
    const login = encodeURIComponent(username);
    [user, repos] = await Promise.all([
      githubGet(`${GITHUB_API}/users/${login}`, authToken, userSchema),
      githubGet(
        `${GITHUB_API}/users/${login}/repos?per_page=${REPOS_TO_LIST}&sort=pushed&type=owner`,
        authToken,
        z.array(repoSchema),
      ),
    ]);
  }

  const analyzed = repos.filter((r) => !r.fork && !r.private).slice(0, REPOS_TO_ANALYZE);

  let partial = false;
  const [perRepo, totalCommits, dnaAudit] = await Promise.all([
    Promise.all(
      analyzed.map(async (repo) => {
        try {
          return await githubGet(repo.languages_url, authToken, languagesSchema);
        } catch (err) {
          if (err instanceof GithubAuthError) throw err;
          partial = true;
          return approximateLanguages(repo);
        }
      }),
    ),
    githubGet(
      `${GITHUB_API}/search/commits?q=${encodeURIComponent(`author:${user.login}`)}&per_page=1`,
      authToken,
      commitSearchSchema,
    )
      .then((r) => r.total_count)
      .catch(() => null),
    auditHackerDNA({
      username: user.login,
      repos,
      token: authToken,
    }).catch(() => ({
      rawDependencies: [] as string[],
      verifiedTechStack: [],
      commitAuthenticityScore: 100.0,
      leetcodeStats: { ranking: null, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 },
    })),
  ]);

  const topRepos: TopRepo[] = [...analyzed]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 4)
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      stars: r.stargazers_count,
      language: r.language,
    }));

  return {
    githubUsername: user.login,
    avatarUrl: user.avatar_url ?? null,
    verifiedSkills: aggregateLanguageBytes(perRepo),
    stats: {
      public_repos: user.public_repos,
      followers: user.followers,
      total_stars: repos.filter((r) => !r.fork).reduce((sum, r) => sum + r.stargazers_count, 0),
      total_commits: totalCommits,
      repos_analyzed: analyzed.length,
      top_repos: topRepos,
      partial,
    },
    dnaAudit,
  };
}
