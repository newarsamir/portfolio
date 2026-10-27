import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site as defaults } from "@/content/site";
import { getContent } from "@/lib/content";

export const alt = `${defaults.name}, ${defaults.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Picks up a new share banner or headline from /admin within a minute.
export const revalidate = 60;

/** The share banner uploaded in /admin as a data URI, or null if it's missing or not a PNG/JPEG. */
async function uploadedBanner(src: string): Promise<string | null> {
  try {
    let bytes: Buffer;
    let type: string;
    if (src.startsWith("/") && !src.startsWith("//")) {
      // A file in /public.
      const path = decodeURIComponent(src.split("?")[0]).replace(/\.\.+/g, "");
      bytes = await readFile(join(process.cwd(), "public", path));
      type = /\.png$/i.test(path) ? "image/png" : /\.jpe?g$/i.test(path) ? "image/jpeg" : "";
    } else {
      const res = await fetch(src);
      if (!res.ok) return null;
      bytes = Buffer.from(await res.arrayBuffer());
      type = res.headers.get("content-type") ?? "";
    }
    // The renderer reads PNG and JPEG; uploads from /admin are converted to JPEG.
    if (!/^image\/(png|jpe?g)/i.test(type)) return null;
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const site = await getContent();
  const banner = site.seo.shareImage?.trim() ? await uploadedBanner(site.seo.shareImage.trim()) : null;
  if (banner) {
    return new ImageResponse(
      // eslint-disable-next-line @next/next/no-img-element
      <img src={banner} alt="" width={size.width} height={size.height} style={{ width: "100%", height: "100%", objectFit: "cover" }} />,
      size,
    );
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#fbf9f1",
          color: "#1c1a16",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 30 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#b7ef09", display: "flex" }} />
          {site.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1, letterSpacing: -4, maxWidth: 980 }}>
            {site.hero.headline}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                display: "flex",
                background: "#b7ef09",
                color: "#1b2203",
                fontSize: 30,
                padding: "12px 26px",
                borderRadius: 999,
              }}
            >
              {site.title}
            </div>
            <div style={{ fontSize: 30, color: "#5c574d", display: "flex" }}>Ecommerce and DTC brands</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
