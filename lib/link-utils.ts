/** Shared by /admin (browser) and the server: short-link names, targets and file sizes. */

/** Uploads go from the browser straight to storage, so they can be as big as Supabase allows by default. */
export const MAX_FILE = 50 * 1024 * 1024;

/** A link's name, as in /go/<slug>: lowercase letters, numbers and dashes. */
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]{1,5}$/, "") // drop a file extension
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/, "");
}

/**
 * Where a link may send people: an http(s) address, or a path on this site.
 * Returns the cleaned address, or null when it isn't one of those.
 */
export function cleanTarget(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw.slice(0, 2000);
  // People often paste "drive.google.com/..." without the scheme.
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString().slice(0, 2000);
  } catch {
    return null;
  }
}

/** The file id in a Google Drive share link, if it is one. */
export function driveFileId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "drive.google.com" && u.hostname !== "docs.google.com") return null;
    const m = u.pathname.match(/\/file\/d\/([\w-]{10,})/);
    if (m) return m[1];
    const id = u.searchParams.get("id");
    return u.pathname.startsWith("/uc") || u.pathname.startsWith("/open") ? (id && /^[\w-]{10,}$/.test(id) ? id : null) : null;
  } catch {
    return null;
  }
}

/** A Drive share link turned into one that downloads straight away, skipping Drive's preview page. */
export const driveDownloadUrl = (id: string) => `https://drive.google.com/uc?export=download&id=${id}`;

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 KB";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/** Types a browser can show safely in a tab; anything else is always downloaded. */
const INLINE = /^(application\/pdf|image\/(png|jpe?g|gif|webp|avif)|video\/(mp4|webm)|audio\/(mpeg|mp4|wav|ogg|webm)|text\/plain)$/;
export const canOpenInBrowser = (type: string) => INLINE.test(type);
