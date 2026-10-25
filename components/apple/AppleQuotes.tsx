"use client";

import { useSite } from "../cms/SiteProvider";

/** Testimonials as large, quiet quotes. Hidden until there's one. */
export default function AppleQuotes() {
  const site = useSite();
  const items = site.testimonials.items.filter((t) => t.quote.trim());
  if (!items.length) return null;
  return (
    <section className="apl-section" aria-labelledby="apl-quotes-h">
      <div className="apl-wrap">
        <h2 id="apl-quotes-h" className="apl-h2 apl-center">
          {site.testimonials.heading}
        </h2>
        <ul className="apl-quotes">
          {items.map((t, i) => (
            <li key={i}>
              <blockquote className="apl-quote">“{t.quote}”</blockquote>
              <p className="apl-note">
                {t.name}, {t.role}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
