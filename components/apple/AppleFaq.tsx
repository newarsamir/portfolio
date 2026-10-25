"use client";

import { useState } from "react";
import { useSite } from "../cms/SiteProvider";

/** Questions under hairlines; the plus turns as an answer opens. */
export default function AppleFaq() {
  const { faq } = useSite();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="apl-section" aria-labelledby="apl-faq-h">
      <div className="apl-wrap apl-narrow">
        <h2 id="apl-faq-h" className="apl-h2">
          {faq.heading}
        </h2>
        <ul className="apl-faq">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={i} data-open={isOpen}>
                <button type="button" className="apl-faq-q" aria-expanded={isOpen} aria-controls={`apl-a-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                  {item.q}
                  <span className="apl-faq-icon" aria-hidden="true" />
                </button>
                <div id={`apl-a-${i}`} role="region" aria-label={item.q} className="apl-faq-a">
                  <div className="apl-picker-clip">
                    <p className="apl-body">{item.a}</p>
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
