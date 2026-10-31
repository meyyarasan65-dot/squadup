/**
 * Admin authorization configuration and helpers.
 * Currently authorized admin GitHub ID: meyyarasan65-dot
 */

export const DEFAULT_ADMIN_GITHUB_USERNAMES = ["meyyarasan65-dot"] as const;

/**
 * Checks whether a given GitHub username matches an authorized admin account.
 * Case-insensitive comparison against DEFAULT_ADMIN_GITHUB_USERNAMES and optional ADMIN_GITHUB_USERNAMES env var.
 */
export function isAdminUsername(username?: string | null): boolean {
  if (!username) return false;
  const normalized = username.trim().toLowerCase();

  if (DEFAULT_ADMIN_GITHUB_USERNAMES.some((admin) => admin.toLowerCase() === normalized)) {
    return true;
  }

  const envAdmins = process.env.ADMIN_GITHUB_USERNAMES;
  if (envAdmins) {
    const list = envAdmins.split(",").map((s) => s.trim().toLowerCase());
    return list.includes(normalized);
  }

  return false;
}

