"use client";

import { uploadContentImage } from "@/app/admin/content-actions";
import { pdfToImage } from "./pdf-to-image";

/** What every admin image picker accepts. PDFs are turned into one image before upload. */
export const IMAGE_ACCEPT = "image/webp,image/png,image/jpeg,image/gif,image/avif,application/pdf";
const IMAGE_TYPES = new Set(["image/webp", "image/png", "image/jpeg", "image/gif", "image/avif"]);
const MAX_UPLOAD = 4 * 1024 * 1024;

export const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);

/**
 * Uploads a picked image or PDF to storage and returns its public link.
 * Throws an Error whose message can be shown as is.
 */
export async function uploadImage(file: File, folder: "content" | "cases" | "hero" = "content"): Promise<string> {
  const f = isPdf(file) ? await pdfToImage(file) : file;
  if (!IMAGE_TYPES.has(f.type)) throw new Error("Use a WebP, PNG, JPEG, GIF, AVIF or PDF file.");
  if (f.size > MAX_UPLOAD) throw new Error(`It's ${(f.size / 1024 / 1024).toFixed(1)} MB. Export it as WebP to get it under 4 MB.`);
  const form = new FormData();
  form.append("file", f);
  form.append("folder", folder);
  const res = await uploadContentImage(form);
  if (!res.ok || !res.src) throw new Error(res.message);
  return res.src;
}

/**
 * Crops a picked image or PDF to a 1200 × 630 JPEG for link previews. The
 * share card renderer can't read WebP, and every network wants this shape.
 */
export async function toShareImage(file: File): Promise<File> {
  const source = isPdf(file) ? await pdfToImage(file) : file;
  const bitmap = await createImageBitmap(source);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't resize the image.");
  // Cover: fill the frame, cropping the overflow evenly (from the top for tall images, like a PDF).
  const scale = Math.max(1200 / bitmap.width, 630 / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1200, 630);
  ctx.drawImage(bitmap, (1200 - w) / 2, h > 630 * 1.5 ? 0 : (630 - h) / 2, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
  if (!blob) throw new Error("The image couldn't be resized.");
  return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, "") + "-share.jpg", { type: "image/jpeg" });
}

/** Sends a file straight to storage through a signed link (no size cap from Vercel), reporting progress. */
export function putToSignedUrl(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const body = new FormData();
    body.append("cacheControl", "31536000");
    body.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(body);
  });
}
