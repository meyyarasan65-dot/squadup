export const ROLES = [
  "frontend",
  "backend",
  "fullstack",
  "ai_ml",
  "ui_ux",
  "devops",
  "mobile",
] as const;

export const ROLE_LABELS: Record<(typeof ROLES)[number], string> = {
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Full-Stack",
  ai_ml: "AI/ML",
  ui_ux: "UI/UX",
  devops: "DevOps",
  mobile: "Mobile",
};

/** Tailwind classes per role: text + subtle tinted surface + border. */
export const ROLE_STYLES: Record<(typeof ROLES)[number], string> = {
  frontend: "text-sky-300 bg-sky-500/10 border-sky-500/25",
  backend: "text-amber-300 bg-amber-500/10 border-amber-500/25",
  fullstack: "text-indigo-300 bg-indigo-500/10 border-indigo-500/25",
  ai_ml: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/25",
  ui_ux: "text-pink-300 bg-pink-500/10 border-pink-500/25",
  devops: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  mobile: "text-orange-300 bg-orange-500/10 border-orange-500/25",
};

/** GitHub linguist colors for the languages students most commonly use. */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  "Jupyter Notebook": "#DA5B0B",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Go: "#00ADD8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  HCL: "#844FBA",
  PLpgSQL: "#336790",
  Solidity: "#AA6746",
  R: "#198CE7",
  Scala: "#c22d40",
  Elixir: "#6e4a7e",
  Lua: "#000080",
};

export const FALLBACK_LANGUAGE_COLOR = "#71717a";

export function languageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? FALLBACK_LANGUAGE_COLOR;
}

/** Languages offered when a team picks its desired stack. */
export const STACK_OPTIONS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "Kotlin",
  "Swift",
  "Dart",
  "Go",
  "Rust",
  "C++",
  "C#",
  "PHP",
  "Ruby",
  "HTML",
  "CSS",
  "Solidity",
] as const;

/** A language counts as "possessed" above this share of a user's code. */
export const SKILL_THRESHOLD_PERCENT = 10;

export const INVITE_TTL_HOURS = 24;

/** Minimum gap between manual GitHub re-syncs. */
export const GITHUB_RESYNC_COOLDOWN_MS = 5 * 60 * 1000;
