/** The site's designs. The admin picks which one the home page uses; /v1, /v2 and /v3 always show the others. */
export const VARIANTS = [
  { id: "classic", label: "Classic", path: null, blurb: "The original: 3D email carousel, stacked case cards, dark accents." },
  { id: "inbox", label: "Revenue Inbox", path: "/v1", blurb: "The page as an email's journey: inbox hero, phone row, receipts." },
  { id: "postcard", label: "Postcard", path: "/v2", blurb: "Calm and light: marker headline, postcards, envelopes." },
  { id: "apple", label: "Apple", path: "/v3", blurb: "Monochrome, system type, very clean, lots of white space." },
] as const;

export type VariantId = (typeof VARIANTS)[number]["id"];

export const isVariant = (v: unknown): v is VariantId => VARIANTS.some((x) => x.id === v);

/** Which design a path shows: /v1, /v2 and /v3 are fixed; everything else uses the chosen one. */
export function variantForPath(pathname: string, chosen: VariantId): VariantId {
  for (const v of VARIANTS) if (v.path && (pathname === v.path || pathname.startsWith(`${v.path}/`))) return v.id;
  return chosen;
}

/** True on / and on the design previews (/v1, /v2, /v3), which are all home pages. */
export const isHomePath = (pathname: string) => pathname === "/" || VARIANTS.some((v) => v.path === pathname);
