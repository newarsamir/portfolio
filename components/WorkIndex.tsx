"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CaseStudy } from "@/content/site";
import { gsap } from "@/lib/gsap";
import EmailScroll from "./EmailScroll";
import { ArrowSwap } from "./RollText";

/**
 * Case studies as a big typographic index. On desktop the hovered row's
 * cover floats after the pointer; on touch screens each row shows it inline.
 */
export default function WorkIndex({ items }: { items: CaseStudy[] }) {
  const float = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const el = float.current;
    if (!el || !mounted) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const x = gsap.quickTo(el, "x", { duration: reduce ? 0 : 0.6, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: reduce ? 0 : 0.6, ease: "power3" });
    const rot = gsap.quickTo(el, "rotation", { duration: 0.8, ease: "power3" });
    let lastX = 0;
    const move = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
      if (!reduce) rot(gsap.utils.clamp(-10, 10, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [mounted]);

  return (
    <>
      <ol className="work-list border-t border-ink" onPointerLeave={() => setHovered(null)}>
        {items.map((c, i) => (
          <li key={c.slug} className="border-b border-line">
            <Link
              href={`/work/${c.slug}`}
              onPointerEnter={() => setHovered(i)}
              onFocus={() => setHovered(null)}
              className="work-row group grid items-center gap-x-8 gap-y-4 py-8 md:grid-cols-12 md:py-10"
            >
              <span className="mono text-muted md:col-span-1">{String(i + 1).padStart(2, "0")}</span>
              <span className="md:col-span-7">
                <span className="block font-display text-[clamp(1.75rem,3.6vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.012em]">
                  {c.title}
                </span>
                <span className="mt-3 block text-muted">{c.summary}</span>
              </span>
              <span className="mono text-muted md:col-span-3">
                <span className="block text-ink">{c.client}</span>
                <span className="block">{c.industry}</span>
                <span className="block">{c.year}</span>
              </span>
              <span className="hidden justify-self-end md:col-span-1 md:inline-grid">
                <span className="grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-ink transition-colors group-hover:bg-lime group-hover:text-on-lime group-hover:border-transparent">
                  <ArrowSwap />
                </span>
              </span>
              {/* Touch screens: the cover sits inline. */}
              <span className="block [@media(hover:hover)_and_(pointer:fine)]:hidden">
                <EmailScroll src={c.cover} height="14rem" className="overflow-clip rounded-2xl border border-line" />
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* Portaled to the body: the page's load animation would otherwise
          become the containing block for this fixed element. */}
      {mounted &&
        createPortal(
          <div ref={float} className="work-float hidden [@media(hover:hover)_and_(pointer:fine)]:block" aria-hidden="true">
            <div className="work-float-inner" data-on={hovered !== null}>
              {items.map((c, i) => (
                <img
                  key={c.slug}
                  src={c.cover}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-top transition-[opacity,scale] duration-500"
                  style={{ opacity: hovered === i ? 1 : 0, scale: hovered === i ? "1" : "1.15" }}
                />
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
