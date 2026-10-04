"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { ShowcaseItem } from "@/content/site";
import { gsap } from "@/lib/gsap";
import { isRemote } from "@/lib/images";

/**
 * Fallback for touch devices, small screens, reduced motion and browsers
 * without WebGL: a horizontal snap row where cards turn in CSS 3D as they
 * pass the center. Scrolling the page also drifts the row sideways, so the
 * emails move even before anyone swipes.
 */
export default function ShowcaseCarousel({
  items,
  onOpen,
}: {
  items: readonly ShowcaseItem[];
  onOpen: (i: number) => void;
}) {
  const row = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
    let raf = 0;

    const update = () => {
      raf = 0;
      const box = el.getBoundingClientRect();
      const mid = box.left + box.width / 2;
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        const off = Math.max(-1.4, Math.min(1.4, (r.left + r.width / 2 - mid) / (box.width * 0.6)));
        const a = Math.abs(off);
        card.style.transform = `rotateY(${(-off * 32).toFixed(2)}deg) translateZ(${(-a * 70).toFixed(1)}px)`;
        // Cards leaving the center blur and turn transparent.
        card.style.filter = a > 0.12 ? `blur(${((a - 0.12) * 7).toFixed(2)}px)` : "";
        card.style.opacity = Math.max(0.15, 1 - a * 0.7).toFixed(3);
      }
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    const drift = gsap.fromTo(
      el.querySelectorAll("li"),
      { x: 110 },
      {
        x: -110,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.4, onUpdate: queue },
      },
    );
    return () => {
      drift.scrollTrigger?.kill();
      drift.kill();
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  return (
    <ul ref={row} className="snap-row" data-lenis-prevent-touch aria-label="Email designs">
      {items.map((item, i) => (
        <li key={item.id ?? item.src} className="snap-card">
          <button
            type="button"
            data-card
            data-cursor="view"
            onClick={() => onOpen(i)}
            className="block w-full text-left"
            aria-label={`Open ${item.brand}, ${item.type}`}
          >
            <span className="block aspect-[3/5] overflow-clip rounded-2xl border border-line bg-surface">
              <Image
                src={item.src}
                alt=""
                width={item.width}
                height={item.height}
                sizes="280px"
                unoptimized={isRemote(item.src)}
                loading="lazy"
                className="h-full w-full object-cover object-top"
              />
            </span>
            <span className="mt-3 block font-display text-xl font-semibold">{item.brand}</span>
            <span className="block text-[0.95rem] text-muted">{item.type}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
