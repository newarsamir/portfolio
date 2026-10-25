"use client";

import { useSite } from "../cms/SiteProvider";

/** Testimonials as replies in the inbox. Hidden until there's at least one. */
export default function RepliesX() {
  const site = useSite();
  const items = site.testimonials.items.filter((t) => t.quote.trim());
  if (items.length === 0) return null;
  return (
    <section className="tx" aria-labelledby="tx-h">
      <div className="wrap">
        <h2 id="tx-h" className="x-display tx-h2">
          {site.testimonials.heading}
        </h2>
        <ul className="tx-list">
          {items.map((t, i) => (
            <li key={i} className="tx-card" style={{ ["--tilt" as string]: `${(i % 3) - 1}deg` }}>
              <p className="mono text-muted">
                {site.testimonials.subjectPrefix} {site.name}
              </p>
              <blockquote className="tx-quote">{t.quote}</blockquote>
              <p className="tx-who">
                <span className="font-semibold">{t.name}</span>
                <span className="text-muted"> · {t.role}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
