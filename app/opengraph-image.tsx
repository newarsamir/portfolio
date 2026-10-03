import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name}, ${site.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
