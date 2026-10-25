"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { CaseStudy } from "@/content/site";
import { fill } from "@/lib/cms";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { isRemote } from "@/lib/images";
import { useSite } from "../cms/SiteProvider";
import { ArrowSwap, RollText } from "../RollText";

/**
 * "Ordered": every case study is an order receipt. The services are the line
 * items, the results are the totals. The receipts stack as you scroll, each
 * one pushing the last one back.
 */
export default function CaseReceipts({ items }: { items: CaseStudy[] }) {
  const site = useSite();
  const cs = site.caseStudies;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (min-width: 900px)`, () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-rc]", root.current);
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card.querySelector("[data-rc-inner]"), {
            scale: 0.9,
            opacity: 0.35,
            filter: "blur(2px)",
            ease: "none",
            scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
          });
        });
        // The cover tilts into place as each receipt arrives.
        gsap.utils.toArray<HTMLElement>("[data-rc-cover]", root.current).forEach((el) => {
          gsap.fromTo(
            el,
            { rotate: 8, yPercent: 12, clipPath: "inset(30% 0 0 0 round 22px)" },
            {
              rotate: -3,
              yPercent: 0,
              clipPath: "inset(0% 0 0 0 round 22px)",
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "top 35%", scrub: true },
            },
          );
        });
      });
    },
    { scope: root, dependencies: [items.length] },
  );

  if (items.length === 0) return null;

  return (
    <section ref={root} id="cases" className="rcx" aria-labelledby="rc-h" data-stage="3">
      <div className="wrap">
        <div className="rcx-head">
          <div>
            <p className="x-label">
              {cs.label} · {fill(cs.note, items.length)}
            </p>
            <h2 id="rc-h" className="x-display rcx-h2">
              {cs.heading}
            </h2>
          </div>
          <p className="rcx-sub">{cs.sub}</p>
        </div>

        <ol className="rcx-list">
          {items.map((c, i) => (
            <li key={c.slug} data-rc className="rc-wrap" style={{ ["--i" as string]: i }}>
              <article data-rc-inner className="rc" aria-labelledby={`rc-${c.slug}`}>
                <div className="rc-paper">
                  <div className="rc-top mono">
                    <span>Order #{String(i + 1).padStart(4, "0")}</span>
                    <span>{c.year}</span>
                  </div>
                  <p className="rc-client">
                    {c.client}
                    <span className="text-muted"> · {c.industry}</span>
                  </p>
                  <hr className="rc-rule" />
                  <h3 id={`rc-${c.slug}`} className="rc-title">
                    {c.title}
                  </h3>
                  <p className="rc-summary">{c.summary}</p>
                  {c.services.length > 0 && (
                    <ul className="rc-lines">
                      {c.services.map((s) => (
                        <li key={s} className="rc-line">
                          <span>✓ {s}</span>
                          <span className="rc-dots" aria-hidden="true" />
                          <span className="mono">{cs.lineItem}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.metrics.length > 0 && (
                    <dl className="rc-totals">
                      {c.metrics.map((m, j) => (
                        <div key={j} className="rc-total">
                          <dt>{m.label}</dt>
                          <span className="rc-dots" aria-hidden="true" />
                          <dd className="x-display">{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="rc-foot">
                    <span className="rc-barcode" aria-hidden="true" />
                    <span className="mono text-muted">{cs.thanks}</span>
                    <Link href={`/work/${c.slug}`} className="btn btn-lime btn-sm rc-cta">
                      <RollText text={cs.cta} />
                      <ArrowSwap size={14} />
                    </Link>
                  </div>
                </div>
                {c.cover && (
                  <div data-rc-cover className="rc-cover" aria-hidden="true">
                    <Image
                      src={c.cover}
                      alt=""
                      width={900}
                      height={1400}
                      sizes="(min-width: 900px) 30vw, 80vw"
                      unoptimized={isRemote(c.cover)}
                      className="rc-cover-img"
                    />
                  </div>
                )}
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
