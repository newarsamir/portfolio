"use client";

import { useSite } from "../cms/SiteProvider";

/** Three steps in three columns, each under a hairline. */
export default function AppleProcess() {
  const { process: p } = useSite();
  return (
    <section id="process" className="apl-section" aria-labelledby="apl-process-h">
      <div className="apl-wrap">
        <h2 id="apl-process-h" className="apl-h2 apl-center">
          {p.heading}
        </h2>
        <ol className="apl-steps">
          {p.steps.map((s, i) => (
            <li key={i} className="apl-step">
              <span className="apl-step-num">{i + 1}</span>
              <h3 className="apl-h3">{s.title}</h3>
              <p className="apl-body">{s.body}</p>
              {s.detail && <p className="apl-note">{s.detail}</p>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
