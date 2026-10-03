export type ParsedVideo =
  | { kind: "file"; src: string }
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string; hash?: string };

/** Accepts a direct video file, a YouTube link or a Vimeo link. */
export function parseVideo(input: string): ParsedVideo | null {
  const raw = input.trim();
  if (!raw) return null;

  // Local file in /public
  if (raw.startsWith("/") && !raw.startsWith("//")) return { kind: "file", src: raw };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/")[1];
    return isYtId(id) ? { kind: "youtube", id } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && isYtId(v)) return { kind: "youtube", id: v };
    const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,20})/);
    return m ? { kind: "youtube", id: m[1] } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(\d{6,12})(?:\/([0-9a-f]+))?/);
    if (!m) return null;
    return { kind: "vimeo", id: m[1], hash: m[2] ?? url.searchParams.get("h") ?? undefined };
  }
  return { kind: "file", src: url.toString() };
}

function isYtId(id: string | undefined): id is string {
  return !!id && /^[\w-]{6,20}$/.test(id);
}

export function embedSrc(v: ParsedVideo): string | null {
  if (v.kind === "youtube") {
    const p = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: v.id,
      playsinline: "1",
      controls: "0",
      rel: "0",
      modestbranding: "1",
      enablejsapi: "1",
    });
    return `https://www.youtube-nocookie.com/embed/${v.id}?${p}`;
  }
  if (v.kind === "vimeo") {
    const p = new URLSearchParams({
      autoplay: "1",
      muted: "1",
      loop: "1",
      playsinline: "1",
      controls: "0",
      title: "0",
      byline: "0",
      portrait: "0",
      dnt: "1",
    });
    if (v.hash) p.set("h", v.hash);
    return `https://player.vimeo.com/video/${v.id}?${p}`;
  }
  return null;
}
