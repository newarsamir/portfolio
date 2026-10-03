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
          muted
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

      {!parsed && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-muted">
          This video link isn&apos;t one I can play. Use a direct .mp4, a YouTube link or a Vimeo link.
        </p>
      )}
    </div>
  );
});

export default HeroVideo;
