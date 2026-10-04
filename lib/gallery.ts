import "server-only";
import { cache } from "react";
import { explainDbError } from "./db-status";
import { getSupabase } from "./supabase";

export type GalleryKind = "product" | "lifestyle";

export type GalleryItem = {
  id: string;
  src: string;
  width: number;
  height: number;
  kind: GalleryKind;
  caption: string;
  prompt: string;
};

export type GalleryRecord = GalleryItem & { published: boolean; storagePath: string | null; sortOrder: number };

type Row = {
  id: string;
  src: string;
  storage_path: string | null;
  width: number;
  height: number;
  kind: string;
  caption: string | null;
  prompt: string | null;
  published: boolean;
  sort_order: number;
};

const fromRow = (r: Row): GalleryRecord => ({
  id: r.id,
  src: r.src,
  storagePath: r.storage_path,
  width: r.width,
  height: r.height,
  kind: r.kind === "lifestyle" ? "lifestyle" : "product",
  caption: r.caption ?? "",
  prompt: r.prompt ?? "",
  published: r.published,
  sortOrder: r.sort_order,
});

/** Every gallery image, hidden ones included, for /admin. */
export const getAllGalleryItems = cache(
  async (): Promise<{ items: GalleryRecord[]; fromDb: boolean; error: string | null }> => {
    const db = getSupabase();
    if (!db) return { items: [], fromDb: false, error: null };
    try {
      const { data, error } = await db
        .from("gallery_items")
        .select("id, src, storage_path, width, height, kind, caption, prompt, published, sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error || !data) return { items: [], fromDb: false, error: explainDbError(error, "gallery_items") };
      return { items: (data as Row[]).map(fromRow), fromDb: true, error: null };
    } catch {
      return { items: [], fromDb: false, error: explainDbError({ message: "fetch failed" }, "gallery_items") };
    }
  },
);

/** The images the site shows. Empty means the section shows placeholders. */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const { items } = await getAllGalleryItems();
  return items
    .filter((i) => i.published)
    .map(({ id, src, width, height, kind, caption, prompt }) => ({ id, src, width, height, kind, caption, prompt }));
}
