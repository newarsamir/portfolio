import "server-only";
import { cache } from "react";
import { site, type ShowcaseItem } from "@/content/site";
import { getSupabase } from "./supabase";

export type ShowcaseRecord = Omit<ShowcaseItem, "id"> & {
  id: string | null;
  published: boolean;
  storagePath: string | null;
  sortOrder: number;
};

export const SHOWCASE_BUCKET = "showcase";
const COLUMNS = "id, src, storage_path, width, height, brand, type, note, published, sort_order";

type Row = {
  id: string;
  src: string;
  storage_path: string | null;
  width: number;
  height: number;
  brand: string | null;
  type: string | null;
  note: string | null;
  published: boolean;
  sort_order: number;
};

const fromRow = (r: Row): ShowcaseRecord => ({
  id: r.id,
  src: r.src,
  storagePath: r.storage_path,
  width: r.width,
  height: r.height,
  brand: r.brand ?? "",
  type: r.type ?? "",
  note: r.note ?? "",
  published: r.published,
  sortOrder: r.sort_order,
});

export function defaultShowcase(): ShowcaseRecord[] {
  return site.showcase.items.map((it, i) => ({
    ...it,
    id: null,
    published: true,
    storagePath: null,
    sortOrder: i,
  }));
}

/**
 * Every stored email, hidden ones included, for /admin. `fromDb` is false
 * when Supabase is missing or the table doesn't exist yet.
 */
export const getAllShowcaseItems = cache(
  async (): Promise<{ items: ShowcaseRecord[]; fromDb: boolean; error: string | null }> => {
    const db = getSupabase();
    if (!db) return { items: defaultShowcase(), fromDb: false, error: null };
    try {
      const { data, error } = await db
        .from("showcase_items")
        .select(COLUMNS)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error || !data) {
        return {
          items: defaultShowcase(),
          fromDb: false,
          error: "Couldn't read the showcase_items table. Run supabase/schema.sql again to create it.",
        };
      }
      return { items: (data as Row[]).map(fromRow), fromDb: true, error: null };
    } catch {
      return { items: defaultShowcase(), fromDb: false, error: "Couldn't reach Supabase." };
    }
  },
);

/**
 * The emails the site shows, in order. An empty table falls back to the
 * placeholders in site.ts, so the section never disappears on a fresh setup.
 */
export async function getShowcaseItems(): Promise<ShowcaseItem[]> {
  const { items, fromDb } = await getAllShowcaseItems();
  const list = fromDb && items.length === 0 ? defaultShowcase() : items.filter((i) => i.published);
  return list.map(({ id, src, width, height, brand, type, note }) => ({
    id: id ?? undefined,
    src,
    width,
    height,
    brand,
    type,
    note,
  }));
}
