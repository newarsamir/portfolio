"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789@#%&*+=<>/";

/**
 * Hairline divider with registration marks and the section's name.
 * The label decodes itself from random glyphs the first time it is seen.
 */
export default function SectionRule({ label, note }: { label: string; note?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const total = 520 + label.length * 28;
        const frame = (now: number) => {
          const t = now - start;
          const settled = Math.floor((t / total) * label.length);
          let out = "";
          for (let i = 0; i < label.length; i++) {
            const c = label[i];
            out += i < settled || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          el.textContent = out;
          if (t < total) raf = requestAnimationFrame(frame);
          else el.textContent = label;
        };
        raf = requestAnimationFrame(frame);
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = label;
    };
  }, [label]);

  return (
    <div className="rule mono mb-10 md:mb-14">
      <span aria-label={label}>
        <span ref={ref} aria-hidden="true">
          {label}
        </span>
      </span>
      {note && <span className="hidden sm:inline">{note}</span>}
    </div>
  );
}
