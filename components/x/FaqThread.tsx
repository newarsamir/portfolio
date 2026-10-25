"use client";

import { useState } from "react";
import { fill } from "@/lib/cms";
import { useSite } from "../cms/SiteProvider";

/** The FAQ as an email thread: your question, my reply underneath. */
export default function FaqThread() {
  const site = useSite();
  const faq = site.faq;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="qx" aria-labelledby="qx-h">
      <div className="wrap qx-grid">
        <div className="qx-head">
          <p className="x-label">
            {faq.label} · {fill(faq.note, faq.items.length)}
          </p>
          <h2 id="qx-h" className="x-display qx-h2">
            {faq.heading}
          </h2>
        </div>
        <ul className="qx-thread">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={i} className="qx-item" data-open={isOpen}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`qx-a-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="qx-q"
                >
                  <span className="qx-meta mono">
                    <span className="qx-avatar qx-avatar-you" aria-hidden="true">
                      {faq.asker.slice(0, 1)}
                    </span>
                    {faq.asker}
                    <span className="qx-replies">{isOpen ? "" : faq.replyNote}</span>
                  </span>
                  <span className="qx-q-text">{item.q}</span>
                </button>
                <div id={`qx-a-${i}`} className="qx-a-wrap" role="region" aria-label={item.q}>
                  <div className="qx-a-clip">
                    <div className="qx-a">
                      <span className="qx-meta mono">
                        <span className="qx-avatar" aria-hidden="true">
                          {site.name.slice(0, 1).toUpperCase()}
                        </span>
                        {site.name}
                      </span>
                      <p>{item.a}</p>
                    </div>
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
