"use client";

/** Widest the stacked email gets, and the browsers' safe canvas height. */
const TARGET_WIDTH = 1200;
const MAX_HEIGHT = 16000;
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Turns a PDF export of an email into one tall WebP: every page rendered at
 * the same width and stacked top to bottom. Runs in the browser, so the
 * upload that follows is an ordinary image.
 */
export async function pdfToImage(file: File): Promise<File> {
  // The legacy build includes polyfills, so it works in browsers that are a few versions old.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const pages = await Promise.all(Array.from({ length: doc.numPages }, (_, i) => doc.getPage(i + 1)));

    const widest = Math.max(...pages.map((p) => p.getViewport({ scale: 1 }).width));
    let scale = TARGET_WIDTH / widest;
    const heightAt = (s: number) => pages.reduce((sum, p) => sum + p.getViewport({ scale: s }).height, 0);
    // Very long emails are drawn a little narrower so the image stays within canvas limits.
    if (heightAt(scale) > MAX_HEIGHT) scale *= MAX_HEIGHT / heightAt(scale);

    const width = Math.round(widest * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(heightAt(scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can't draw the PDF.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let y = 0;
    for (const page of pages) {
      const viewport = page.getViewport({ scale });
      const part = document.createElement("canvas");
      part.width = Math.round(viewport.width);
      part.height = Math.round(viewport.height);
      await page.render({ canvas: part, canvasContext: part.getContext("2d")!, viewport }).promise;
      ctx.drawImage(part, Math.round((width - part.width) / 2), y);
      y += part.height;
    }

    // Step the quality down until it fits the 4 MB upload limit.
    let blob: Blob | null = null;
    for (const q of [0.9, 0.8, 0.7, 0.6, 0.5]) {
      blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", q));
      if (blob && blob.size <= MAX_BYTES) break;
    }
    if (!blob) throw new Error("The PDF couldn't be turned into an image.");
    if (blob.size > MAX_BYTES) throw new Error("Even compressed, this PDF is over 4 MB as an image. Try exporting fewer pages.");
    return new File([blob], file.name.replace(/\.pdf$/i, "") + ".webp", { type: "image/webp" });
  } finally {
    await doc.destroy();
  }
}
