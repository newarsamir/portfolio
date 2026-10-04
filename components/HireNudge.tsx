"use client";

import Link from "next/link";
import { useRef } from "react";
import { site } from "@/content/site";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import Magnetic from "./Magnetic";
import { ArrowSwap, RollText } from "./RollText";

/**
 * A short hire-me break halfway down the home page. Driven by the scroll:
 * the card grows out to full width as it reaches the middle of the screen,
 * the copy rises a little slower than the card and the rings turn.
 */
export default function HireNudge({ available }: { available: boolean }) {
  const { nudge } = site;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const st = { trigger: root.current, start: "top bottom", end: "center center", scrub: 0.6 };
        gsap.fromTo(
          "[data-nudge-card]",
          { scale: 0.86, y: 90, borderRadius: "4rem" },
          { scale: 1, y: 0, borderRadius: "2rem", ease: "none", scrollTrigger: st },
        );
        gsap.fromTo("[data-nudge-copy]", { y: 70, opacity: 0.2 }, { y: 0, opacity: 1, ease: "none", scrollTrigger: st });
        gsap.fromTo("[data-nudge-cta]", { x: 60, opacity: 0 }, { x: 0, opacity: 1, ease: "none", scrollTrigger: st });
        // The rings keep turning the whole way through.
        gsap.to("[data-nudge-ring]", {
          rotate: (i) => (i ? -120 : 160),
          scale: (i) => (i ? 1.25 : 1.4),
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="overflow-x-clip py-[clamp(2rem,5vw,4rem)]" aria-labelledby="nudge-h">
      <div className="wrap">
        <div>
          <div
            data-nudge-card
            className="relative grid origin-center items-center gap-8 overflow-clip rounded-[2rem] bg-lime p-8 text-on-lime will-change-transform md:grid-cols-[1fr_auto] md:p-12 lg:p-14"
          >
            <span
              data-nudge-ring
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[1.5px] border-dashed border-on-lime/25"
              aria-hidden="true"
            />
            <span
              data-nudge-ring
              className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border-[1.5px] border-on-lime/20"
              aria-hidden="true"
            />
            <div data-nudge-copy className="relative">
              <p className="mono flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full bg-on-lime ${available ? "pulse-dot" : "opacity-40"}`} aria-hidden="true" />
                {available ? `${nudge.eyebrow} · Taking new projects` : nudge.eyebrow}
              </p>
              <h2 id="nudge-h" className="mt-4 max-w-[22ch] text-[clamp(1.75rem,3.4vw,3rem)]">
                {nudge.headline}
              </h2>
              <p className="mt-4 max-w-[56ch] text-lg leading-relaxed opacity-80">{nudge.body}</p>
            </div>
            <div data-nudge-cta className="relative flex flex-wrap items-center gap-3 md:flex-col md:items-stretch">
              <Magnetic strength={0.35}>
                <Link href="/contact" className="btn min-h-[3.75rem] bg-ink px-8 text-lg text-lime [--btn-fill:var(--bg)] hover:text-ink">
                  <RollText text={nudge.button} />
                  <ArrowSwap />
                </Link>
              </Magnetic>
              <a href={`mailto:${site.email}`} className="btn border-[1.5px] border-on-lime/40 text-on-lime [--btn-fill:var(--on-lime)] hover:text-lime">
                <RollText text={nudge.secondary} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
