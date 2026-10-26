"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  createVideoUpload,
  deleteShowcaseItem,
  importDefaultShowcase,
  reorderShowcase,
  saveShowcaseItem,
  setShowcasePublished,
} from "@/app/admin/showcase-actions";
import { isVideoSrc, MAX_VIDEO, readMp4Size, VIDEO_TYPES } from "@/lib/media";
import { putToSignedUrl } from "@/lib/admin-upload";
import { pdfToImage } from "@/lib/pdf-to-image";
import { toast } from "@/lib/toast";

export type AdminShowcaseItem = {
  id: string | null;
  src: string;
  width: number;
  height: number;
  brand: string;
  type: string;
  note: string;
  published: boolean;
  uploaded: boolean;
};

const MAX_UPLOAD = 4 * 1024 * 1024;
const ACCEPT = "image/webp,image/png,image/jpeg,image/gif,image/avif,application/pdf";
const VIDEO_ACCEPT = Object.keys(VIDEO_TYPES).join(",");

export default function ShowcaseAdmin({
  items,
  fromDb,
  dbConnected,
  loadError,
  placeholderSrcs,
  onEditText,
}: {
  placeholderSrcs: string[];
  items: AdminShowcaseItem[];
  fromDb: boolean;
  dbConnected: boolean;
  loadError: string | null;
  onEditText: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [editing, setEditing] = useState<AdminShowcaseItem | "new" | null>(null);
  const [busy, startTransition] = useTransition();
  const canEdit = dbConnected && fromDb;
  const showingDefaults = canEdit && rows.length === 0;
  const missingPlaceholders = placeholderSrcs.filter((src) => !rows.some((r) => r.src === src)).length;

  useEffect(() => setRows(items), [items]);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const res = await fn();
      toast.result(res);
      if (res.ok) router.refresh();
    });

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[index], next[j]] = [next[j], next[index]];
    setRows(next);
    run(() => reorderShowcase(next.map((r) => r.id!)));
  };

  return (
    <div className="space-y-10">
      <p className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-muted">
        The section heading and intro are edited in the page editor.
        <button type="button" className="cms-btn" onClick={onEditText}>
          Edit in Pages →
        </button>
      </p>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Emails</h2>
            <p className="text-[0.95rem] text-muted">
              Shown in the 3D arc on desktop and the swipe row on phones, in this order.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && missingPlaceholders > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(importDefaultShowcase)}>
                {rows.length === 0
                  ? "Import the placeholders"
                  : missingPlaceholders === 1
                    ? "Add the missing placeholder"
                    : `Add the ${missingPlaceholders} placeholders after these`}
              </button>
            )}
            <button type="button" className="btn btn-lime btn-sm" disabled={!canEdit} onClick={() => setEditing("new")}>
              Add an email
            </button>
          </div>
        </div>

        {!canEdit && (
          <p role="alert" className="mt-5 rounded-xl border border-danger/40 bg-surface p-4 text-[0.95rem]">
            {loadError ?? (
              <>
                Supabase isn&apos;t connected, so these are the read-only placeholders from content/site.ts. Add{" "}
                <code className="mono">SUPABASE_URL</code> and <code className="mono">SUPABASE_SERVICE_ROLE_KEY</code> in
                Vercel to upload and manage emails here.
              </>
            )}{" "}
            The Settings tab has a full database check.
          </p>
        )}
        {showingDefaults && (
          <p className="mt-5 rounded-xl border border-line bg-surface p-4 text-[0.95rem]">
            The table is empty, so the site is showing the placeholders from <code className="mono">content/site.ts</code>.
            Add your first email, or import the placeholders to edit them here.
          </p>
        )}

        {rows.length > 0 && (
          <ol className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {rows.map((it, i) => (
              <li
                key={it.id ?? it.src}
                data-testid="showcase-row"
                className={`group overflow-clip rounded-2xl border border-line bg-raised ${it.published ? "" : "opacity-60"}`}
              >
                <div className="relative aspect-[3/4] overflow-clip bg-surface">
                  {isVideoSrc(it.src) ? (
                    <video src={it.src} muted loop playsInline autoPlay preload="metadata" className="h-full w-full object-cover object-top" />
                  ) : (
                    <span className="hover-scroll block h-full w-full">
                      <img src={it.src} alt="" loading="lazy" className="hover-scroll-media" />
                    </span>
                  )}
                  <span className="mono absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-xs text-bg">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {!it.published && (
                    <span className="mono absolute right-2 top-2 rounded-full border border-line bg-bg px-2 py-0.5 text-xs">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate font-medium">{it.brand}</p>
                  <p className="truncate text-[0.85rem] text-muted">{it.type || "No type"}</p>
                  <p className="mono mt-1 text-[0.7rem] text-muted">
                    {it.width}×{it.height}
                    {it.uploaded ? " · uploaded" : ""}
                  </p>
                  {canEdit && (
                    <div className="mt-3 flex flex-wrap gap-1 text-[0.8rem]">
                      <button
                        type="button"
                        aria-label={`Move ${it.brand} earlier`}
                        disabled={busy || i === 0}
                        onClick={() => move(i, -1)}
                        className="rounded-lg border border-line px-2 py-1 hover:bg-surface disabled:opacity-40"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${it.brand} later`}
                        disabled={busy || i === rows.length - 1}
                        onClick={() => move(i, 1)}
                        className="rounded-lg border border-line px-2 py-1 hover:bg-surface disabled:opacity-40"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(() => setShowcasePublished(it.id!, !it.published))}
                        className="rounded-lg border border-line px-2 py-1 hover:bg-surface"
                      >
                        {it.published ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(it)}
                        className="rounded-lg border border-line px-2 py-1 hover:bg-surface"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (!window.confirm(`Remove "${it.brand}" from the showcase? This can't be undone.`)) return;
                          run(() => deleteShowcaseItem(it.id!));
                        }}
                        className="rounded-lg border border-line px-2 py-1 text-danger hover:bg-surface"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {editing && (
        <Editor
          key={editing === "new" ? "new" : editing.id ?? editing.src}
          initial={editing === "new" ? null : editing}
          onClose={(saved) => {
            setEditing(null);
            if (saved) router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------- Editor -------------------------------- */

function Editor({ initial, onClose }: { initial: AdminShowcaseItem | null; onClose: (saved: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(saveShowcaseItem, null);
  const [link, setLink] = useState(initial?.src ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(initial?.src ?? "");
  const [size, setSize] = useState<{ w: number; h: number } | null>(
    initial ? { w: initial.width, h: initial.height } : null,
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const videoInput = useRef<HTMLInputElement>(null);
  const [isVideo, setIsVideo] = useState(isVideoSrc(initial?.src ?? ""));
  const [converting, setConverting] = useState(false);
  // A video already sent to storage: its path, and the upload progress while it goes.
  const [uploaded, setUploaded] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  // The size read from the file itself, for when the browser can't preview the codec.
  const [fileSize, setFileSize] = useState<{ w: number; h: number } | null>(null);
  const busyMedia = converting || progress !== null;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!state) return;
    toast.result(state);
    if (state.ok) close.current(true);
  }, [state]);

  // Read the real pixel size of whatever is previewed.
  useEffect(() => {
    if (!preview) return;
    let live = true;
    if (isVideo) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.onloadedmetadata = () => {
        if (!live) return;
        setSize({ w: v.videoWidth, h: v.videoHeight });
        setLoadFailed(false);
      };
      v.onerror = () => {
        if (!live) return;
        setSize(fileSize);
        setLoadFailed(!fileSize);
      };
      v.src = preview;
      return () => {
        live = false;
      };
    }
    const img = new Image();
    img.onload = () => {
      if (!live) return;
      setSize({ w: img.naturalWidth, h: img.naturalHeight });
      setLoadFailed(false);
    };
    img.onerror = () => {
      if (!live) return;
      setSize(null);
      setLoadFailed(true);
    };
    img.src = preview;
    return () => {
      live = false;
    };
  }, [preview, isVideo, fileSize]);

  // Revoke object URLs made for local files.
  useEffect(() => () => void (preview.startsWith("blob:") && URL.revokeObjectURL(preview)), [preview]);

  const pick = async (f: File | undefined | null) => {
    if (!f) return;
    if (VIDEO_TYPES[f.type]) return pickVideo(f);
    if (f.type === "application/pdf") {
      setConverting(true);
      try {
        const image = await pdfToImage(f);
        toast.success("The PDF is now one tall image. Check it, then save.", "PDF converted");
        f = image;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "That PDF couldn't be read.", "PDF not converted");
        return;
      } finally {
        setConverting(false);
      }
    }
    if (!ACCEPT.split(",").includes(f.type)) {
      toast.error("Use a WebP, PNG, JPEG, GIF, AVIF or PDF file, or the video button for MP4 and WebM.", "That file won't work");
      return;
    }
    if (f.size > MAX_UPLOAD) {
      toast.error(`It's ${(f.size / 1024 / 1024).toFixed(1)} MB. Export it as WebP to get it under 4 MB.`, "That image is too big");
      return;
    }
    // Keep the input in sync so the file is part of the submitted form.
    if (fileInput.current && fileInput.current.files?.[0] !== f) {
      const dt = new DataTransfer();
      dt.items.add(f);
      fileInput.current.files = dt.files;
    }
    setFile(f);
    setUploaded("");
    setIsVideo(false);
    setSize(null);
    setPreview(URL.createObjectURL(f));
    if (!brand) setBrand(f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "));
  };

  const pickVideo = async (f: File) => {
    if (f.size > MAX_VIDEO) {
      toast.error(`It's ${(f.size / 1024 / 1024).toFixed(1)} MB. Keep videos under 50 MB.`, "That video is too big");
      return;
    }
    // A video replaces any image picked before it.
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    setIsVideo(true);
    setSize(null);
    setUploaded("");
    setFileSize(f.type === "video/mp4" ? await readMp4Size(f).catch(() => null) : null);
    setPreview(URL.createObjectURL(f));
    if (!brand) setBrand(f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "));
    setProgress(0);
    try {
      const start = await createVideoUpload(f.type, f.size);
      if (!start.ok || !start.signedUrl || !start.path) throw new Error(start.message);
      await putToSignedUrl(start.signedUrl, f, setProgress);
      setUploaded(start.path);
      toast.success("Video uploaded. Save to add it to the showcase.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The video didn't upload.", "Upload failed");
      setIsVideo(isVideoSrc(link));
      setPreview(link);
    } finally {
      setProgress(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploaded("");
    if (fileInput.current) fileInput.current.value = "";
    setIsVideo(isVideoSrc(link));
    setPreview(link);
  };

  return (
    <dialog
      ref={dialog}
      className="admin-dialog"
      aria-labelledby="sc-editor-h"
      onClose={() => close.current(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialog.current?.close();
      }}
    >
      <form action={action} className="grid max-h-[92dvh] gap-6 overflow-y-auto p-5 md:grid-cols-[18rem_1fr] md:p-7">
        <input type="hidden" name="id" value={initial?.id ?? ""} />
        <input type="hidden" name="width" value={size?.w ?? ""} />
        <input type="hidden" name="height" value={size?.h ?? ""} />
        <input type="hidden" name="uploaded" value={uploaded} />

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
            className="dropzone relative block aspect-[3/4] cursor-pointer overflow-clip rounded-2xl border-2 border-dashed border-line bg-surface"
          >
            {converting ? (
              <span className="grid h-full place-items-center p-6 text-center text-muted">Turning the PDF into one tall image…</span>
            ) : preview && !loadFailed && isVideo ? (
              <video src={preview} muted loop autoPlay playsInline className="h-full w-full object-cover object-top" />
            ) : preview && !loadFailed ? (
              <span className="hover-scroll block h-full w-full">
                <img src={preview} alt="Preview" className="hover-scroll-media" />
              </span>
            ) : (
              <span className="grid h-full place-items-center p-6 text-center text-muted">
                <span>
                  <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-lime text-2xl text-on-lime">
                    ↑
                  </span>
                  {loadFailed ? "That link didn't load." : "Drop a tall email export or a PDF here, or click to choose one."}
                  <span className="mono mt-2 block text-xs">WebP, PNG, JPEG or PDF, up to 4 MB</span>
                </span>
              </span>
            )}
            <input
              ref={fileInput}
              type="file"
              name="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
          {progress !== null && (
            <div className="mt-2 h-1.5 overflow-clip rounded-full bg-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Video upload">
              <div className="h-full origin-left bg-lime transition-transform" style={{ transform: `scaleX(${progress / 100})` }} />
            </div>
          )}
          <p className="mono mt-2 flex justify-between gap-2 text-xs text-muted" aria-live="polite">
            <span>
              {progress !== null
                ? `Uploading video… ${progress}%`
                : size
                  ? `${isVideo ? "Video · " : ""}${size.w} × ${size.h}px`
                  : preview && !loadFailed
                    ? "Reading size…"
                    : "Nothing picked yet"}
            </span>
            {(file || uploaded) && (
              <button type="button" onClick={clearFile} className="underline hover:text-ink">
                Remove file
              </button>
            )}
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-3 w-full"
            disabled={busyMedia}
            onClick={() => videoInput.current?.click()}
          >
            Upload a video
          </button>
          <p className="mono mt-1.5 text-center text-xs text-muted">MP4 or WebM, up to 50 MB. Plays muted on a loop.</p>
          <input
            ref={videoInput}
            type="file"
            accept={VIDEO_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickVideo(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <h2 id="sc-editor-h" className="font-display text-2xl font-semibold">
              {initial ? "Edit email" : "Add an email"}
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

          <div>
            <label htmlFor="sc-src" className="mb-2 block font-medium">
              Or link to an image or video
            </label>
            <input
              id="sc-src"
              name="src"
              value={link}
              disabled={Boolean(file) || Boolean(uploaded)}
              placeholder="/emails/email-01.webp or https://…"
              onChange={(e) => setLink(e.target.value)}
              onBlur={() => {
                if (file || uploaded) return;
                setIsVideo(isVideoSrc(link.trim()));
                setPreview(link.trim());
              }}
              className="field disabled:opacity-50"
            />
            <p className="mt-1.5 text-[0.9rem] text-muted">
              {file || uploaded ? "Using the uploaded file. Remove it to use a link instead." : "A path in /public or an https link. Links ending in .mp4 or .webm play as video."}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="sc-brand" className="mb-2 block font-medium">
                Brand or project
              </label>
              <input
                id="sc-brand"
                name="brand"
                required
                maxLength={120}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label htmlFor="sc-type" className="mb-2 block font-medium">
                Type of email
              </label>
              <input
                id="sc-type"
                name="type"
                maxLength={160}
                value={type}
                placeholder="Welcome flow, email 1"
                onChange={(e) => setType(e.target.value)}
                className="field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sc-note" className="mb-2 block font-medium">
              Design decision
            </label>
            <textarea id="sc-note" name="note" rows={3} maxLength={600} defaultValue={initial?.note ?? ""} className="field" />
            <p className="mt-1.5 text-[0.9rem] text-muted">One or two sentences, shown when someone opens the email.</p>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" name="published" defaultChecked={initial?.published ?? true} className="h-5 w-5 accent-[var(--lime-deep)]" />
            <span>Show on the site</span>
          </label>

          <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <button type="submit" className="btn btn-lime" disabled={pending || !size || busyMedia}>
              {pending ? (file ? "Uploading" : "Saving") : initial ? "Save changes" : "Add to showcase"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            {!size && preview && !loadFailed && !busyMedia && <p className="text-[0.9rem] text-muted">Waiting for the file to load…</p>}
          </div>
        </div>
      </form>
    </dialog>
  );
}
