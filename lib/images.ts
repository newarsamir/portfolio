/** Absolute image URLs skip the Next image optimizer, which only knows local files. */
export const isRemote = (src: string) => /^https?:\/\//i.test(src);

/**
 * Image sources the admin may save: a path under /public, an https URL, or a
 * file in this project's Supabase storage (which is plain http when local).
 */
export function imageSourceOk(src: string, supabaseUrl = process.env.SUPABASE_URL ?? "") {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const u = new URL(src);
    if (u.protocol === "https:") return true;
    return Boolean(supabaseUrl) && src.startsWith(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/`);
  } catch {
    return false;
  }
}
