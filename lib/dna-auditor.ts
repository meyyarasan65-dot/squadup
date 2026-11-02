import "server-only";
import { z } from "zod";
import type { FrameworkCategory, LeetCodeStats, VerifiedFramework } from "@/types";

const GITHUB_API = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 6_000;
const LEETCODE_API = "https://leetcode.com/graphql";

// Framework category mapping rules
interface RuleDefinition {
  pattern: RegExp | string;
  name: string;
  category: FrameworkCategory;
  weight: number;
}

const HIGH_SIGNAL_RULES: RuleDefinition[] = [
  // Database / ORM
  { pattern: /^prisma$/, name: "prisma", category: "Database/ORM", weight: 90 },
  { pattern: /^@prisma\/client$/, name: "@prisma/client", category: "Database/ORM", weight: 90 },
  { pattern: /^drizzle-orm$/, name: "drizzle-orm", category: "Database/ORM", weight: 90 },
  { pattern: /^typeorm$/, name: "typeorm", category: "Database/ORM", weight: 90 },
  { pattern: /^sqlalchemy$/, name: "sqlalchemy", category: "Database/ORM", weight: 85 },
  { pattern: /^mongoose$/, name: "mongoose", category: "Database/ORM", weight: 80 },

  // Realtime Systems
  { pattern: /^socket\.io(-client)?$/, name: "socket.io", category: "Realtime Systems", weight: 85 },
  { pattern: /^ws$/, name: "ws", category: "Realtime Systems", weight: 85 },
  { pattern: /^pusher(-js)?$/, name: "pusher-js", category: "Realtime Systems", weight: 85 },
  { pattern: /^@supabase\/supabase-js$/, name: "supabase-realtime", category: "Realtime Systems", weight: 85 },

  // AI / ML
  { pattern: /^torch(vision)?$/, name: "torch", category: "AI / ML", weight: 95 },
  { pattern: /^tensorflow$/, name: "tensorflow", category: "AI / ML", weight: 95 },
  { pattern: /^@langchain\/core$/, name: "@langchain/core", category: "AI / ML", weight: 95 },
  { pattern: /^langchain$/, name: "langchain", category: "AI / ML", weight: 95 },
  { pattern: /^openai$/, name: "openai", category: "AI / ML", weight: 95 },
  { pattern: /^@ai-sdk\//, name: "vercel-ai-sdk", category: "AI / ML", weight: 95 },
  { pattern: /^transformers$/, name: "transformers", category: "AI / ML", weight: 95 },

  // Modern Frontend
  { pattern: /^framer-motion$/, name: "framer-motion", category: "Modern Frontend", weight: 75 },
  { pattern: /^lucide-react$/, name: "lucide-react", category: "Modern Frontend", weight: 75 },
  { pattern: /^tailwindcss$/, name: "tailwindcss", category: "Modern Frontend", weight: 75 },
  { pattern: /^next$/, name: "next.js", category: "Modern Frontend", weight: 85 },
  { pattern: /^react$/, name: "react", category: "Modern Frontend", weight: 80 },
  { pattern: /^svelte$/, name: "svelte", category: "Modern Frontend", weight: 80 },
  { pattern: /^vue$/, name: "vue", category: "Modern Frontend", weight: 80 },

  // Cloud & DevOps
  { pattern: /^docker$/, name: "docker", category: "Cloud & DevOps", weight: 90 },
  { pattern: /^kubernetes$/, name: "kubernetes", category: "Cloud & DevOps", weight: 90 },
  { pattern: /^aws-sdk$/, name: "aws-sdk", category: "Cloud & DevOps", weight: 90 },
  { pattern: /^@aws-sdk\//, name: "@aws-sdk", category: "Cloud & DevOps", weight: 90 },
  { pattern: /^serverless$/, name: "serverless", category: "Cloud & DevOps", weight: 85 },
];

const githubContentSchema = z.object({
  content: z.string(),
  encoding: z.string(),
});

/**
 * Safely fetches and decodes a file from GitHub contents API.
 * Returns null if file not found (404) or on rate-limit/error.
 */
async function fetchRepoFile(
  owner: string,
  repo: string,
  filePath: string,
  token: string | null,
): Promise<string | null> {
  const url = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}`;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "squadup-dna-auditor",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const json = await res.json();
    const parsed = githubContentSchema.safeParse(json);
    if (!parsed.success) return null;

    if (parsed.data.encoding === "base64") {
      const cleanBase64 = parsed.data.content.replace(/\s/g, "");
      return Buffer.from(cleanBase64, "base64").toString("utf-8");
    }
    return parsed.data.content;
  } catch {
    return null;
  }
}

/**
 * Extracts dependency names from package.json and requirements.txt
 */
export function extractDependenciesFromManifests(
  packageJsonRaw: string | null,
  requirementsTxtRaw: string | null,
): string[] {
  const deps = new Set<string>();

  // 1. Parse package.json
  if (packageJsonRaw) {
    try {
      const parsed = JSON.parse(packageJsonRaw);
      if (parsed && typeof parsed === "object") {
        if (parsed.dependencies && typeof parsed.dependencies === "object") {
          for (const key of Object.keys(parsed.dependencies)) {
            deps.add(key.toLowerCase().trim());
          }
        }
        if (parsed.devDependencies && typeof parsed.devDependencies === "object") {
          for (const key of Object.keys(parsed.devDependencies)) {
            deps.add(key.toLowerCase().trim());
          }
        }
      }
    } catch {
      // Malformed package.json, ignore
    }
  }

  // 2. Parse requirements.txt
  if (requirementsTxtRaw) {
    const lines = requirementsTxtRaw.split(/\r?\n/);
    for (const rawLine of lines) {
      let line = rawLine.trim();
      const commentIdx = line.indexOf("#");
      if (commentIdx !== -1) line = line.substring(0, commentIdx).trim();
      if (!line) continue;

      // Extract package name before ==, >=, <=, ~=, !=, >, <, ; or [
      const match = line.match(/^([a-zA-Z0-9_\-\.]+)/);
      if (match && match[1]) {
        deps.add(match[1].toLowerCase());
      }
    }
  }

  return [...deps];
}

/**
 * Maps raw dependency package names to verified high-signal framework categories
 */
export function classifyVerifiedStack(dependencies: string[]): VerifiedFramework[] {
  const matched = new Map<string, VerifiedFramework>();

  for (const dep of dependencies) {
    for (const rule of HIGH_SIGNAL_RULES) {
      const matches =
        typeof rule.pattern === "string"
          ? dep === rule.pattern
          : rule.pattern.test(dep);

      if (matches) {
        if (!matched.has(rule.name) || (matched.get(rule.name)?.weight ?? 0) < rule.weight) {
          matched.set(rule.name, {
            name: rule.name,
            category: rule.category,
            weight: rule.weight,
          });
        }
      }
    }
  }

  return [...matched.values()].sort((a, b) => b.weight - a.weight);
}

/**
 * Calculates Commit Authenticity Score:
 * (1 - (forked_count / total_inspected)) * 100
 */
export function calculateAuthenticityScore(
  forkedCount: number,
  totalInspected: number,
): number {
  if (totalInspected <= 0) return 100.0;
  const ratio = Math.min(1, Math.max(0, forkedCount / totalInspected));
  const score = (1 - ratio) * 100;
  return Math.round(score * 10) / 10;
}

const leetCodeResponseSchema = z.object({
  data: z
    .object({
      matchedUser: z
        .object({
          submitStats: z
            .object({
              acSubmissionNum: z.array(
                z.object({
                  difficulty: z.string(),
                  count: z.number(),
                }),
              ),
            })
            .optional(),
          profile: z
            .object({
              ranking: z.number().nullable().optional(),
            })
            .optional(),
        })
        .nullable(),
    })
    .optional(),
});

/**
 * Queries LeetCode GraphQL public endpoint with fallback error isolation.
 * A network or query failure will NEVER throw; it safely returns default stats.
 */
export async function scrapeLeetCodeStats(username: string): Promise<LeetCodeStats> {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    return { ranking: null, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 };
  }

  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        profile {
          ranking
        }
      }
    }
  `;

  try {
    const res = await fetch(LEETCODE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "squadup-leetcode-auditor",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({ query, variables: { username: cleanUsername } }),
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });

    if (!res.ok) {
      return { ranking: null, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 };
    }

    const json = await res.json();
    const parsed = leetCodeResponseSchema.safeParse(json);
    if (!parsed.success || !parsed.data?.data?.matchedUser) {
      return { ranking: null, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 };
    }

    const matched = parsed.data.data.matchedUser;
    const ranking = matched.profile?.ranking ?? null;
    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    const subs = matched.submitStats?.acSubmissionNum ?? [];
    for (const sub of subs) {
      const diff = sub.difficulty.toLowerCase();
      if (diff === "all") totalSolved = sub.count;
      else if (diff === "easy") easySolved = sub.count;
      else if (diff === "medium") mediumSolved = sub.count;
      else if (diff === "hard") hardSolved = sub.count;
    }

    return {
      ranking,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
    };
  } catch {
    return { ranking: null, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 };
  }
}

export interface HackerDnaAuditResult {
  rawDependencies: string[];
  verifiedTechStack: VerifiedFramework[];
  commitAuthenticityScore: number;
  leetcodeStats: LeetCodeStats;
}

/**
 * High-signal autonomous hacker DNA audit:
 * 1. Iterates active non-forked repositories to inspect package.json & requirements.txt
 * 2. Computes commit authenticity score
 * 3. Scrapes LeetCode competitive ranks with graceful timeout
 */
export async function auditHackerDNA(params: {
  username: string;
  repos: Array<{ name: string; fork: boolean; private?: boolean }>;
  token: string | null;
}): Promise<HackerDnaAuditResult> {
  const totalInspected = params.repos.length;
  const forkedCount = params.repos.filter((r) => r.fork).length;
  const authenticityScore = calculateAuthenticityScore(forkedCount, totalInspected);

  const activeRepos = params.repos.filter((r) => !r.fork && !r.private).slice(0, 5);

  const allDependencies = new Set<string>();

  // Fetch manifests concurrently across top active repos
  await Promise.all(
    activeRepos.map(async (repo) => {
      try {
        const [pkgJson, reqTxt] = await Promise.all([
          fetchRepoFile(params.username, repo.name, "package.json", params.token),
          fetchRepoFile(params.username, repo.name, "requirements.txt", params.token),
        ]);

        const deps = extractDependenciesFromManifests(pkgJson, reqTxt);
        for (const d of deps) allDependencies.add(d);
      } catch {
        // Individual repo failure isolated
      }
    }),
  );

  const rawDependencies = [...allDependencies];
  const verifiedTechStack = classifyVerifiedStack(rawDependencies);

  // Scrape LeetCode (isolated timeout)
  const leetcodeStats = await scrapeLeetCodeStats(params.username);

  return {
    rawDependencies,
    verifiedTechStack,
    commitAuthenticityScore: authenticityScore,
    leetcodeStats,
  };
}

