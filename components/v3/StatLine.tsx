"use client";

import CountUp from "../CountUp";
import { useSite } from "../cms/SiteProvider";

/** The numbers as one calm sentence, each figure in a soft lime chip. */
export default function StatLine() {
  const { counters } = useSite();
  return (
    <section className="sl" aria-labelledby="sl-h">
      <div className="wrap">
        <p className="v3-label">{counters.label}</p>
        <h2 id="sl-h" className="sr-only">
          {counters.heading}
        </h2>
        <p className="sl-text">
          {counters.items.map((c, i) => (
            <span key={c.id || i} className="sl-item">
              <span className="sl-num" data-joke={c.joke || undefined}>
                <CountUp value={`${Math.round(c.value)}${c.suffix ?? ""}`} />
              </span>{" "}
              {c.label.toLowerCase()}
              {i < counters.items.length - 1 ? <span className="sl-sep">, </span> : <span>.</span>}{" "}
            </span>
          ))}
        </p>
        {counters.placeholder && <p className="mono mt-6 text-muted">{counters.sampleNote}</p>}
      </div>
    </section>
  );
}
