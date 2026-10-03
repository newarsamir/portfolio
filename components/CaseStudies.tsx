"use client";

import Link from "next/link";
import { useRef } from "react";
import { site, type CaseStudy } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import EmailScroll from "./EmailScroll";
import { Reveal, SplitHeading } from "./Reveal";
import { ArrowSwap, RollText } from "./RollText";
import SectionRule from "./SectionRule";

const STACK = "(min-width: 900px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";

/**
 * Case study cards that stack on top of each other as you scroll. Each one
 * sinks back and dims a little as the next slides over it.
 */
export default function CaseStudies({ items }: { items: CaseStudy[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(STACK, () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-case-card]");
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card, {
            scale: 0.92 + i * 0.012,
            filter: "brightness(0.82)",
            ease: "none",
            scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [items.length] },
  );

  if (items.length === 0) return null;

  return (
    <section ref={root} id="cases" className="section" aria-labelledby="cases-h">
      <div className="wrap">
        <SectionRule label="Case studies" note={`${items.length} projects, start to send`} />
        <div className="grid gap-6 lg:grid-cols-12">
          <SplitHeading id="cases-h" className="display-lg lg:col-span-7">
            {site.caseStudies.heading}
          </SplitHeading>
          <Reveal className="self-end text-lg text-muted lg:col-span-5">
            <p className="max-w-[44ch]">{site.caseStudies.sub}</p>
          </Reveal>
        </div>

        <ol className="mt-14 grid gap-8 md:gap-10">
          {items.map((c, i) => (
            <li
              key={c.slug}
              data-case-card
              className="case-card group"
              style={{ ["--i" as string]: i }}
            >
              <article className="relative grid overflow-clip rounded-[2rem] border border-line bg-raised shadow-[0_30px_60px_-40px_oklch(20%_0.02_80/0.5)] md:grid-cols-[1.15fr_1fr]">
                <div className="flex flex-col p-7 md:p-10 lg:p-12">
                  <div className="mono flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
                    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-lime px-2 text-on-lime">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{c.client}</span>
                    <span aria-hidden="true">·</span>
                    <span>{c.industry}</span>
                    <span aria-hidden="true">·</span>
                    <span>{c.year}</span>
                  </div>
                  <h3 className="mt-6 text-[clamp(1.75rem,3vw,2.75rem)]">
                    <Link href={`/work/${c.slug}`} className="after:absolute after:inset-0 after:z-10 after:content-['']">
                      {c.title}
                    </Link>
                  </h3>
                  <p className="mt-4 max-w-[48ch] text-lg leading-relaxed text-muted">{c.summary}</p>
                  <ul className="mt-6 flex flex-wrap gap-2" aria-label="Services">
                    {c.services.map((s) => (
                      <li key={s} className="mono rounded-full border border-line px-3 py-1">
                        {s}
                      </li>
                    ))}
                  </ul>

                  {c.metrics.length > 0 && (
                    <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-line pt-6 max-md:mt-8">
                      {c.metrics.slice(0, 3).map((m) => (
                        <div key={m.label} className="flex flex-col-reverse gap-1">
                          <dt className="text-[0.85rem] leading-snug text-muted">{m.label}</dt>
                          <dd className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-none">
                            {m.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <span className="roll-host mt-8 inline-flex items-center gap-2 self-start font-medium">
                    <span className="border-b-[1.5px] border-ink pb-0.5">
                      <RollText text="Read the case study" />
                    </span>
                    <ArrowSwap />
                  </span>
                </div>

                <div className="relative grid place-items-center overflow-clip bg-surface p-8 gridlines md:p-10">
                  <span
                    className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime opacity-40 blur-3xl transition-transform duration-700 ease-out group-hover:scale-125"
                    aria-hidden="true"
                  />
                  <EmailScroll
                    src={c.cover}
                    phone
                    height="clamp(20rem, 52svh, 30rem)"
                    className="relative w-[min(16rem,70%)] -rotate-3 transition-transform duration-700 ease-[var(--ease-spring)] group-hover:rotate-0 group-hover:scale-[1.03]"
                  />
                </div>
              </article>
            </li>
          ))}
        </ol>

        <Reveal className="mt-12 flex justify-center">
          <Link href="/work" className="btn btn-ghost">
            <RollText text="All case studies" />
            <ArrowSwap />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
