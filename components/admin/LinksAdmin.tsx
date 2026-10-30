"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createFileUpload, deleteLink, discardUpload, saveLink, setLinkEnabled } from "@/app/admin/link-actions";
import { putToSignedUrl } from "@/lib/admin-upload";
import { MAX_FILE, SLUG, canOpenInBrowser, cleanTarget, driveDownloadUrl, driveFileId, formatBytes, slugify } from "@/lib/link-utils";
import { toast } from "@/lib/toast";

export type AdminLink = {
  id: string;
  createdAt: string;
  slug: string;
  kind: "file" | "url";
  title: string;
  target: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  download: boolean;
  enabled: boolean;
  clicks: number;
  lastClickedAt: string | null;
};

const ago = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function since(iso: string) {
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [[60, "second"], [60, "minute"], [24, "hour"], [30, "day"], [12, "month"], [Infinity, "year"]];
  let v = s;
  for (const [n, unit] of steps) {
    if (Math.abs(v) < n) return ago.format(Math.round(v), unit);
    v /= n;
  }
  return "";
}

const extOf = (name: string) => (name.match(/\.([a-z0-9]{1,5})$/i)?.[1] ?? "file").toUpperCase();
const hostOf = (url: string) => {
  try {
    return url.startsWith("/") ? "this site" : new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
const randomSlug = () => Math.random().toString(36).slice(2, 8);

async function copy(text: string, quiet = false) {
  try {
    await navigator.clipboard.writeText(text);
    if (!quiet) toast.success(text, "Link copied");
    return true;
  } catch {
    if (!quiet) toast.info(text, "Copy this link");
    return false;
  }
}

/** Uploaded files and pasted links, each shared from the site's own address: /go/<name>. */
export default function LinksAdmin({
  items,
  fromDb,
  dbConnected,
  loadError,
  siteUrl,
}: {
  items: AdminLink[];
  fromDb: boolean;
  dbConnected: boolean;
  loadError: string | null;
  siteUrl: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [editing, setEditing] = useState<AdminLink | "file" | "url" | null>(null);
  const [busy, startTransition] = useTransition();
  const canEdit = dbConnected && fromDb;
  const short = (slug: string) => `${siteUrl}/go/${slug}`;
  const shown = siteUrl.replace(/^https?:\/\//, "");

  useEffect(() => setRows(items), [items]);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const res = await fn();
      toast.result(res);
      router.refresh();
    });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-[0.95rem] text-muted">
          Upload a PDF, image, ZIP or any file, or paste a link (a Google Drive share, say). Each one gets a short address
          on your site, <code className="mono text-ink">{shown}/go/your-name</code>, that you can share anywhere and change
          later without breaking it.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-lime btn-sm" disabled={!canEdit} onClick={() => setEditing("file")}>
            Upload a file
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!canEdit} onClick={() => setEditing("url")}>
            Add a link
          </button>
        </div>
      </div>

      {!canEdit && (
        <p role="alert" className="mt-5 rounded-xl border border-danger/40 bg-surface p-4 text-[0.95rem]">
          {loadError ?? "Supabase isn't connected, so files and links can't be added."} The Database page has a full check.
        </p>
      )}

      {canEdit && rows.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-line p-8 text-center text-muted">
          Nothing here yet. Upload your rate card or a brand guide, or paste a Drive link, and you&apos;ll get a link like{" "}
          <span className="mono text-ink">{shown}/go/rate-card</span>.
        </p>
      )}

      {rows.length > 0 && (
        <ul className="mt-6 divide-y divide-line overflow-clip rounded-2xl border border-line">
          {rows.map((l) => {
            const drive = l.kind === "url" && driveFileId(l.target);
            return (
              <li key={l.id} data-testid="link-row" className={`grid gap-4 p-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center ${l.enabled ? "" : "bg-surface/60"}`}>
                <span
                  aria-hidden="true"
                  className={`mono grid h-12 w-12 place-items-center rounded-xl text-[0.7rem] font-semibold ${
                    l.kind === "file" ? "bg-lime text-on-lime" : "border border-line bg-surface"
                  }`}
                >
                  {l.kind === "file" ? extOf(l.fileName) : drive ? "DRIVE" : "LINK"}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{l.title || l.fileName || l.slug}</span>
                    {!l.enabled && <span className="mono rounded-full border border-line px-2 py-0.5 text-[0.7rem]">Off</span>}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <a href={short(l.slug)} target="_blank" rel="noreferrer" className="mono truncate text-[0.85rem] underline decoration-line underline-offset-4 hover:decoration-ink">
                      {shown}/go/{l.slug}
                    </a>
                    <button type="button" onClick={() => copy(short(l.slug))} className="mono rounded-full border border-line px-2.5 py-0.5 text-[0.75rem] hover:bg-ink hover:text-bg">
                      Copy
                    </button>
                  </p>
                  <p className="mt-1 truncate text-[0.85rem] text-muted">
                    {l.kind === "file" ? (
                      <>
                        {l.fileName} · {formatBytes(l.fileSize)} · {l.download || !canOpenInBrowser(l.fileType) ? "downloads" : "opens in the browser"}
                      </>
                    ) : (
                      <>
                        Goes to <span title={l.target}>{hostOf(l.target)}</span>
                      </>
                    )}
                    {" · "}
                    {l.clicks === 1 ? "1 open" : `${l.clicks} opens`}
                    {l.lastClickedAt ? `, last ${since(l.lastClickedAt)}` : ""}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex flex-wrap gap-1 text-[0.8rem] sm:justify-end">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={l.enabled}
                      aria-label={`${l.title || l.slug} is ${l.enabled ? "on" : "off"}`}
                      disabled={busy}
                      onClick={() => {
                        setRows((r) => r.map((x) => (x.id === l.id ? { ...x, enabled: !l.enabled } : x)));
                        run(() => setLinkEnabled(l.id, !l.enabled));
                      }}
                      className="rounded-lg border border-line px-2.5 py-1 hover:bg-surface"
                    >
                      {l.enabled ? "Turn off" : "Turn on"}
                    </button>
                    <button type="button" onClick={() => setEditing(l)} className="rounded-lg border border-line px-2.5 py-1 hover:bg-surface">
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        const what = l.kind === "file" ? "the link and the uploaded file" : "the link";
                        if (!window.confirm(`Delete /go/${l.slug}? This removes ${what}, and anyone who has it will see the 404 page.`)) return;
                        setRows((r) => r.filter((x) => x.id !== l.id));
                        run(() => deleteLink(l.id));
                      }}
                      className="rounded-lg border border-line px-2.5 py-1 text-danger hover:bg-surface"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <Editor
          key={typeof editing === "string" ? editing : editing.id}
          initial={typeof editing === "string" ? null : editing}
          mode={typeof editing === "string" ? editing : editing.kind}
          shown={shown}
          short={short}
          onClose={(saved) => {
            setEditing(null);
            if (saved) router.refresh();
          }}
        />
      )}
    </div>
  );
}

type Upload = { path: string; name: string; type: string; size: number };

function Editor({
  initial,
  mode,
  shown,
  short,
  onClose,
}: {
  initial: AdminLink | null;
  mode: "file" | "url";
  shown: string;
  short: (slug: string) => string;
  onClose: (saved: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<"file" | "url">(mode);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? (mode === "url" ? randomSlug() : ""));
  const slugTouched = useRef(Boolean(initial));
  const [target, setTarget] = useState(initial?.kind === "url" ? initial.target : "");
  const [skipDrivePage, setSkipDrivePage] = useState(false);
  const [download, setDownload] = useState(initial?.download ?? false);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const saved = useRef(false);
  const pending = useRef<string | null>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // An upload that never became a link is removed when the editor closes.
  const finish = (ok: boolean) => {
    if (!ok && pending.current) void discardUpload(pending.current);
    close.current(ok);
  };

  const follow = (t: string) => {
    setTitle(t);
    if (!slugTouched.current) {
      const s = slugify(t);
      if (s) setSlug(s);
    }
  };

  const pick = async (f: File | undefined | null) => {
    if (!f) return;
    if (f.size > MAX_FILE) {
      toast.error(`It's ${formatBytes(f.size)}. Files can be up to 50 MB; for bigger ones, add the Drive link instead.`, "That file is too big");
      return;
    }
    if (f.size === 0) {
      toast.error("That file is empty.", "That file won't work");
      return;
    }
    setProgress(0);
    try {
      const res = await createFileUpload(f.name, f.type, f.size);
      if (!res.ok || !res.path || !res.signedUrl) throw new Error(res.message);
      await putToSignedUrl(res.signedUrl, f, setProgress);
      if (pending.current) void discardUpload(pending.current);
      pending.current = res.path;
      setUpload({ path: res.path, name: f.name, type: f.type || "application/octet-stream", size: f.size });
      if (!title) follow(f.name.replace(/\.[a-z0-9]{1,5}$/i, "").replace(/[-_]+/g, " "));
      else if (!slugTouched.current) setSlug(slugify(title));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The upload failed.", "Upload failed");
    } finally {
      setProgress(null);
    }
  };

  const driveId = kind === "url" ? driveFileId(cleanTarget(target) ?? "") : null;
  const fileType = upload?.type ?? (initial?.kind === "file" ? initial.fileType : "");
  const fileName = upload?.name ?? (initial?.kind === "file" ? initial.fileName : "");
  const hasFile = Boolean(upload || (initial?.kind === "file" && initial.fileName));
  const slugOk = SLUG.test(slug);
  const targetOk = kind === "file" || Boolean(cleanTarget(target));
  const ready = slugOk && targetOk && (kind === "url" || hasFile) && progress === null && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    const clean = cleanTarget(target) ?? "";
    const res = await saveLink({
      id: initial?.id,
      kind,
      title,
      slug,
      target: kind === "url" ? (driveId && skipDrivePage ? driveDownloadUrl(driveId) : clean) : undefined,
      file: kind === "file" && upload ? upload : undefined,
      download,
      enabled,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    // A file uploaded before switching to a link isn't needed.
    if (kind === "url" && pending.current) void discardUpload(pending.current);
    pending.current = null;
    saved.current = true;
    const copied = !initial && (await copy(short(slug), true));
    toast.success(copied ? `${shown}/go/${slug} is copied, ready to paste.` : res.message, initial ? "Saved" : "Link ready");
    dialog.current?.close();
  };

  return (
    <dialog
      ref={dialog}
      className="admin-dialog"
      aria-labelledby="ln-editor-h"
      onClose={() => finish(saved.current)}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialog.current?.close();
      }}
    >
      <form onSubmit={submit} className="grid max-h-[92dvh] gap-5 overflow-y-auto p-5 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 id="ln-editor-h" className="font-display text-2xl font-semibold">
            {initial ? "Edit link" : kind === "file" ? "Upload a file" : "Add a link"}
          </h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="-mr-2 -mt-1 grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-ink hover:text-bg"
          >
            ✕
          </button>
        </div>

        <fieldset>
          <legend className="mb-2 font-medium">What it opens</legend>
          <div className="flex flex-wrap gap-2">
            {(["file", "url"] as const).map((k) => (
              <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 ${kind === k ? "border-ink bg-surface" : "border-line"}`}>
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="accent-[var(--lime-deep)]" />
                {k === "file" ? "A file I upload" : "A link (Drive, Dropbox, any URL)"}
              </label>
            ))}
          </div>
        </fieldset>

        {kind === "file" ? (
          <div>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pick(e.dataTransfer.files[0]);
              }}
              data-dragging={dragging || undefined}
              className="dropzone block cursor-pointer rounded-2xl border-2 border-dashed border-line bg-surface p-6 text-center"
            >
              {progress !== null ? (
                <span className="block" aria-live="polite">
                  <span className="mb-3 block font-medium">Uploading… {progress}%</span>
                  <span className="block h-2 overflow-clip rounded-full bg-line">
                    <span className="block h-full bg-lime transition-[width]" style={{ width: `${progress}%` }} />
                  </span>
                </span>
              ) : hasFile ? (
                <span className="block">
                  <span className="mono mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl bg-lime text-[0.7rem] font-semibold text-on-lime">{extOf(fileName)}</span>
                  <span className="block truncate font-medium">{fileName}</span>
                  <span className="mono mt-1 block text-xs text-muted">
                    {formatBytes(upload?.size ?? initial?.fileSize ?? 0)}
                    {upload ? " · uploaded" : ""} · click or drop to replace
                  </span>
                </span>
              ) : (
                <span className="block text-muted">
                  <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-lime text-2xl text-on-lime">↑</span>
                  Drop a file here, or click to choose one.
                  <span className="mono mt-2 block text-xs">PDF, PNG, ZIP, anything, up to 50 MB</span>
                </span>
              )}
              <input type="file" className="sr-only" data-testid="link-file" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            {hasFile && (
              canOpenInBrowser(fileType) ? (
                <label className="mt-3 flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={download} onChange={(e) => setDownload(e.target.checked)} className="h-5 w-5 accent-[var(--lime-deep)]" />
                  <span>Download it instead of opening it in the browser</span>
                </label>
              ) : (
                <p className="mt-3 text-[0.9rem] text-muted">This kind of file always downloads.</p>
              )
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="ln-target" className="mb-2 block font-medium">
              Link
            </label>
            <input
              id="ln-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="https://drive.google.com/file/d/…/view"
              inputMode="url"
              autoComplete="off"
              className="field"
            />
            {target && !cleanTarget(target) && <p className="mt-1.5 text-[0.9rem] text-danger">That isn&apos;t a full link. It should start with https://</p>}
            {driveId && (
              <label className="mt-3 flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={skipDrivePage} onChange={(e) => setSkipDrivePage(e.target.checked)} className="h-5 w-5 accent-[var(--lime-deep)]" />
                <span>Download straight away (skip Drive&apos;s preview page)</span>
              </label>
            )}
            {driveId && (
              <p className="mt-1.5 text-[0.9rem] text-muted">Make sure the file is shared as &quot;Anyone with the link&quot; in Drive.</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="ln-title" className="mb-2 block font-medium">
            Name (for you)
          </label>
          <input id="ln-title" value={title} maxLength={120} onChange={(e) => follow(e.target.value)} placeholder="Rate card 2026" className="field" />
        </div>

        <div>
          <label htmlFor="ln-slug" className="mb-2 block font-medium">
            Link address
          </label>
          <div className="flex items-stretch overflow-clip rounded-xl border border-line focus-within:border-ink">
            <span className="mono hidden items-center whitespace-nowrap bg-surface px-3 text-[0.85rem] text-muted sm:flex">{shown}/go/</span>
            <input
              id="ln-slug"
              value={slug}
              maxLength={64}
              onChange={(e) => {
                slugTouched.current = true;
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              }}
              placeholder="rate-card"
              autoComplete="off"
              aria-describedby="ln-slug-help"
              className="mono min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none"
            />
          </div>
          <p id="ln-slug-help" className={`mt-1.5 text-[0.9rem] ${slug && !slugOk ? "text-danger" : "text-muted"}`}>
            {slug && !slugOk
              ? "Use lowercase letters, numbers and dashes, and start and end with a letter or number."
              : initial && initial.slug !== slug
                ? `The old address /go/${initial.slug} will stop working.`
                : `People will open ${shown}/go/${slug || "…"}`}
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-[var(--lime-deep)]" />
          <span>Link is on</span>
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button type="submit" className="btn btn-lime" disabled={!ready}>
            {saving ? "Saving" : progress !== null ? "Uploading" : initial ? "Save changes" : "Create link"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => dialog.current?.close()}>
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  );
}
