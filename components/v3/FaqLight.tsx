"use client";

import { useState } from "react";
import { fill } from "@/lib/cms";
import { useSite } from "../cms/SiteProvider";

/** A light two-column FAQ: questions open in place with a turning plus. */
export default function FaqLight() {
  const { faq } = useSite();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="fq" aria-labelledby="fq-h">
      <div className="wrap fq-grid">
        <div>
          <p className="v3-label">
            {faq.label} · {fill(faq.note, faq.items.length)}
          </p>
          <h2 id="fq-h" className="v3-h2">
            {faq.heading}
          </h2>
        </div>
        <ul className="fq-list">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={i} className="fq-item" data-open={isOpen}>
                <button type="button" className="fq-q" aria-expanded={isOpen} aria-controls={`fq-a-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                  <span>{item.q}</span>
                  <span className="fq-plus" aria-hidden="true" />
                </button>
                <div id={`fq-a-${i}`} className="fq-a-wrap" role="region" aria-label={item.q}>
                  <div className="fq-a-clip">
                    <p className="fq-a">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
