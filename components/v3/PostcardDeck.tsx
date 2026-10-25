"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ShowcaseItem } from "@/content/site";
import { isRemote } from "@/lib/images";
import { useSite } from "../cms/SiteProvider";
import Lightbox from "../Lightbox";

/**
 * The emails as a row of postcards you can throw sideways with the mouse.
 * Touch and trackpads scroll it natively; a mouse drag carries momentum and
 * slows down with friction instead of stopping dead.
 */
export default function PostcardDeck({ items }: { items: ShowcaseItem[] }) {
  const site = useSite();
  const { heading, sub, dragHint } = site.showcase;
  const track = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const [open, setOpen] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let raf = 0;
    let active = false;

    const glide = () => {
      // Friction, not a wall: the row slows down on its own.
      velocity *= 0.94;
      el.scrollLeft -= velocity;
      if (Math.abs(velocity) > 0.3) raf = requestAnimationFrame(glide);
      else setDragging(false);
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(raf);
      active = true;
      moved.current = false;
      startX = lastX = e.clientX;
      startScroll = el.scrollLeft;
      lastT = performance.now();
      velocity = 0;
    };
    const move = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      if (!moved.current && Math.abs(dx) > 5) {
        moved.current = true;
        setDragging(true);
        el.setPointerCapture(e.pointerId);
      }
      if (!moved.current) return;
      el.scrollLeft = startScroll - dx;
      const now = performance.now();
      velocity = ((e.clientX - lastX) / Math.max(1, now - lastT)) * 16;
      lastX = e.clientX;
      lastT = now;
    };
    const up = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (moved.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) raf = requestAnimationFrame(glide);
      else setDragging(false);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  const nudge = (dir: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 640), behavior: "smooth" });
  };

  return (
    <section id="work" className="pd" aria-labelledby="pd-h">
      <div className="wrap pd-head">
        <div>
          <p className="v3-label">
            {String(items.length).padStart(2, "0")} {site.nav.find((n) => n.id === "work")?.label ?? "Work"}
          </p>
          <h2 id="pd-h" className="v3-h2">
            {heading.replace(/Scroll to spin them\.?/i, "").trim()}
          </h2>
          <p className="v3-sub">{sub}</p>
        </div>
        <div className="pd-controls">
          <span className="mono text-muted">{dragHint}</span>
          <button type="button" className="pd-arrow x-press" aria-label="Previous emails" onClick={() => nudge(-1)}>
            ←
          </button>
          <button type="button" className="pd-arrow x-press" aria-label="Next emails" onClick={() => nudge(1)}>
            →
          </button>
        </div>
      </div>

      <div ref={track} className="pd-track" data-dragging={dragging}>
        <ol className="pd-list">
          {items.map((item, i) => (
            <li key={item.id ?? item.src} className="pd-item" style={{ ["--tilt" as string]: `${[-2, 1.5, -1, 2.2][i % 4]}deg` }}>
              <button
                type="button"
                className="pd-card"
                onClick={() => {
                  if (!moved.current) setOpen(i);
                }}
                aria-label={`Open the ${item.brand} email: ${item.type}`}
              >
                <span className="pd-stamp mono" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="pd-img">
                  <Image
                    src={item.src}
                    alt=""
                    width={item.width}
                    height={item.height}
                    sizes="300px"
                    draggable={false}
                    unoptimized={isRemote(item.src)}
                    className="pd-mail"
                  />
                </span>
                <span className="pd-cap">
                  <span className="pd-brand">{item.brand}</span>
                  <span className="pd-type">{item.type}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <Lightbox items={items} index={open} onClose={() => setOpen(null)} onNavigate={setOpen} />
    </section>
  );
}
