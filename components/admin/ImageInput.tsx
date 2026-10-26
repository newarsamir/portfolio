"use client";

import { useRef, useState } from "react";
import { IMAGE_ACCEPT, isPdf, uploadImage } from "@/lib/admin-upload";
import { toast } from "@/lib/toast";

type Folder = "content" | "cases" | "hero";

/** Uploads files one by one, toasting failures, and returns the links that worked. */
function useUploader(folder: Folder) {
  const [busy, setBusy] = useState<"" | "pdf" | "image">("");
  const run = async (files: File[]) => {
    const out: string[] = [];
    for (const f of files) {
      setBusy(isPdf(f) ? "pdf" : "image");
      try {
        out.push(await uploadImage(f, folder));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "That file didn't upload.", `${f.name} wasn't uploaded`);
      }
    }
    setBusy("");
    return out;
  };
  return { busy, run, label: busy === "pdf" ? "Converting PDF" : busy ? "Uploading" : "" };
}

/**
 * One image: a preview you can click or drop a file on, the link itself, and
 * an upload button. Images and PDFs both work; a PDF becomes one tall image.
 */
export default function ImageInput({
  id,
  name,
  value,
  onChange,
  folder = "content",
  help,
  disabled = false,
  aspect = "aspect-[4/5]",
}: {
  id: string;
  /** Set to submit the link with a form. */
  name?: string;
  value: string;
  onChange: (src: string) => void;
  folder?: Folder;
  help?: string;
  disabled?: boolean;
  aspect?: string;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [broken, setBroken] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { busy, run, label } = useUploader(folder);

  const pick = async (f: File | undefined | null) => {
    if (!f || busy || disabled) return;
    const [src] = await run([f]);
    if (!src) return;
    setBroken(false);
    onChange(src);
    toast.success(isPdf(f) ? "The PDF is now an image. Save to publish it." : "Image uploaded. Save to publish it.");
  };

  return (
    <div className="flex gap-4">
      <button
        type="button"
        disabled={disabled}
        onClick={() => file.current?.click()}
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
        aria-label="Upload an image or PDF"
        className={`dropzone relative grid w-24 shrink-0 place-items-center overflow-clip rounded-xl border-2 border-dashed border-line bg-surface ${aspect}`}
      >
        {value && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover object-top" onError={() => setBroken(true)} />
        ) : (
          <span className="px-2 text-center text-xs text-muted">{value ? "Can't load" : "Drop or click"}</span>
        )}
        {busy && <span className="absolute inset-0 grid place-items-center bg-raised/85 px-2 text-center text-xs font-medium">{label}</span>}
      </button>
      <div className="min-w-0 flex-1 space-y-2">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="url"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setBroken(false);
            onChange(e.target.value);
          }}
          placeholder="Upload, or paste /image.webp or https://"
          className="field"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" disabled={disabled || Boolean(busy)} onClick={() => file.current?.click()}>
            {label || "Upload image or PDF"}
          </button>
          {value && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={disabled} onClick={() => onChange("")}>
              Remove
            </button>
          )}
        </div>
        {help && <p className="text-[0.9rem] text-muted">{help}</p>}
      </div>
      <input
        ref={file}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        tabIndex={-1}
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** A list of images (a case study gallery): thumbnails to reorder or remove, multi-file upload, or a pasted link. */
export function ImageListInput({
  name,
  value,
  onChange,
  max = 12,
  folder = "content",
  help,
}: {
  name: string;
  value: string[];
  onChange: (srcs: string[]) => void;
  max?: number;
  folder?: Folder;
  help?: string;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState("");
  const [dragging, setDragging] = useState(false);
  const { busy, run, label } = useUploader(folder);
  const full = value.length >= max;

  const add = async (files: File[]) => {
    if (busy || !files.length) return;
    const room = max - value.length;
    if (files.length > room) toast.info(`Only ${room} more fit. The rest were skipped.`, `Up to ${max} images`);
    const srcs = await run(files.slice(0, Math.max(0, room)));
    if (!srcs.length) return;
    onChange([...value, ...srcs]);
    toast.success(`${srcs.length === 1 ? "Image" : `${srcs.length} images`} added. Save to publish.`);
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* The form still receives one link per line. */}
      <input type="hidden" name={name} value={value.join("\n")} />
      {value.length > 0 && (
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
          {value.map((src, i) => (
            <li key={`${src}-${i}`} className="group relative overflow-clip rounded-xl border border-line bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Gallery image ${i + 1}`} className="aspect-[3/4] w-full object-cover object-top" />
              <span className="flex items-center justify-between gap-1 border-t border-line bg-raised px-1 py-1 text-xs">
                <button type="button" aria-label={`Move image ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, -1)} className="rounded px-1.5 py-0.5 hover:bg-surface disabled:opacity-30">
                  ←
                </button>
                <button
                  type="button"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() => onChange(value.filter((_, k) => k !== i))}
                  className="rounded px-1.5 py-0.5 text-danger hover:bg-surface"
                >
                  ✕
                </button>
                <button
                  type="button"
                  aria-label={`Move image ${i + 1} later`}
                  disabled={i === value.length - 1}
                  onClick={() => move(i, 1)}
                  className="rounded px-1.5 py-0.5 hover:bg-surface disabled:opacity-30"
                >
                  →
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
      {!full && (
        <button
          type="button"
          onClick={() => file.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            add([...e.dataTransfer.files]);
          }}
          data-dragging={dragging || undefined}
          disabled={Boolean(busy)}
          className="dropzone block w-full rounded-xl border-2 border-dashed border-line bg-surface px-4 py-5 text-center text-[0.95rem] text-muted"
        >
          {label ? `${label}…` : "Drop images or PDFs here, or click to choose (several at once is fine)"}
        </button>
      )}
      {!full && (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (link.trim()) onChange([...value, link.trim()]);
              setLink("");
            }}
            placeholder="Or paste a link: /emails/email-01.webp or https://"
            aria-label="Image link to add"
            className="field"
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm shrink-0"
            disabled={!link.trim()}
            onClick={() => {
              onChange([...value, link.trim()]);
              setLink("");
            }}
          >
            Add link
          </button>
        </div>
      )}
      {help && <p className="text-[0.9rem] text-muted">{help}</p>}
      <input
        ref={file}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="hidden"
        tabIndex={-1}
        onChange={(e) => {
          add([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
