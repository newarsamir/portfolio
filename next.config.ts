import type { NextConfig } from "next";

/** Files uploaded in /admin live in Supabase storage; the image optimizer may resize them. */
const storage = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL) : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The client needs the storage origin to tell uploads (optimized) from other links (used as is).
  env: { NEXT_PUBLIC_STORAGE_ORIGIN: storage?.origin ?? "" },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: storage
      ? [{ protocol: storage.protocol.replace(":", "") as "http" | "https", hostname: storage.hostname, port: storage.port, pathname: "/storage/v1/object/public/**" }]
      : [],
    // Only for a local Supabase (tests and development); a real project is a public https host.
    dangerouslyAllowLocalIP: storage ? ["localhost", "127.0.0.1"].includes(storage.hostname) : false,
    // Uploads get a new file name, so resized copies can be kept for a month.
    minimumCacheTTL: 2_678_400,
  },
  // Showcase uploads from /admin go through a server action.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        // Font files keep their names forever (a new version gets a new name).
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
