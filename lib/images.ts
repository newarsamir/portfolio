const STORAGE = process.env.NEXT_PUBLIC_STORAGE_ORIGIN ?? "";

/**
 * Images the Next optimizer can't fetch, so they're shown as they are: any
 * absolute link except files uploaded in /admin (Supabase storage), which
 * are resized like the images in /public.
 */
export const isRemote = (src: string) => /^https?:\/\//i.test(src) && !(STORAGE && src.startsWith(`${STORAGE}/storage/v1/object/public/`));

/** Widths the optimizer serves (Next's default image and device sizes). */
const WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

/** A resized copy of an image, at the largest allowed width not over `width`. Unoptimizable links come back unchanged. */
export function resized(src: string, width: number) {
  if (!src || isRemote(src) || src.startsWith("data:") || /\.svg(\?|$)/i.test(src)) return src;
  const w = [...WIDTHS].reverse().find((x) => x <= width) ?? WIDTHS[0];
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}

/** srcset for a plain <img>: resized copies at these widths, or undefined when the link can't be resized. */
export function srcSet(src: string, widths: number[] = [384, 640, 828, 1080]) {
  if (resized(src, widths[0]) === src) return undefined;
  return widths.map((w) => `${resized(src, w)} ${w}w`).join(", ");
}

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
