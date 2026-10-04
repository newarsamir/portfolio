"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteGalleryItem, reorderGallery, saveGalleryItem, setGalleryPublished } from "@/app/admin/gallery-actions";
import { toast } from "@/lib/toast";

export type AdminGalleryItem = {
  id: string;
  src: string;
  width: number;
  height: number;
  kind: "product" | "lifestyle";
  caption: string;
  prompt: string;
  published: boolean;
  uploaded: boolean;
};

const MAX_UPLOAD = 4 * 1024 * 1024;
const ACCEPT = "image/webp,image/png,image/jpeg,image/avif";

/** AI product and lifestyle shots for the photography gallery near the bottom of the home page. */
export default function GalleryAdmin({
  items,
  fromDb,
  dbConnected,
  loadError,
}: {
  items: AdminGalleryItem[];
  fromDb: boolean;
  dbConnected: boolean;
  loadError: string | null;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [editing, setEditing] = useState<AdminGalleryItem | "new" | null>(null);
  const [busy, startTransition] = useTransition();
  const canEdit = dbConnected && fromDb;

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
    run(() => reorderGallery(next.map((r) => r.id)));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">AI photography gallery</h2>
          <p className="text-[0.95rem] text-muted">
            Two rows that drift in opposite directions near the bottom of the home page. Images alternate between the
            rows in this order.
          </p>
        </div>
        <button type="button" className="btn btn-lime btn-sm" disabled={!canEdit} onClick={() => setEditing("new")}>
          Add an image
        </button>
      </div>

      {!canEdit && (
        <p role="alert" className="mt-5 rounded-xl border border-danger/40 bg-surface p-4 text-[0.95rem]">
          {loadError ?? "Supabase isn't connected, so the gallery can't be edited."} The Settings tab has a full
          database check.
        </p>
      )}

      {canEdit && rows.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-line p-8 text-center text-muted">
          No images yet, so the site shows labeled placeholders. Add your AI product shots and lifestyle images here.
        </p>
      )}

      {rows.length > 0 && (
        <ol className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((it, i) => (
            <li
              key={it.id}
              data-testid="gallery-row"
              className={`overflow-clip rounded-2xl border border-line bg-raised ${it.published ? "" : "opacity-60"}`}
            >
              <div className="relative aspect-square overflow-clip bg-surface">
                <img src={it.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                <span className="mono absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-xs text-bg">
                  {String(i + 1).padStart(2, "0")} · row {(i % 2) + 1}
                </span>
                <span className="mono absolute bottom-2 left-2 rounded-full bg-lime px-2 py-0.5 text-xs text-on-lime">
                  {it.kind === "lifestyle" ? "Lifestyle" : "Product"}
                </span>
                {!it.published && (
                  <span className="mono absolute right-2 top-2 rounded-full border border-line bg-bg px-2 py-0.5 text-xs">
                    Hidden
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate font-medium">{it.caption || "No caption"}</p>
                <p className="mono mt-1 truncate text-[0.7rem] text-muted">
                  {it.width}×{it.height}
                  {it.uploaded ? " · uploaded" : ""}
                </p>
                {canEdit && (
                  <div className="mt-3 flex flex-wrap gap-1 text-[0.8rem]">
                    <button
                      type="button"
                      aria-label={`Move ${it.caption || "image"} earlier`}
                      disabled={busy || i === 0}
                      onClick={() => move(i, -1)}
                      className="rounded-lg border border-line px-2 py-1 hover:bg-surface disabled:opacity-40"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${it.caption || "image"} later`}
                      disabled={busy || i === rows.length - 1}
                      onClick={() => move(i, 1)}
                      className="rounded-lg border border-line px-2 py-1 hover:bg-surface disabled:opacity-40"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => setGalleryPublished(it.id, !it.published))}
                      className="rounded-lg border border-line px-2 py-1 hover:bg-surface"
                    >
                      {it.published ? "Hide" : "Show"}
                    </button>
                    <button type="button" onClick={() => setEditing(it)} className="rounded-lg border border-line px-2 py-1 hover:bg-surface">
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (!window.confirm("Remove this image from the gallery? This can't be undone.")) return;
                        run(() => deleteGalleryItem(it.id));
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

      {editing && (
        <Editor
          key={editing === "new" ? "new" : editing.id}
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

function Editor({ initial, onClose }: { initial: AdminGalleryItem | null; onClose: (saved: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(saveGalleryItem, null);
  const [link, setLink] = useState(initial?.src ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(initial?.src ?? "");
  const [size, setSize] = useState<{ w: number; h: number } | null>(initial ? { w: initial.width, h: initial.height } : null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [kind, setKind] = useState<"product" | "lifestyle">(initial?.kind ?? "product");
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    if (!state) return;
    toast.result(state);
    if (state.ok) close.current(true);
  }, [state]);

  // Read the real pixel size of whatever is previewed.
  useEffect(() => {
    if (!preview) return;
    let live = true;
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
  }, [preview]);

  useEffect(() => () => void (preview.startsWith("blob:") && URL.revokeObjectURL(preview)), [preview]);

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    if (!ACCEPT.split(",").includes(f.type)) {
      toast.error("Use a WebP, PNG, JPEG or AVIF image.", "That file won't work");
      return;
    }
    if (f.size > MAX_UPLOAD) {
      toast.error(`It's ${(f.size / 1024 / 1024).toFixed(1)} MB. Export it as WebP to get it under 4 MB.`, "That image is too big");
      return;
    }
    if (fileInput.current && fileInput.current.files?.[0] !== f) {
      const dt = new DataTransfer();
      dt.items.add(f);
      fileInput.current.files = dt.files;
    }
    setFile(f);
    setSize(null);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    setPreview(link);
  };

  return (
    <dialog
      ref={dialog}
      className="admin-dialog"
      aria-labelledby="gl-editor-h"
      onClose={() => close.current(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialog.current?.close();
      }}
    >
      <form action={action} className="grid max-h-[92dvh] gap-6 overflow-y-auto p-5 md:grid-cols-[18rem_1fr] md:p-7">
        <input type="hidden" name="id" value={initial?.id ?? ""} />
        <input type="hidden" name="width" value={size?.w ?? ""} />
        <input type="hidden" name="height" value={size?.h ?? ""} />

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
            className="dropzone relative block aspect-[4/5] cursor-pointer overflow-clip rounded-2xl border-2 border-dashed border-line bg-surface"
          >
            {preview && !loadFailed ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full place-items-center p-6 text-center text-muted">
                <span>
                  <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-lime text-2xl text-on-lime">↑</span>
                  {loadFailed ? "That link didn't load as an image." : "Drop a product or lifestyle shot here, or click to choose one."}
                  <span className="mono mt-2 block text-xs">WebP, PNG or JPEG, up to 4 MB</span>
                </span>
              </span>
            )}
            <input ref={fileInput} type="file" name="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          <p className="mono mt-2 flex justify-between gap-2 text-xs text-muted" aria-live="polite">
            <span>{size ? `${size.w} × ${size.h}px` : preview && !loadFailed ? "Reading size…" : "No image yet"}</span>
            {file && (
              <button type="button" onClick={clearFile} className="underline hover:text-ink">
                Remove file
              </button>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <h2 id="gl-editor-h" className="font-display text-2xl font-semibold">
              {initial ? "Edit image" : "Add an image"}
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
            <label htmlFor="gl-src" className="mb-2 block font-medium">
              Or link to an image
            </label>
            <input
              id="gl-src"
              name="src"
              value={link}
              disabled={Boolean(file)}
              placeholder="https://…"
              onChange={(e) => setLink(e.target.value)}
              onBlur={() => !file && setPreview(link.trim())}
              className="field disabled:opacity-50"
            />
          </div>

          <fieldset>
            <legend className="mb-2 font-medium">Type</legend>
            <div className="flex gap-2">
              {(["product", "lifestyle"] as const).map((k) => (
                <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 ${kind === k ? "border-ink bg-surface" : "border-line"}`}>
                  <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="accent-[var(--lime-deep)]" />
                  {k === "product" ? "Product shot" : "Lifestyle"}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="gl-caption" className="mb-2 block font-medium">
              Caption
            </label>
            <input id="gl-caption" name="caption" maxLength={120} defaultValue={initial?.caption ?? ""} placeholder="Serum on travertine, morning light" className="field" />
          </div>

          <div>
            <label htmlFor="gl-prompt" className="mb-2 block font-medium">
              How it was made (optional)
            </label>
            <textarea
              id="gl-prompt"
              name="prompt"
              rows={3}
              maxLength={600}
              defaultValue={initial?.prompt ?? ""}
              placeholder="The prompt or a short note, e.g. Higgsfield, soft window light, beige stone, 50mm"
              className="field"
            />
            <p className="mt-1.5 text-[0.9rem] text-muted">Shown when someone hovers the image.</p>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" name="published" defaultChecked={initial?.published ?? true} className="h-5 w-5 accent-[var(--lime-deep)]" />
            <span>Show on the site</span>
          </label>

          <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <button type="submit" className="btn btn-lime" disabled={pending || !size}>
              {pending ? (file ? "Uploading" : "Saving") : initial ? "Save changes" : "Add to gallery"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
