"use client";

import { useSite } from "../cms/SiteProvider";
import Odometer from "./Odometer";
import Ribbons from "./Ribbons";

/** "Opened": the numbers, rolling in on a bento grid under two crossing ribbons. */
export default function CountersX() {
  const { counters } = useSite();
  const items = counters.items;
  return (
    <section className="cx" aria-labelledby="cx-h" data-stage="1">
      <Ribbons />
      <div className="wrap cx-inner">
        <div className="cx-head">
          <p className="x-label">{counters.label}</p>
          <h2 id="cx-h" className="x-display cx-h2">
            {counters.heading}
          </h2>
          {counters.placeholder && <p className="mono text-muted">{counters.sampleNote}</p>}
        </div>
        <ul className="cx-grid">
          {items.map((c, i) => (
            <li key={c.id || i} className="cx-tile" data-joke={c.joke || undefined} data-first={i === 0 || undefined}>
              <Odometer value={`${Math.round(c.value)}${c.suffix ?? ""}`} className="cx-num" />
              <span className="cx-label">{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
