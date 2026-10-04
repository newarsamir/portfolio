import "server-only";
import { cache } from "react";
import { site, type Counter } from "@/content/site";
import { getSupabase } from "./supabase";

export type SiteSettings = {
  heroVideoUrl: string;
  availableForWork: boolean;
  counters: Counter[];
  /** True while the counters are still the sample values from site.ts. */
  countersArePlaceholder: boolean;
  showcaseHeading: string;
  showcaseSub: string;
  /** Client names for the brand strip. */
  brands: string[];
};

export const SETTING_KEYS = {
  video: "hero_video_url",
  available: "available_for_work",
  counters: "counters",
  showcaseHeading: "showcase_heading",
  showcaseSub: "showcase_sub",
  brands: "brands",
} as const;

function defaults(): SiteSettings {
  return {
    heroVideoUrl: site.defaults.heroVideoUrl,
    availableForWork: site.defaults.availableForWork,
    counters: site.counters.items.map((c) => ({ ...c })),
    countersArePlaceholder: site.counters.placeholder,
    showcaseHeading: site.showcase.heading,
    showcaseSub: site.showcase.sub,
    brands: [...site.brandStrip.items],
  };
}

/** Settings from Supabase merged over the defaults in /content/site.ts. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const out = defaults();
  const db = getSupabase();
  if (!db) return out;

  try {
    const { data, error } = await db.from("settings").select("key, value");
    if (error || !data) return out;

    for (const row of data as { key: string; value: unknown }[]) {
      if (row.key === SETTING_KEYS.video && typeof row.value === "string" && row.value.trim()) {
        out.heroVideoUrl = row.value.trim();
      }
      if (row.key === SETTING_KEYS.showcaseHeading && typeof row.value === "string" && row.value.trim()) {
        out.showcaseHeading = row.value.trim();
      }
      if (row.key === SETTING_KEYS.showcaseSub && typeof row.value === "string" && row.value.trim()) {
        out.showcaseSub = row.value.trim();
      }
      if (row.key === SETTING_KEYS.brands && Array.isArray(row.value)) {
        out.brands = row.value.filter((b): b is string => typeof b === "string" && b.trim() !== "");
      }
      if (row.key === SETTING_KEYS.available && typeof row.value === "boolean") {
        out.availableForWork = row.value;
      }
      if (row.key === SETTING_KEYS.counters && row.value && typeof row.value === "object") {
        const saved = row.value as Record<string, unknown>;
        let touched = false;
        out.counters = out.counters.map((c) => {
          const v = saved[c.id];
          if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
            touched = true;
            return { ...c, value: Math.round(v) };
          }
          return c;
        });
        // Counters saved from /admin are real values, so drop the sample note.
        if (touched) out.countersArePlaceholder = false;
      }
    }
  } catch {
    // Network or config trouble: fall back to the defaults.
  }
  return out;
});
