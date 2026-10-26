"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { site } from "@/content/site";
import { requireAdmin } from "@/lib/auth";
import { imageSourceOk } from "@/lib/images";
import { MAX_VIDEO, VIDEO_TYPES } from "@/lib/media";
import { SHOWCASE_BUCKET } from "@/lib/showcase";
import { getSupabase } from "@/lib/supabase";
import type { ActionResult } from "./actions";

export type ShowcaseActionResult = ActionResult & { id?: string; src?: string };

const UPLOADED_VIDEO = /^emails\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp4|webm)$/;

/**
 * Videos are too big to pass through a server action (Vercel caps a request
 * at about 4.5 MB), so the browser uploads them straight to storage with a
 * one-time signed link made here.
 */
export async function createVideoUpload(
  type: string,
  size: number,
): Promise<ActionResult & { path?: string; signedUrl?: string }> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return NO_DB;
  const ext = VIDEO_TYPES[type];
  if (!ext) return { ok: false, message: "Upload an MP4 or WebM video." };
  if (!Number.isFinite(size) || size <= 0 || size > MAX_VIDEO) {
    return { ok: false, message: "That video is over 50 MB. Export it shorter or at a lower bitrate." };
  }
  const path = `emails/${randomUUID()}.${ext}`;
  const { data, error } = await db.storage.from(SHOWCASE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("signed upload failed:", error?.message);
    return { ok: false, message: "The upload couldn't start. Check that the 'showcase' storage bucket exists, then try again." };
  }
  return { ok: true, message: "Ready to upload.", path, signedUrl: data.signedUrl };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Vercel caps a request body at about 4.5 MB, so stay under it. */
const MAX_UPLOAD = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/avif": "avif",
};

const NO_DB: ActionResult = { ok: false, message: "Supabase isn't connected, so the showcase can't be changed." };

function int(form: FormData, key: string) {
  const n = Number(form.get(key));
  return Number.isInteger(n) && n > 0 && n <= 20000 ? n : null;
}

function done() {
  revalidatePath("/", "layout");
}

export async function saveShowcaseItem(
  _prev: ShowcaseActionResult | null,
  form: FormData,
): Promise<ShowcaseActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return NO_DB;

  const id = String(form.get("id") ?? "").trim();
  if (id && !UUID.test(id)) return { ok: false, message: "That email no longer exists." };

  const width = int(form, "width");
  const height = int(form, "height");
  if (!width || !height) {
    return { ok: false, message: "The image size couldn't be read. Pick the image again, or wait for the preview to load." };
  }

  const record = {
    brand: String(form.get("brand") ?? "").trim().slice(0, 120),
    type: String(form.get("type") ?? "").trim().slice(0, 160),
    note: String(form.get("note") ?? "").trim().slice(0, 600),
    published: form.get("published") === "on",
    width,
    height,
    updated_at: new Date().toISOString(),
  };
  if (!record.brand) return { ok: false, message: "Give the email a brand or project name." };

  // A video the browser already uploaded, a new image upload, or a link.
  let src = String(form.get("src") ?? "").trim().slice(0, 1000);
  let storagePath: string | null | undefined;
  const file = form.get("file");
  const uploaded = String(form.get("uploaded") ?? "").trim();
  if (uploaded) {
    if (!UPLOADED_VIDEO.test(uploaded)) return { ok: false, message: "That video upload isn't valid. Upload it again." };
    const name = uploaded.slice("emails/".length);
    const { data: found } = await db.storage.from(SHOWCASE_BUCKET).list("emails", { search: name, limit: 1 });
    if (!found?.some((f) => f.name === name)) return { ok: false, message: "The video didn't finish uploading. Upload it again." };
    storagePath = uploaded;
    src = db.storage.from(SHOWCASE_BUCKET).getPublicUrl(uploaded).data.publicUrl;
  } else if (file instanceof File && file.size > 0) {
    const ext = TYPES[file.type];
    if (!ext) return { ok: false, message: "Upload a WebP, PNG, JPEG, GIF or AVIF image." };
    if (file.size > MAX_UPLOAD) return { ok: false, message: "That image is over 4 MB. Export it as WebP to shrink it." };
    storagePath = `emails/${randomUUID()}.${ext}`;
    const { error } = await db.storage
      .from(SHOWCASE_BUCKET)
      .upload(storagePath, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) {
      console.error("showcase upload failed:", error.message);
      return {
        ok: false,
        message: "The upload failed. Check that the 'showcase' storage bucket exists (run supabase/schema.sql), then try again.",
      };
    }
    src = db.storage.from(SHOWCASE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
  } else {
    if (!src) return { ok: false, message: "Upload an image or paste a link to one." };
    if (!imageSourceOk(src)) {
      return { ok: false, message: "The image must be uploaded, a site path like /emails/email-01.webp, or an https link." };
    }
  }

  let previousPath: string | null = null;
  if (id) {
    const { data: before } = await db.from("showcase_items").select("src, storage_path").eq("id", id).maybeSingle();
    if (!before) return { ok: false, message: "That email no longer exists." };
    // A link that replaced an upload (or a new upload) leaves the old file unused.
    if (before.storage_path && before.src !== src) previousPath = before.storage_path as string;
    const patch = { ...record, src, ...(storagePath !== undefined ? { storage_path: storagePath } : {}) };
    if (storagePath === undefined && before.src !== src) patch.storage_path = null;
    const { error } = await db.from("showcase_items").update(patch).eq("id", id);
    if (error) return failed(error.message, storagePath);
  } else {
    const { data: last } = await db
      .from("showcase_items")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const sort_order = ((last?.[0]?.sort_order as number | undefined) ?? -1) + 1;
    const { data, error } = await db
      .from("showcase_items")
      .insert({ ...record, src, storage_path: storagePath ?? null, sort_order })
      .select("id")
      .single();
    if (error) return failed(error.message, storagePath);
    done();
    return { ok: true, id: data.id as string, src, message: record.published ? "Added to the showcase." : "Saved as hidden." };
  }

  if (previousPath) await db.storage.from(SHOWCASE_BUCKET).remove([previousPath]);
  done();
  return { ok: true, id, src, message: record.published ? "Saved. The showcase is updated." : "Saved and hidden from the site." };
}

async function failed(detail: string, uploaded?: string | null): Promise<ShowcaseActionResult> {
  console.error("showcase save failed:", detail);
  // Don't leave an orphaned upload behind.
  if (uploaded) await getSupabase()?.storage.from(SHOWCASE_BUCKET).remove([uploaded]);
  return { ok: false, message: "The email wasn't saved because the database didn't respond. Try again." };
}

export async function deleteShowcaseItem(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UUID.test(id)) return { ok: false, message: "Couldn't delete that email." };
  const { data } = await db.from("showcase_items").select("storage_path").eq("id", id).maybeSingle();
  const { error } = await db.from("showcase_items").delete().eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete that email. Try again." };
  if (data?.storage_path) await db.storage.from(SHOWCASE_BUCKET).remove([data.storage_path as string]);
  done();
  return { ok: true, message: "Email removed from the showcase." };
}

export async function setShowcasePublished(id: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UUID.test(id)) return { ok: false, message: "Couldn't update that email." };
  const { error } = await db
    .from("showcase_items")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: "Couldn't update that email. Try again." };
  done();
  return { ok: true, message: published ? "Shown on the site." : "Hidden from the site." };
}

export async function reorderShowcase(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || ids.length > 200 || !ids.every((id) => UUID.test(id))) {
    return { ok: false, message: "Couldn't save the new order." };
  }
  const results = await Promise.all(
    ids.map((id, i) => db.from("showcase_items").update({ sort_order: i }).eq("id", id)),
  );
  if (results.some((r) => r.error)) return { ok: false, message: "Couldn't save the new order. Try again." };
  done();
  return { ok: true, message: "Order saved." };
}

/**
 * Adds the placeholder emails from site.ts after whatever is already in the
 * showcase, skipping any that are already there, so it is safe to click twice.
 */
export async function importDefaultShowcase(): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return NO_DB;
  const { data: existing, error: readError } = await db.from("showcase_items").select("src, sort_order");
  if (readError) return { ok: false, message: "Couldn't read the showcase_items table. Run supabase/schema.sql again." };
  const have = new Set(existing.map((r) => r.src as string));
  const start = existing.reduce((max, r) => Math.max(max, r.sort_order as number), -1) + 1;
  const rows = site.showcase.items
    .filter((it) => !have.has(it.src))
    .map((it, i) => ({ ...it, published: true, sort_order: start + i }));
  if (rows.length === 0) return { ok: false, message: "All the placeholders are already in the showcase." };
  const { error } = await db.from("showcase_items").insert(rows);
  if (error) return { ok: false, message: "The import failed. Try again." };
  done();
  return {
    ok: true,
    message: `Added ${rows.length} placeholder${rows.length === 1 ? "" : "s"} after your emails. Edit or replace them one by one.`,
  };
}
