"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { embedSrc, parseVideo } from "@/lib/video";

export type HeroVideoHandle = { play: () => void; pause: () => void };

/**
 * Plays a direct video file, a YouTube link or a Vimeo link.
 * Nothing heavy loads until play() is first called: the poster is all
 * that ships with the first paint.
 */
const HeroVideo = forwardRef<
  HeroVideoHandle,
  { url: string; poster?: string; title?: string; controls?: boolean }
>(function HeroVideo({ url, poster, title = "Showreel", controls = false }, ref) {
  const parsed = useMemo(() => parseVideo(url), [url]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showing, setShowing] = useState(false);
  // Browsers only allow autoplay when muted, so sound is a choice the visitor makes.
  const [muted, setMuted] = useState(true);
  const wantPlay = useRef(false);

  const post = (kind: "play" | "pause") => {
    const win = frameRef.current?.contentWindow;
    if (!win || !parsed) return;
    if (parsed.kind === "youtube") {
      win.postMessage(
        JSON.stringify({ event: "command", func: kind === "play" ? "playVideo" : "pauseVideo", args: [] }),
        "https://www.youtube-nocookie.com",
      );
    } else if (parsed.kind === "vimeo") {
      win.postMessage(JSON.stringify({ method: kind }), "https://player.vimeo.com");
    }
  };

  useImperativeHandle(ref, () => ({
    play() {
      wantPlay.current = true;
      if (!parsed) return;
      if (!mounted) {
        setMounted(true); // the element autoplays once it exists
        return;
      }
      if (parsed.kind === "file") videoRef.current?.play().catch(() => {});
      else post("play");
    },
    pause() {
      wantPlay.current = false;
      if (!parsed || !mounted) return;
      if (parsed.kind === "file") videoRef.current?.pause();
      else post("pause");
    },
  }));

  const embed = parsed ? embedSrc(parsed) : null;

  return (
    <div className="relative h-full w-full bg-surface">
      {mounted && parsed?.kind === "file" && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={parsed.src}
          poster={poster}
          muted={muted}
          loop
          playsInline
          autoPlay
          controls={controls}
          preload="auto"
          aria-label={title}
          onPlaying={() => setShowing(true)}
          onCanPlay={(e) => {
            if (!wantPlay.current) e.currentTarget.pause();
          }}
        />
      )}
      {mounted && embed && (
        <iframe
          ref={frameRef}
          className="absolute inset-0 h-full w-full"
          src={embed}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => {
            // Give the player a moment before hiding the poster.
            window.setTimeout(() => {
              setShowing(true);
              if (!wantPlay.current) post("pause");
            }, 700);
          }}
        />
      )}

      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          width={1280}
          height={720}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: showing ? 0 : 1, pointerEvents: "none" }}
        />
      )}

      {mounted && showing && parsed?.kind === "file" && !controls && (
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            if (videoRef.current) videoRef.current.muted = next;
          }}
          aria-pressed={!muted}
          className="absolute bottom-4 right-4 z-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-bg transition-colors hover:bg-lime hover:text-on-lime md:bottom-6 md:right-6 md:text-base"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
            {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />}
          </svg>
          {muted ? "Turn sound on" : "Turn sound off"}
        </button>
      )}

      {!parsed && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-muted">
          This video link isn&apos;t one I can play. Use a direct .mp4, a YouTube link or a Vimeo link.
        </p>
      )}
    </div>
  );
});

export default HeroVideo;
