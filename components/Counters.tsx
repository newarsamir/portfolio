"use client";

import { useRef } from "react";
import { site, type Counter } from "@/content/site";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { SplitHeading } from "./Reveal";
import SectionRule from "./SectionRule";

export default function Counters({ items, placeholder }: { items: Counter[]; placeholder: boolean }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const nums = gsap.utils.toArray<HTMLElement>("[data-count]", root.current);
        nums.forEach((el, i) => {
          const end = Number(el.dataset.count);
          const state = { v: 0 };
          el.textContent = "0";
          gsap.to(state, {
            v: end,
            duration: 1.8,
            delay: i * 0.12,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
            onUpdate: () => (el.textContent = Math.round(state.v).toLocaleString("en-US")),
          });
        });
        gsap.from("[data-counter]", {
          y: 30,
          autoAlpha: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-counter]", start: "top 88%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section" aria-labelledby="counters-h">
      <div className="wrap">
        <SectionRule label="In numbers" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SplitHeading id="counters-h" className="display-md max-w-[18ch]">
            {site.counters.heading}
          </SplitHeading>
          {placeholder && (
            <p className="mono text-muted">Sample numbers, edit in /admin</p>
          )}
        </div>

        <dl className="mt-12 grid grid-cols-2 border-t border-line lg:grid-cols-4">
          {items.map((c, i) => (
            <div
              key={c.id}
              data-counter
              className={`flex flex-col-reverse justify-end gap-3 border-b border-line py-8 pr-4 lg:border-b-0 lg:py-10 ${
                i % 2 === 1 ? "pl-5 max-lg:border-l" : ""
              } ${i > 0 ? "lg:border-l lg:pl-8" : ""}`}
            >
              <dt className="max-w-[16ch] text-[0.95rem] leading-snug text-muted">{c.label}</dt>
              <dd className="font-display text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-none tracking-[-0.02em] [font-variant-numeric:tabular-nums]">
                <span className={c.joke ? "hl" : undefined}>
                  <span data-count={c.value}>{c.value.toLocaleString("en-US")}</span>
                  {c.suffix}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
