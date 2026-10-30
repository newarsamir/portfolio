import "server-only";
import { cache } from "react";
import { explainDbError } from "./db-status";
import { canOpenInBrowser } from "./link-utils";
import { getSupabase } from "./supabase";

/** Private bucket: files are only reachable through /go/<slug>, so turning a link off really stops it. */
export const FILES_BUCKET = "files";

export type LinkKind = "file" | "url";

export type LinkRecord = {
  id: string;
  createdAt: string;
  slug: string;
  kind: LinkKind;
  title: string;
  /** For a URL link: where it sends people. Empty for a file. */
  target: string;
  storagePath: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  /** Files: save to disk instead of opening in the browser tab. */
  download: boolean;
  enabled: boolean;
  clicks: number;
  lastClickedAt: string | null;
};

type Row = {
  id: string;
  created_at: string;
  slug: string;
  kind: string;
  title: string | null;
  target: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  download: boolean;
  enabled: boolean;
  clicks: number;
  last_clicked_at: string | null;
};

const COLUMNS =
  "id, created_at, slug, kind, title, target, storage_path, file_name, file_type, file_size, download, enabled, clicks, last_clicked_at";

const fromRow = (r: Row): LinkRecord => ({
  id: r.id,
  createdAt: r.created_at,
  slug: r.slug,
  kind: r.kind === "file" ? "file" : "url",
  title: r.title ?? "",
  target: r.target ?? "",
  storagePath: r.storage_path,
  fileName: r.file_name ?? "",
  fileType: r.file_type ?? "",
  fileSize: Number(r.file_size ?? 0),
  download: r.download,
  enabled: r.enabled,
  clicks: r.clicks,
  lastClickedAt: r.last_clicked_at,
});

/** Every link, newest first, for /admin. */
export const getAllLinks = cache(async (): Promise<{ items: LinkRecord[]; fromDb: boolean; error: string | null }> => {
  const db = getSupabase();
  if (!db) return { items: [], fromDb: false, error: null };
  try {
    const { data, error } = await db.from("links").select(COLUMNS).order("created_at", { ascending: false });
    if (error || !data) return { items: [], fromDb: false, error: explainDbError(error, "links") };
    return { items: (data as Row[]).map(fromRow), fromDb: true, error: null };
  } catch {
    return { items: [], fromDb: false, error: explainDbError({ message: "fetch failed" }, "links") };
  }
});

export async function getLinkBySlug(slug: string): Promise<LinkRecord | null> {
  const db = getSupabase();
  if (!db) return null;
  try {
    const { data } = await db.from("links").select(COLUMNS).eq("slug", slug).maybeSingle();
    return data ? fromRow(data as Row) : null;
  } catch {
    return null;
  }
}

/** Counts a visit. Best effort: a failed count never blocks the redirect. */
export async function countClick(link: LinkRecord) {
  const db = getSupabase();
  if (!db) return;
  try {
    await db.from("links").update({ clicks: link.clicks + 1, last_clicked_at: new Date().toISOString() }).eq("id", link.id);
  } catch {
    // best effort
  }
}

/**
 * A short-lived link to the stored file. PDFs, images, video and audio open in
 * the tab unless the link says download; anything else always downloads,
 * under its original name.
 */
export async function signedFileUrl(link: LinkRecord): Promise<string | null> {
  const db = getSupabase();
  if (!db || !link.storagePath) return null;
  const download = link.download || !canOpenInBrowser(link.fileType);
  const { data, error } = await db.storage
    .from(FILES_BUCKET)
    .createSignedUrl(link.storagePath, 60 * 10, download ? { download: link.fileName || true } : undefined);
  if (error || !data) {
    console.error("signed download failed:", error?.message);
    return null;
  }
  return data.signedUrl;
}
