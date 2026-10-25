"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Site } from "@/content/site";
import { requireAdmin } from "@/lib/auth";
import { type ContentKey, type PageId, type PageLayout, isPlainObject, mergeContentKey, normalizeLayout, omitPaths, sectionById } from "@/lib/cms";
import { contentKey, getContent, layoutKey } from "@/lib/content";
import { imageSourceOk } from "@/lib/images";
import { SETTING_KEYS } from "@/lib/settings";
import { SHOWCASE_BUCKET } from "@/lib/showcase";
import { getSupabase } from "@/lib/supabase";
import type { ActionResult } from "./actions";

export type SectionResult = ActionResult & { values?: Partial<Site> };

const NO_DB: ActionResult = { ok: false, message: "Supabase isn't connected, so changes can't be saved yet." };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IMAGE_KEYS = /^(image|portrait|cover|poster|src|favicon)$/i;

/** Older single settings that a section's content replaces. */
const LEGACY: Partial<Record<ContentKey, string[]>> = {
  counters: [SETTING_KEYS.counters],
  brandStrip: [SETTING_KEYS.brands],
  showcase: [SETTING_KEYS.showcaseHeading, SETTING_KEYS.showcaseSub],
};

function safeHref(href: string) {
  if (!href || href === "#") return true;
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

/** Finds the first link or image that isn't allowed, with a message saying which. */
function problem(value: unknown, key = ""): string | null {
  if (typeof value === "string") {
    if (key === "href" && !safeHref(value.trim())) return `"${value.slice(0, 60)}" isn't a link the site can use. Start it with https://, mailto: or /.`;
    if (IMAGE_KEYS.test(key) && value.trim() && !imageSourceOk(value.trim())) return `"${value.slice(0, 60)}" isn't an uploaded image, a site path or an https link.`;
    return null;
  }
  if (Array.isArray(value)) {
    for (const v of value) {
      const p = problem(v, key);
      if (p) return p;
    }
    return null;
  }
  if (isPlainObject(value)) {
    for (const [k, v] of Object.entries(value)) {
      const p = problem(v, k);
      if (p) return p;
    }
  }
  return null;
}

export async function saveSection(sectionId: string, values: Record<string, unknown>): Promise<SectionResult> {
  await requireAdmin();
  const section = sectionById(sectionId);
  if (!section) return { ok: false, message: "That section doesn't exist." };
  const db = getSupabase();
  if (!db) return NO_DB;
  if (!isPlainObject(values) || JSON.stringify(values).length > 300_000) {
    return { ok: false, message: "That's too much content to save in one go." };
  }

  const out: Partial<Record<ContentKey, unknown>> = {};
  for (const key of section.keys) {
    if (!(key in values)) continue;
    const merged = mergeContentKey(key, omitPaths(key, values[key], section.omit));
    const bad = problem(merged, key);
    if (bad) return { ok: false, message: bad };
    out[key] = merged;
  }
  if (typeof out.email === "string" && !EMAIL.test(out.email.trim())) {
    return { ok: false, message: "The email address doesn't look right. Check it and save again." };
  }
  if (typeof out.name === "string" && !out.name.trim()) return { ok: false, message: "The site needs a name." };

  const now = new Date().toISOString();
  const rows = Object.entries(out).map(([key, value]) => ({
    key: contentKey(key as ContentKey),
    value: omitPaths(key as ContentKey, value, section.omit),
    updated_at: now,
  }));
  if (!rows.length) return { ok: true, message: "Nothing to save." };
  const { error } = await db.from("settings").upsert(rows, { onConflict: "key" });
  if (error) {
    console.error("section save failed:", error.message);
    return { ok: false, message: "The changes weren't saved because the database didn't respond. Try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: `${section.label} saved. It's live on the site.`, values: out as Partial<Site> };
}

/** Puts a section back to the text in content/site.ts. */
export async function resetSection(sectionId: string): Promise<SectionResult> {
  await requireAdmin();
  const section = sectionById(sectionId);
  if (!section) return { ok: false, message: "That section doesn't exist." };
  const db = getSupabase();
  if (!db) return NO_DB;

  const keys = section.keys.flatMap((k) => [contentKey(k), ...(LEGACY[k] ?? [])]);
  const { error } = await db.from("settings").delete().in("key", keys);
  if (error) return { ok: false, message: "The section wasn't reset because the database didn't respond. Try again." };
  revalidatePath("/", "layout");

  const fresh = await getContent();
  const values = Object.fromEntries(section.keys.map((k) => [k, fresh[k]])) as Partial<Site>;
  return { ok: true, message: `${section.label} is back to the original text.`, values };
}

export async function saveLayout(page: PageId | "global", layout: PageLayout): Promise<ActionResult & { layout?: PageLayout }> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return NO_DB;
  if (!["home", "work", "case", "contact", "notFound", "global"].includes(page)) return { ok: false, message: "Unknown page." };

  const clean = normalizeLayout(page, layout);
  const { error } = await db
    .from("settings")
    .upsert({ key: layoutKey(page), value: clean, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { ok: false, message: "The change wasn't saved because the database didn't respond. Try again." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved.", layout: clean };
}

const MAX_UPLOAD = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

/** Uploads an image for a page section and returns its public link. */
export async function uploadContentImage(form: FormData): Promise<ActionResult & { src?: string }> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return NO_DB;
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Pick an image to upload." };
  const ext = TYPES[file.type];
  if (!ext) return { ok: false, message: "Upload a WebP, PNG, JPEG, GIF, AVIF or ICO image." };
  if (file.size > MAX_UPLOAD) return { ok: false, message: "That image is over 4 MB. Export it as WebP to shrink it." };

  const path = `content/${randomUUID()}.${ext}`;
  const { error } = await db.storage
    .from(SHOWCASE_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("content upload failed:", error.message);
    return { ok: false, message: "The upload failed. Check that the 'showcase' storage bucket exists (run supabase/schema.sql), then try again." };
  }
  return { ok: true, message: "Image uploaded.", src: db.storage.from(SHOWCASE_BUCKET).getPublicUrl(path).data.publicUrl };
}
