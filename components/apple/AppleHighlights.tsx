"use client";

import CountUp from "../CountUp";
import { useSite } from "../cms/SiteProvider";

/** The numbers in a quiet grey band, four columns with hairlines between. */
export default function AppleHighlights() {
  const { counters } = useSite();
  return (
    <section className="apl-band" aria-labelledby="apl-num-h">
      <div className="apl-wrap">
        <h2 id="apl-num-h" className="apl-h2 apl-center">
          {counters.heading}
        </h2>
        <ul className="apl-stats">
          {counters.items.map((c, i) => (
            <li key={c.id || i} className="apl-stat">
              <span className="apl-stat-num">
                <CountUp value={`${Math.round(c.value)}${c.suffix ?? ""}`} />
              </span>
              <span className="apl-stat-label">{c.label}</span>
            </li>
          ))}
        </ul>
        {counters.placeholder && <p className="apl-note apl-center">{counters.sampleNote}</p>}
      </div>
    </section>
  );
}
