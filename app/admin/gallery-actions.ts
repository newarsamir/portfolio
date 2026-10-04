"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { imageSourceOk } from "@/lib/images";
import { SHOWCASE_BUCKET } from "@/lib/showcase";
import { getSupabase } from "@/lib/supabase";
import type { ActionResult } from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Vercel caps a request body at about 4.5 MB, so stay under it. */
const MAX_UPLOAD = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/avif": "avif",
};
const NO_DB: ActionResult = { ok: false, message: "Supabase isn't connected, so the gallery can't be changed." };

function int(form: FormData, key: string) {
  const n = Number(form.get(key));
  return Number.isInteger(n) && n > 0 && n <= 20000 ? n : null;
}

const done = () => revalidatePath("/", "layout");

/** Uploads go to the same public bucket as the showcase, under gallery/. */
export async function saveGalleryItem(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return NO_DB;

  const id = String(form.get("id") ?? "").trim();
  if (id && !UUID.test(id)) return { ok: false, message: "That image no longer exists." };
  const width = int(form, "width");
  const height = int(form, "height");
  if (!width || !height) {
    return { ok: false, message: "The image size couldn't be read. Pick the image again, or wait for the preview to load." };
  }

  const record = {
    kind: form.get("kind") === "lifestyle" ? "lifestyle" : "product",
    caption: String(form.get("caption") ?? "").trim().slice(0, 120),
    prompt: String(form.get("prompt") ?? "").trim().slice(0, 600),
    published: form.get("published") === "on",
    width,
    height,
    updated_at: new Date().toISOString(),
  };

  let src = String(form.get("src") ?? "").trim().slice(0, 1000);
  let storagePath: string | undefined;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    const ext = TYPES[file.type];
    if (!ext) return { ok: false, message: "Upload a WebP, PNG, JPEG or AVIF image." };
    if (file.size > MAX_UPLOAD) return { ok: false, message: "That image is over 4 MB. Export it as WebP to shrink it." };
    storagePath = `gallery/${randomUUID()}.${ext}`;
    const { error } = await db.storage
      .from(SHOWCASE_BUCKET)
      .upload(storagePath, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) {
      console.error("gallery upload failed:", error.message);
      return { ok: false, message: "The upload failed. Check the Database check in Settings for the storage bucket." };
    }
    src = db.storage.from(SHOWCASE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
  } else {
    if (!src) return { ok: false, message: "Upload an image or paste a link to one." };
    if (!imageSourceOk(src)) return { ok: false, message: "The image must be uploaded, a site path or an https link." };
  }

  const cleanup = async () => {
    if (storagePath) await db.storage.from(SHOWCASE_BUCKET).remove([storagePath]);
  };

  if (id) {
    const { data: before } = await db.from("gallery_items").select("src, storage_path").eq("id", id).maybeSingle();
    if (!before) {
      await cleanup();
      return { ok: false, message: "That image no longer exists." };
    }
    const patch: Record<string, unknown> = { ...record, src };
    if (storagePath) patch.storage_path = storagePath;
    else if (before.src !== src) patch.storage_path = null;
    const { error } = await db.from("gallery_items").update(patch).eq("id", id);
    if (error) {
      await cleanup();
      return { ok: false, message: "The image wasn't saved. Try again." };
    }
    // The old upload is no longer used.
    if (before.storage_path && before.src !== src) await db.storage.from(SHOWCASE_BUCKET).remove([before.storage_path as string]);
    done();
    return { ok: true, message: "Saved. The gallery is updated." };
  }

  const { data: last } = await db.from("gallery_items").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const sort_order = ((last?.[0]?.sort_order as number | undefined) ?? -1) + 1;
  const { error } = await db.from("gallery_items").insert({ ...record, src, storage_path: storagePath ?? null, sort_order });
  if (error) {
    await cleanup();
    return { ok: false, message: "The image wasn't saved. Try again." };
  }
  done();
  return { ok: true, message: record.published ? "Added to the gallery." : "Saved as hidden." };
}

export async function deleteGalleryItem(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UUID.test(id)) return { ok: false, message: "Couldn't delete that image." };
  const { data } = await db.from("gallery_items").select("storage_path").eq("id", id).maybeSingle();
  const { error } = await db.from("gallery_items").delete().eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete that image. Try again." };
  if (data?.storage_path) await db.storage.from(SHOWCASE_BUCKET).remove([data.storage_path as string]);
  done();
  return { ok: true, message: "Image removed from the gallery." };
}

export async function setGalleryPublished(id: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UUID.test(id)) return { ok: false, message: "Couldn't update that image." };
  const { error } = await db.from("gallery_items").update({ published, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, message: "Couldn't update that image. Try again." };
  done();
  return { ok: true, message: published ? "Shown on the site." : "Hidden from the site." };
}

export async function reorderGallery(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || ids.length > 300 || !ids.every((id) => UUID.test(id))) return { ok: false, message: "Couldn't save the new order." };
  const results = await Promise.all(ids.map((id, i) => db.from("gallery_items").update({ sort_order: i }).eq("id", id)));
  if (results.some((r) => r.error)) return { ok: false, message: "Couldn't save the new order. Try again." };
  done();
  return { ok: true, message: "Order saved." };
}
