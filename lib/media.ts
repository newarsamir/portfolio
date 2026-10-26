/** Showcase items can be a video (an animated email, a screen recording) instead of an image. */
export const VIDEO_EXT = /\.(mp4|webm)(?:[?#].*)?$/i;
export const isVideoSrc = (src: string) => VIDEO_EXT.test(src);
export const VIDEO_TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };
/** Videos go straight from the browser to storage, so they can be bigger than images. */
export const MAX_VIDEO = 50 * 1024 * 1024;

/**
 * Reads an MP4's frame size from its track header ("tkhd" box), without
 * decoding anything. Used when the browser can't play the codec itself.
 */
export async function readMp4Size(file: File): Promise<{ w: number; h: number } | null> {
  const chunk = 8 * 1024 * 1024;
  // The header is at the start of web-ready files and at the end of the rest.
  const parts = [file.slice(0, chunk), file.size > chunk ? file.slice(Math.max(chunk, file.size - chunk)) : null];
  for (const part of parts) {
    if (!part) continue;
    const bytes = new Uint8Array(await part.arrayBuffer());
    const view = new DataView(bytes.buffer);
    for (let i = 4; i < bytes.length - 4; i++) {
      // "tkhd"
      if (bytes[i] !== 0x74 || bytes[i + 1] !== 0x6b || bytes[i + 2] !== 0x68 || bytes[i + 3] !== 0x64) continue;
      const size = view.getUint32(i - 4);
      const end = i - 4 + size;
      if (size < 84 || end > bytes.length) continue;
      const w = view.getUint32(end - 8) / 65536;
      const h = view.getUint32(end - 4) / 65536;
      if (w > 0 && h > 0) return { w: Math.round(w), h: Math.round(h) };
    }
  }
  return null;
}
