/**
 * The page editor's map of the site: which pages exist, which sections each
 * one has, and which parts of the content (content/site.ts) each section
 * edits. Shared by the server (saving, merging) and the admin (forms).
 */
import { site, type Site } from "@/content/site";

export type ContentKey = keyof Site;
export type PageId = "home" | "work" | "case" | "contact" | "notFound";
export type AdminView = "dashboard" | "pages" | "inbox" | "showcase" | "cases" | "gallery" | "settings" | "database";

export type SectionDef = {
  id: string;
  /** The page it sits on, or "global" for the nav, footer and the like. */
  page: PageId | "global";
  label: string;
  /** One line shown under the section name in the editor. */
  help: string;
  /** Top-level content keys the section edits. */
  keys: ContentKey[];
  /** Paths that are managed elsewhere and left out of the form. */
  omit?: string[];
  /** Lists that can be edited but not added to or removed from. */
  fixed?: string[];
  /** Lists edited elsewhere: shown as a button to that admin view. */
  manage?: { view: AdminView; label: string };
  hideable?: boolean;
  /** The element id the nav links to, so hiding the section hides its link too. */
  anchor?: string;
};

export const PAGES: { id: PageId; label: string; path: string }[] = [
  { id: "home", label: "Home", path: "/" },
  { id: "work", label: "Case studies", path: "/work" },
  { id: "case", label: "Case study page", path: "/work/{slug}" },
  { id: "contact", label: "Contact", path: "/contact" },
  { id: "notFound", label: "404 page", path: "/this-page-went-to-spam" },
];

export const SECTIONS: SectionDef[] = [
  // Home, in their default order.
  { id: "hero", page: "home", label: "Hero", help: "The inbox at the top, the headline and the progress rail", keys: ["hero", "funnel"] },
  {
    id: "brands",
    page: "home",
    label: "Brand strip",
    help: "Scrolling list of brands you've worked with",
    keys: ["brandStrip"],
    hideable: true,
  },
  { id: "counters", page: "home", label: "Counters", help: "The numbers behind the inbox", keys: ["counters"], fixed: ["counters.items"], hideable: true },
  {
    id: "showcase",
    page: "home",
    label: "Selected emails",
    help: "The 3D email carousel",
    keys: ["showcase"],
    omit: ["showcase.items"],
    manage: { view: "showcase", label: "Manage emails" },
    hideable: true,
    anchor: "work",
  },
  {
    id: "cases",
    page: "home",
    label: "Case studies",
    help: "Featured case study cards",
    keys: ["caseStudies"],
    omit: ["caseStudies.items"],
    manage: { view: "cases", label: "Manage case studies" },
    hideable: true,
  },
  { id: "nudge", page: "home", label: "Hire-me nudge", help: "The lime card in the middle of the page", keys: ["nudge"], hideable: true },
  { id: "about", page: "home", label: "About", help: "Portrait, story and tools", keys: ["about"], hideable: true, anchor: "about" },
  { id: "anatomy", page: "home", label: "Anatomy of an email", help: "Seven places an email wins the click", keys: ["anatomy"], hideable: true },
  { id: "process", page: "home", label: "Process", help: "From brief to send-ready", keys: ["process"], hideable: true, anchor: "process" },
  { id: "services", page: "home", label: "Services", help: "The kinds of email you design", keys: ["services"], hideable: true },
  { id: "testimonials", page: "home", label: "Testimonials", help: "Shown once you add at least one", keys: ["testimonials"], hideable: true },
  { id: "faq", page: "home", label: "FAQ", help: "Questions and answers", keys: ["faq"], hideable: true },
  {
    id: "gallery",
    page: "home",
    label: "AI photography",
    help: "Two-row gallery of product shots",
    keys: ["gallery"],
    manage: { view: "gallery", label: "Manage images" },
    hideable: true,
  },

  { id: "workHeader", page: "work", label: "Page header", help: "Title and intro above the list", keys: ["workPage"], manage: { view: "cases", label: "Manage case studies" } },
  { id: "casePage", page: "case", label: "Case study labels", help: "Labels used on every case study", keys: ["casePage"], manage: { view: "cases", label: "Edit case study content" } },
  { id: "contact", page: "contact", label: "Contact page", help: "Headline, form options and the thank-you note", keys: ["contact"] },
  { id: "notFound", page: "notFound", label: "404 page", help: "Headline, jokes and buttons", keys: ["notFound"] },

  // On every page.
  { id: "nav", page: "global", label: "Navigation", help: "Top bar and dock labels", keys: ["navBar", "nav"], fixed: ["nav"] },
  { id: "footer", page: "global", label: "Footer", help: "Links, socials and the sign-off", keys: ["footer", "socials"] },
  { id: "identity", page: "global", label: "Name, email and SEO", help: "Used across the whole site", keys: ["name", "title", "email", "location", "seo"] },
  { id: "intro", page: "global", label: "Intro greeting", help: "नमस्ते, Jojolapa, Hello on the first visit", keys: ["intro"], hideable: true },
];

export const sectionById = (id: string) => SECTIONS.find((s) => s.id === id);
export const pageSections = (page: PageId | "global") => SECTIONS.filter((s) => s.page === page);

/** Order and visibility of a page's sections. */
export type PageLayout = { order: string[]; hidden: string[] };
export type Layouts = Record<PageId | "global", PageLayout>;

const DEFAULT_HIDDEN: Partial<Record<PageId | "global", string[]>> = { home: ["anatomy"] };

export function defaultLayouts(): Layouts {
  const out = {} as Layouts;
  for (const p of [...PAGES.map((p) => p.id), "global"] as (PageId | "global")[]) {
    out[p] = { order: pageSections(p).map((s) => s.id), hidden: [...(DEFAULT_HIDDEN[p] ?? [])] };
  }
  return out;
}

/** Keeps known ids only, and adds sections that are new since the layout was saved. */
export function normalizeLayout(page: PageId | "global", saved: unknown): PageLayout {
  const known = pageSections(page);
  const ids = known.map((s) => s.id);
  const fallback = defaultLayouts()[page];
  if (!saved || typeof saved !== "object") return fallback;
  const raw = saved as { order?: unknown; hidden?: unknown };
  const order = Array.isArray(raw.order) ? raw.order.filter((x): x is string => typeof x === "string" && ids.includes(x)) : [];
  const unique = [...new Set(order)];
  for (const id of ids) if (!unique.includes(id)) unique.splice(Math.min(ids.indexOf(id), unique.length), 0, id);
  const hideable = new Set(known.filter((s) => s.hideable).map((s) => s.id));
  const hidden = Array.isArray(raw.hidden)
    ? [...new Set(raw.hidden.filter((x): x is string => typeof x === "string" && hideable.has(x)))]
    : fallback.hidden;
  return { order: unique, hidden };
}

/* ------------------------------ Merging ------------------------------ */

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Templates for lists whose default is empty, so new items have a shape. */
const TEMPLATES: Record<string, unknown> = {
  "brandStrip.items": "",
  "testimonials.items": { quote: "", name: "", role: "" },
};

/** A blank item for a list, with every field any default item has. */
export function itemTemplate(path: string, defaults: unknown[]): unknown {
  if (path in TEMPLATES) return structuredClone(TEMPLATES[path]);
  const first = defaults[0];
  if (first === undefined) return "";
  if (!isPlainObject(first)) return blank(first);
  const out: Record<string, unknown> = {};
  for (const item of defaults) if (isPlainObject(item)) for (const [k, v] of Object.entries(item)) if (!(k in out)) out[k] = blank(v);
  return out;
}

export function blank(v: unknown): unknown {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return [];
  if (isPlainObject(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return null;
}

const MAX_STRING = 6000;
const MAX_ITEMS = 200;

/**
 * Lays `value` over `base` (the default), keeping only what fits the
 * default's shape: same types, known object keys, list items shaped like the
 * list's template. Anything else falls back to the default.
 */
export function mergeShaped(base: unknown, value: unknown, path = ""): unknown {
  if (value === undefined) return structuredClone(base);
  if (typeof base === "string") return typeof value === "string" ? value.slice(0, MAX_STRING) : base;
  if (typeof base === "number") return typeof value === "number" && Number.isFinite(value) ? value : base;
  if (typeof base === "boolean") return typeof value === "boolean" ? value : base;
  if (Array.isArray(base)) {
    if (!Array.isArray(value)) return structuredClone(base);
    const template = itemTemplate(path, base);
    return value.slice(0, MAX_ITEMS).map((item) => mergeShaped(template, item, path));
  }
  if (isPlainObject(base)) {
    const v = isPlainObject(value) ? value : {};
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(base)) out[k] = mergeShaped(base[k], v[k], path ? `${path}.${k}` : k);
    return out;
  }
  // Optional fields (like a counter's suffix) have no default to copy.
  return value;
}

export function mergeContentKey(key: ContentKey, value: unknown): unknown {
  return mergeShaped(site[key], value, key);
}

/** Removes a dotted path (e.g. "showcase.items") from a copy of a content key. */
export function omitPaths(key: ContentKey, value: unknown, paths: string[] = []): unknown {
  const mine = paths.filter((p) => p.startsWith(`${key}.`)).map((p) => p.slice(key.length + 1));
  if (!mine.length || !isPlainObject(value)) return value;
  const copy = { ...value };
  for (const p of mine) delete copy[p];
  return copy;
}

/** "{count} answers" → "7 answers". */
export const fill = (text: string, count: number) => text.replace(/\{count\}/g, String(count));
