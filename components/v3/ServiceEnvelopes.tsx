"use client";

import { useState } from "react";
import { fill } from "@/lib/cms";
import { useSite } from "../cms/SiteProvider";

/** Each service is an envelope. Hover (or tap) and the flap opens and the letter slides out. */
export default function ServiceEnvelopes() {
  const { services } = useSite();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="se" aria-labelledby="se-h">
      <div className="wrap">
        <div className="se-head">
          <div>
            <p className="v3-label">
              {services.label} · {fill(services.note, services.items.length)}
            </p>
            <h2 id="se-h" className="v3-h2">
              {services.heading}
            </h2>
          </div>
          <p className="v3-sub">{services.sub}</p>
        </div>
        <ul className="se-grid">
          {services.items.map((s, i) => (
            <li key={s.id || i}>
              <button
                type="button"
                className="se-env"
                data-open={open === i}
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="se-letter">
                  <span className="se-letter-title">{s.title}</span>
                  <span className="se-letter-body">{s.body}</span>
                </span>
                <span className="se-pocket" aria-hidden="true" />
                <span className="se-flap" aria-hidden="true" />
                <span className="se-front">
                  <span className="se-when mono">{s.when}</span>
                  <span className="se-title">{s.title}</span>
                  <span className="se-tag mono">{s.tag}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mono mt-5 text-center text-muted">{services.openHint}</p>
      </div>
    </section>
  );
}
