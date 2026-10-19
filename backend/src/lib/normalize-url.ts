/**
 * Turns any spelling of a repo URL into one canonical key, so
 * `https://www.GitHub.com/a/b.git/` and `https://github.com/a/b` collide.
 */
export function normalizeRepoUrl(raw: string) {
  const url = new URL(raw.trim());
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, "").replace(/\.git$/i, "").toLowerCase();
  return `${host}${path}`; // e.g. "github.com/parvejme24/my-app"
}
