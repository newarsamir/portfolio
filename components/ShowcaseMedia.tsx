"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import type { ShowcaseItem } from "@/content/site";
import { isRemote } from "@/lib/images";
import { isVideoSrc } from "@/lib/media";

/**
 * A showcase email as an image, or as a muted looping video that only plays
 * while it's on screen. With `scroll`, a tall image scrolls from top to
 * bottom while it's hovered (fine pointers only; reduced motion keeps it still).
 */
export default function ShowcaseMedia({
  item,
  sizes,
  className = "",
  mediaClassName = "",
  scroll = false,
  priority = false,
}: {
  item: Pick<ShowcaseItem, "src" | "width" | "height">;
  sizes: string;
  className?: string;
  mediaClassName?: string;
  scroll?: boolean;
  priority?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const isVideo = isVideoSrc(item.src);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, [isVideo]);

  if (isVideo) {
    return (
      <span className={`block ${className}`}>
        <video
          ref={video}
          src={item.src}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className={`block h-full w-full object-cover object-top ${mediaClassName}`}
        />
      </span>
    );
  }

  const img = (
    <Image
      src={item.src}
      alt=""
      width={item.width}
      height={item.height}
      sizes={sizes}
      priority={priority}
      draggable={false}
      unoptimized={isRemote(item.src)}
      className={scroll ? `hover-scroll-media ${mediaClassName}` : mediaClassName}
    />
  );
  if (!scroll) return <span className={`block ${className}`}>{img}</span>;
  // Taller emails scroll for longer, so the speed feels the same.
  const style = { ["--scroll-dur" as string]: `${Math.min(9, Math.max(2.5, (item.height / item.width) * 1.6)).toFixed(1)}s` } as CSSProperties;
  return (
    <span className={`hover-scroll block ${className}`} style={style}>
      {img}
    </span>
  );
}
