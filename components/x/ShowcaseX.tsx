"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ShowcaseItem } from "@/content/site";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { isRemote } from "@/lib/images";
import { isVideoSrc } from "@/lib/media";
import { useSite } from "../cms/SiteProvider";
import Lightbox from "../Lightbox";
import { ArrowSwap, RollText } from "../RollText";

/**
 * "Clicked": the emails on a row of phones that slides sideways while you
 * scroll down. Inside each phone the email scrolls itself top to bottom as
 * the phone crosses the screen, the way a subscriber would read it.
 */
export default function ShowcaseX({ items }: { items: ShowcaseItem[] }) {
  const site = useSite();
  const { sub } = site.showcase;
  // The old heading told people to spin a 3D carousel; this row scrolls instead.
  const heading = site.showcase.heading.replace(/Scroll to spin them\.?/i, "Keep scrolling to read them.");
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (min-width: 900px)`, () => {
        const trackEl = track.current!;
        const phones = gsap.utils.toArray<HTMLElement>("[data-phone]", trackEl);
        const distance = () => Math.max(0, trackEl.scrollWidth - window.innerWidth);

        // Each email scrolls inside its phone as the phone crosses the screen.
        const readAlong = () => {
          const vw = window.innerWidth;
          for (const phone of phones) {
            const r = phone.getBoundingClientRect();
            const img = phone.querySelector<HTMLElement>("[data-mail]");
            const screen = phone.querySelector<HTMLElement>("[data-screen]");
            if (!img || !screen) continue;
            const p = gsap.utils.clamp(0, 1, (vw - r.left) / (vw + r.width));
            const travel = Math.max(0, img.offsetHeight - screen.offsetHeight);
            img.style.transform = `translate3d(0, ${-p * travel}px, 0)`;
          }
        };

        gsap.to(trackEl, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: readAlong,
            onRefresh: readAlong,
          },
        });
      });
    },
    { scope: root, dependencies: [items.length] },
  );

  return (
    <section ref={root} id="work" className="sx" aria-labelledby="sx-h" data-stage="2">
      <div ref={track} className="sx-track">
        <div className="sx-intro">
          <p className="x-label">{String(items.length).padStart(2, "0")} emails · {site.funnel.stages[2] ?? "Clicked"}</p>
          <h2 id="sx-h" className="x-display sx-h2">
            {heading}
          </h2>
          <p className="sx-sub">{sub}</p>
          <p className="mono sx-hint" aria-hidden="true">
            {site.showcase.scrollHint}
          </p>
        </div>

        <ol className="sx-list">
          {items.map((item, i) => (
            <li key={item.id ?? item.src} className="sx-item" style={{ ["--tilt" as string]: `${i % 2 ? 2 : -2}deg` }}>
              <button
                type="button"
                data-phone
                className="sx-phone"
                onClick={() => setOpen(i)}
                aria-label={`Open the ${item.brand} email: ${item.type}`}
              >
                <span className="sx-notch" aria-hidden="true" />
                <span className="sx-status mono" aria-hidden="true">
                  <span>9:41</span>
                  <span className="sx-signal">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
                <span data-screen className="sx-screen">
                  {isVideoSrc(item.src) ? (
                    <video data-mail src={item.src} muted loop playsInline autoPlay preload="metadata" className="sx-mail sx-video" aria-hidden="true" />
                  ) : (
                  <Image
                    data-mail
                    src={item.src}
                    alt=""
                    width={item.width}
                    height={item.height}
                    sizes="320px"
                    unoptimized={isRemote(item.src)}
                    className="sx-mail"
                  />
                  )}
                </span>
              </button>
              <div className="sx-caption">
                <p className="mono text-muted">
                  {String(i + 1).padStart(2, "0")} · {item.type}
                </p>
                <p className="sx-brand">{item.brand}</p>
                <p className="sx-note">{item.note}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="sx-end">
          <p className="x-display sx-end-h">{site.showcase.endHeading}</p>
          <Link href="/contact" className="btn btn-lime">
            <RollText text={site.hero.secondary} />
            <ArrowSwap size={16} />
          </Link>
        </div>
      </div>

      <Lightbox items={items} index={open} onClose={() => setOpen(null)} onNavigate={setOpen} />
    </section>
  );
}
