import "server-only";
import { cache } from "react";
import { site, type Site } from "@/content/site";
import { type ContentKey, type Layouts, type PageId, blank, defaultLayouts, mergeContentKey, normalizeLayout, sectionById } from "./cms";
import { getSettingRows, getSettings } from "./settings";

/** Settings-table keys for page-editor saves: "content:hero", "layout:home". */
export const contentKey = (key: ContentKey) => `content:${key}`;
export const layoutKey = (page: PageId | "global") => `layout:${page}`;

/**
 * Everything the site says: the defaults from content/site.ts, then the
 * older single settings (showcase heading, counters, brands), then whatever
 * was saved in the page editor.
 */
export const getContent = cache(async (): Promise<Site> => {
  const out = structuredClone(site);
  const settings = await getSettings();
  out.showcase.heading = settings.showcaseHeading;
  out.showcase.sub = settings.showcaseSub;
  out.counters.items = settings.counters;
  out.counters.placeholder = settings.countersArePlaceholder;
  out.brandStrip.items = settings.brands;
  out.defaults.heroPoster = settings.heroPoster;
  out.defaults.storyPhoto = settings.storyPhoto;

  const rows = await getSettingRows();
  const writable = out as Record<string, unknown>;
  for (const row of rows) {
    if (!row.key.startsWith("content:")) continue;
    const key = row.key.slice("content:".length);
    if (!Object.hasOwn(site, key)) continue;
    writable[key] = mergeContentKey(key as ContentKey, row.value);
  }
  return out;
});

/** Section order and visibility for every page. */
export const getLayouts = cache(async (): Promise<Layouts> => {
  const out = defaultLayouts();
  const rows = await getSettingRows();
  for (const page of Object.keys(out) as (PageId | "global")[]) {
    const row = rows.find((r) => r.key === layoutKey(page));
    if (row) out[page] = normalizeLayout(page, row.value);
  }
  return out;
});

/**
 * The content as sent to the browser: hidden sections are blanked so their
 * text isn't in the page source, and lists the pages get elsewhere are dropped.
 */
export function contentForClient(content: Site, layouts: Layouts): Site {
  const out = { ...content, showcase: { ...content.showcase, items: [] }, caseStudies: { ...content.caseStudies, items: [] } };
  const writable = out as Record<string, unknown>;
  for (const id of [...layouts.home.hidden, ...layouts.global.hidden]) {
    for (const key of sectionById(id)?.keys ?? []) writable[key] = blank(content[key]);
  }
  return out;
}
