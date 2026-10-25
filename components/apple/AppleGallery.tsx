"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ShowcaseItem } from "@/content/site";
import { isRemote } from "@/lib/images";
import { useSite } from "../cms/SiteProvider";
import Lightbox from "../Lightbox";

/** A snapping row of tiles, like apple.com's "Get the highlights", with round arrows and dots. */
export default function AppleGallery({ items }: { items: ShowcaseItem[] }) {
  const site = useSite();
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const heading = site.showcase.heading.replace(/Scroll to spin them\.?/i, "").trim();

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const tiles = Array.from(el.querySelectorAll<HTMLElement>("[data-tile]"));
      const left = el.getBoundingClientRect().left;
      let best = 0;
      let dist = Infinity;
      tiles.forEach((t, i) => {
        const d = Math.abs(t.getBoundingClientRect().left - left - parseFloat(getComputedStyle(el).scrollPaddingLeft || "0"));
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      setActive(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (i: number) => {
    const el = track.current;
    const tile = el?.querySelectorAll<HTMLElement>("[data-tile]")[i];
    if (!el || !tile) return;
    el.scrollTo({ left: tile.offsetLeft - parseFloat(getComputedStyle(el).scrollPaddingLeft || "0"), behavior: "smooth" });
  };

  return (
    <section id="work" className="apl-section" aria-labelledby="apl-work-h">
      <div className="apl-wrap">
        <h2 id="apl-work-h" className="apl-h2">
          {heading}
        </h2>
        <p className="apl-body apl-measure">{site.showcase.sub}</p>
      </div>
      <div ref={track} className="apl-rail">
        <ol className="apl-rail-list">
          {items.map((item, i) => (
            <li key={item.id ?? item.src} data-tile className="apl-tile-wrap">
              <button type="button" className="apl-tile" onClick={() => setOpen(i)} aria-label={`Open the ${item.brand} email: ${item.type}`}>
                <span className="apl-tile-text">
                  <span className="apl-tile-kicker">{item.type}</span>
                  <span className="apl-tile-title">{item.brand}</span>
                </span>
                <span className="apl-tile-media">
                  <Image src={item.src} alt="" width={item.width} height={item.height} sizes="340px" unoptimized={isRemote(item.src)} className="apl-tile-img" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="apl-wrap apl-rail-controls">
        <div className="apl-dots" role="tablist" aria-label="Emails">
          {items.map((item, i) => (
            <button
              key={item.id ?? item.src}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`${i + 1}: ${item.brand}`}
              className="apl-dot"
              onClick={() => go(i)}
            />
          ))}
        </div>
        <div className="flex gap-3">
          <button type="button" className="apl-round" aria-label="Previous" disabled={active === 0} onClick={() => go(active - 1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button type="button" className="apl-round" aria-label="Next" disabled={active >= items.length - 1} onClick={() => go(active + 1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
      <Lightbox items={items} index={open} onClose={() => setOpen(null)} onNavigate={setOpen} />
    </section>
  );
}
