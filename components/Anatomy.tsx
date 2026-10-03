"use client";

import { useRef, useState } from "react";
import { site } from "@/content/site";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { Reveal, SplitHeading } from "./Reveal";
import SectionRule from "./SectionRule";

/**
 * An email taken apart. The diagram stays in view while the notes scroll,
 * and the part being described lights up. Hover and keyboard focus do the same.
 */
export default function Anatomy() {
  const root = useRef<HTMLElement>(null);
  const parts = site.anatomy.parts;
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const notes = gsap.utils.toArray<HTMLElement>("[data-note]", root.current);
        notes.forEach((el, i) => {
          ScrollTrigger.create({
            trigger: el,
            start: "top 58%",
            end: "bottom 58%",
            onToggle: (self) => self.isActive && setActive(i),
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Marks one part of the diagram as the one being explained.
  const part = (i: number, className = "") =>
    ({
      "data-on": active === i,
      className: `relative rounded-md outline outline-[1.5px] outline-offset-[5px] transition-[outline-color,opacity] duration-300 ${
        active === i ? "outline-accent-fg opacity-100" : "outline-transparent lg:opacity-60"
      } ${className}`,
    }) as const;

  const Badge = ({ i }: { i: number }) => (
    <span
      className={`mono absolute -left-9 top-0 grid h-6 w-6 place-items-center rounded-full bg-lime text-on-lime transition-opacity duration-300 ${
        active === i ? "opacity-100" : "opacity-0"
      }`}
    >
      {i + 1}
    </span>
  );

  return (
    <section ref={root} className="section" aria-labelledby="anatomy-h">
      <div className="wrap">
        <SectionRule label="Anatomy of an email" note="600px wide, read in about 8 seconds" />
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="min-w-0 lg:col-span-7">
            <SplitHeading id="anatomy-h" className="display-lg max-w-[16ch]">
              {site.anatomy.heading}
            </SplitHeading>
            <Reveal className="mt-6 max-w-[52ch] text-lg text-muted">
              <p>{site.anatomy.sub}</p>
            </Reveal>

            <ol className="mt-12 border-t border-line">
              {parts.map((p, i) => (
                <li key={p.id} data-note className="border-b border-line">
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-pressed={active === i}
                    className={`grid w-full cursor-default grid-cols-[2.5rem_1fr] gap-x-4 py-6 text-left transition-opacity duration-300 md:grid-cols-[3.5rem_1fr] ${
                      active === i ? "opacity-100" : "lg:opacity-55"
                    }`}
                  >
                    <span className="mono pt-1.5 text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block font-display text-2xl font-semibold md:text-[1.75rem]">{p.title}</span>
                      <span className="mt-2 block max-w-[56ch] text-muted">{p.body}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {/* The diagram. Decorative: the list carries the content. */}
          <div className="order-first min-w-0 lg:order-none lg:col-span-5" aria-hidden="true">
            <div className="mx-auto max-w-[23rem] pl-9 lg:sticky lg:top-[12vh]">
              {/* Inbox row */}
              <div {...part(0, "mb-5 border border-line bg-raised px-4 py-3")}>
                <Badge i={0} />
                <div className="flex min-w-0 items-baseline justify-between gap-3">
                  <span className="text-[0.9375rem] font-semibold">Your brand</span>
                  <span className="mono text-muted">9:41</span>
                </div>
                <p className="truncate text-[0.9375rem] font-medium">Your first order ships free</p>
                <p className="truncate text-sm text-muted">Plus 10% off, because first impressions matter.</p>
              </div>

              {/* The email */}
              <div className="rounded-xl border border-line bg-raised p-4 shadow-[0_30px_60px_-36px_rgb(0_0_0/0.5)]">
                <div className="flex flex-col gap-4">
                  <div {...part(1, "flex items-center justify-between py-1")}>
                    <Badge i={1} />
                    <span className="h-3.5 w-20 rounded-sm bg-ink" />
                    <span className="flex gap-1.5">
                      <span className="h-1.5 w-6 rounded-sm bg-line" />
                      <span className="h-1.5 w-6 rounded-sm bg-line" />
                    </span>
                  </div>
                  <div {...part(2, "grid h-36 place-items-center bg-lime px-5 text-center text-on-lime")}>
                    <Badge i={2} />
                    <span className="font-display text-[1.65rem] font-semibold leading-[1.05]">Welcome. Here is 10% off.</span>
                  </div>
                  <div {...part(3, "space-y-2 px-1 py-1")}>
                    <Badge i={3} />
                    <span className="block h-2 w-full rounded-sm bg-ink/60" />
                    <span className="block h-2 w-11/12 rounded-sm bg-ink/30" />
                    <span className="block h-2 w-3/5 rounded-sm bg-ink/30" />
                  </div>
                  <div {...part(4, "flex justify-center py-0.5")}>
                    <Badge i={4} />
                    <span className="grid h-11 w-48 place-items-center rounded-full bg-ink text-sm font-medium text-bg">
                      Shop the bestsellers
                    </span>
                  </div>
                  <div {...part(5, "grid grid-cols-2 gap-3")}>
                    <Badge i={5} />
                    {["$24", "$32"].map((price) => (
                      <span key={price} className="block">
                        <span className="block h-20 rounded-md bg-surface" />
                        <span className="mt-2 flex items-center justify-between">
                          <span className="h-2 w-14 rounded-sm bg-ink/40" />
                          <span className="mono text-muted">{price}</span>
                        </span>
                      </span>
                    ))}
                  </div>
                  <div {...part(6, "space-y-1.5 border-t border-line px-1 pt-3 text-center")}>
                    <Badge i={6} />
                    <span className="mx-auto block h-1.5 w-40 rounded-sm bg-line" />
                    <span className="mono block text-muted underline">Unsubscribe</span>
                  </div>
                </div>
              </div>
              <p className="mono mt-4 flex items-center gap-2 text-muted">
                <span className="h-px flex-1 bg-line" />
                600px
                <span className="h-px flex-1 bg-line" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
