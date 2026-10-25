"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CaseStudy } from "@/content/site";
import { fill } from "@/lib/cms";
import { isRemote } from "@/lib/images";
import { useSite } from "../cms/SiteProvider";

/**
 * Case studies as a quiet index. On a desktop, the cover floats next to the
 * cursor while you hover a row, trailing it slightly like it has weight.
 */
export default function CaseList({ items }: { items: CaseStudy[] }) {
  const site = useSite();
  const cs = site.caseStudies;
  const float = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = float.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const loop = () => {
      // Ease toward the cursor so the cover trails behind it, then stop when it arrives.
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${(tx - x) * 0.04}deg)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  if (items.length === 0) return null;
  const shown = hover !== null ? items[hover] : null;

  return (
    <section id="cases" className="cl" aria-labelledby="cl-h">
      <div className="wrap">
        <div className="cl-head">
          <div>
            <p className="v3-label">
              {cs.label} · {fill(cs.note, items.length)}
            </p>
            <h2 id="cl-h" className="v3-h2">
              {cs.heading}
            </h2>
          </div>
          <p className="v3-sub">{cs.sub}</p>
        </div>

        <ol className="cl-list" onPointerLeave={() => setHover(null)}>
          {items.map((c, i) => (
            <li key={c.slug}>
              <Link
                href={`/work/${c.slug}`}
                className="cl-row"
                onPointerEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                <span className="cl-num mono">{String(i + 1).padStart(2, "0")}</span>
                {c.cover && (
                  <span className="cl-thumb" aria-hidden="true">
                    <Image src={c.cover} alt="" width={240} height={300} sizes="96px" unoptimized={isRemote(c.cover)} className="cl-thumb-img" />
                  </span>
                )}
                <span className="cl-main">
                  <span className="cl-title">{c.title}</span>
                  <span className="cl-meta">
                    {c.client} · {c.industry} · {c.year}
                  </span>
                </span>
                <span className="cl-go" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
                <span className="sr-only">{cs.cta}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div ref={float} className="cl-float" data-on={Boolean(shown?.cover)} aria-hidden="true">
        {items.map((c, i) =>
          c.cover ? (
            <Image
              key={c.slug}
              src={c.cover}
              alt=""
              width={480}
              height={600}
              sizes="260px"
              unoptimized={isRemote(c.cover)}
              className="cl-float-img"
              data-show={hover === i}
            />
          ) : null,
        )}
      </div>
    </section>
  );
}
