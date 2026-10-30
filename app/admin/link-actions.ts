"use server";

import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { MAX_FILE, SLUG, cleanTarget } from "@/lib/link-utils";
import { FILES_BUCKET } from "@/lib/links";
import { getSupabase } from "@/lib/supabase";
import type { ActionResult } from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** <uuid>/<cleaned original name>: the name stays readable in Supabase and in downloads. */
const UPLOADED = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[\w-][\w.-]{0,139}$/;
const NO_DB: ActionResult = { ok: false, message: "Supabase isn't connected, so links can't be changed." };

/** Storage keys allow a narrow set of characters. */
function storageName(name: string) {
  const clean = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^[-.]+|-+$/g, "");
  return (clean || "file").slice(-140);
}

/**
 * Files go from the browser straight to storage with a one-time signed link
 * (a server action caps a request at about 4.5 MB on Vercel).
 */
export async function createFileUpload(name: string, type: string, size: number): Promise<ActionResult & { path?: string; signedUrl?: string }> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return NO_DB;
  if (!Number.isFinite(size) || size <= 0) return { ok: false, message: "That file is empty." };
  if (size > MAX_FILE) return { ok: false, message: "That file is over 50 MB. Put it on Drive and add the Drive link instead." };
  const path = `${randomUUID()}/${storageName(String(name))}`;
  const { data, error } = await db.storage.from(FILES_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("file upload link failed:", error?.message, type);
    return { ok: false, message: "The upload couldn't start. The Database page checks the 'files' storage bucket." };
  }
  return { ok: true, message: "Ready to upload.", path, signedUrl: data.signedUrl };
}

/** Removes an upload that was never saved as a link (the editor was closed, or saving failed). */
export async function discardUpload(path: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UPLOADED.test(path)) return { ok: false, message: "Nothing to remove." };
  await db.storage.from(FILES_BUCKET).remove([path]);
  return { ok: true, message: "Removed." };
}

export type LinkInput = {
  id?: string;
  kind: "file" | "url";
  title: string;
  slug: string;
  target?: string;
  file?: { path: string; name: string; type: string; size: number };
  download?: boolean;
  enabled?: boolean;
};

async function uploaded(path: string) {
  const db = getSupabase();
  if (!db) return false;
  const [dir, name] = path.split("/");
  const { data } = await db.storage.from(FILES_BUCKET).list(dir, { search: name });
  return Boolean(data?.some((o) => o.name === name));
}

export async function saveLink(input: LinkInput): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return NO_DB;

  const id = input.id ? String(input.id) : "";
  if (id && !UUID.test(id)) return { ok: false, message: "That link no longer exists." };
  const kind = input.kind === "file" ? "file" : "url";
  const slug = String(input.slug ?? "").trim().toLowerCase();
  if (!SLUG.test(slug)) {
    return { ok: false, message: "The link name can use lowercase letters, numbers and dashes, like brand-guide." };
  }

  const record: Record<string, unknown> = {
    slug,
    kind,
    title: String(input.title ?? "").trim().slice(0, 120),
    download: Boolean(input.download),
    enabled: input.enabled !== false,
    updated_at: new Date().toISOString(),
  };

  let newFile: string | null = null;
  if (kind === "url") {
    const target = cleanTarget(String(input.target ?? ""));
    if (!target) return { ok: false, message: "Paste a full link, like https://drive.google.com/…, or a path on this site." };
    if (target.replace(/\/+$/, "") === `/go/${slug}`) return { ok: false, message: "A link can't send people to itself." };
    Object.assign(record, { target, storage_path: null, file_name: null, file_type: null, file_size: null });
  } else if (input.file) {
    const f = input.file;
    if (!UPLOADED.test(f.path) || !(await uploaded(f.path))) return { ok: false, message: "The file didn't finish uploading. Pick it again." };
    newFile = f.path;
    Object.assign(record, {
      target: null,
      storage_path: f.path,
      file_name: String(f.name).slice(0, 200),
      file_type: String(f.type || "application/octet-stream").slice(0, 120),
      file_size: Math.max(0, Math.round(Number(f.size) || 0)),
    });
  } else if (!id) {
    return { ok: false, message: "Upload a file first." };
  }

  const taken = (e: { code?: string } | null) =>
    e?.code === "23505" ? { ok: false, message: `/go/${slug} is already used by another link. Pick another name.` } : null;

  if (id) {
    const { data: before } = await db.from("links").select("kind, storage_path").eq("id", id).maybeSingle();
    if (!before) return { ok: false, message: "That link no longer exists." };
    if (kind === "file" && !newFile && !before.storage_path) return { ok: false, message: "Upload a file first." };
    const { error } = await db.from("links").update(record).eq("id", id);
    if (error) return taken(error) ?? { ok: false, message: "The link wasn't saved. Try again." };
    // The old file is no longer used: replaced, or the link now points to a URL.
    const old = before.storage_path as string | null;
    if (old && (newFile || kind === "url") && old !== newFile) await db.storage.from(FILES_BUCKET).remove([old]);
    return { ok: true, message: "Saved. The link works with the change right away.", id };
  }

  const { data, error } = await db.from("links").insert(record).select("id").single();
  if (error || !data) return taken(error) ?? { ok: false, message: "The link wasn't saved. Try again." };
  return { ok: true, message: `Your link is ready: /go/${slug}`, id: data.id as string };
}

export async function deleteLink(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UUID.test(id)) return { ok: false, message: "Couldn't delete that link." };
  const { data } = await db.from("links").select("storage_path").eq("id", id).maybeSingle();
  const { error } = await db.from("links").delete().eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete that link. Try again." };
  if (data?.storage_path) await db.storage.from(FILES_BUCKET).remove([data.storage_path as string]);
  return { ok: true, message: "Link deleted. Its address now shows the 404 page." };
}

export async function setLinkEnabled(id: string, enabled: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UUID.test(id)) return { ok: false, message: "Couldn't update that link." };
  const { error } = await db.from("links").update({ enabled, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, message: "Couldn't update that link. Try again." };
  return { ok: true, message: enabled ? "Link turned on." : "Link turned off. It shows the 404 page until you turn it back on." };
}
