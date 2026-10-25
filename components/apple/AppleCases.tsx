"use client";

import Image from "next/image";
import Link from "next/link";
import type { CaseStudy } from "@/content/site";
import { isRemote } from "@/lib/images";
import { useSite } from "../cms/SiteProvider";

/** Case studies as large grey tiles: the first full width, the rest side by side. */
export default function AppleCases({ items }: { items: CaseStudy[] }) {
  const site = useSite();
  const cs = site.caseStudies;
  if (items.length === 0) return null;
  return (
    <section id="cases" className="apl-section" aria-labelledby="apl-cases-h">
      <div className="apl-wrap">
        <div className="apl-split-head">
          <h2 id="apl-cases-h" className="apl-h2">
            {cs.heading}
          </h2>
          <Link href="/work" className="apl-more">
            {cs.label}
          </Link>
        </div>
        <ul className="apl-cases">
          {items.map((c, i) => (
            <li key={c.slug} className="apl-case" data-wide={i === 0 || undefined}>
              <Link href={`/work/${c.slug}`} className="apl-case-link">
                <span className="apl-case-text">
                  <span className="apl-tile-kicker">
                    {c.client} · {c.year}
                  </span>
                  <span className="apl-case-title">{c.title}</span>
                  <span className="apl-case-sum">{c.summary}</span>
                  {c.metrics.length > 0 && (
                    <span className="apl-case-metrics">
                      {c.metrics.slice(0, 3).map((m, j) => (
                        <span key={j}>
                          <span className="apl-case-metric">{m.value}</span>
                          <span className="apl-case-metric-label">{m.label}</span>
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="apl-more">{cs.cta}</span>
                </span>
                {c.cover && (
                  <span className="apl-case-media">
                    <Image src={c.cover} alt="" width={900} height={1200} sizes="(min-width: 900px) 40vw, 90vw" unoptimized={isRemote(c.cover)} className="apl-case-img" />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
