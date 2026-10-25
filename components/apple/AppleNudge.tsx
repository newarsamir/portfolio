"use client";

import Link from "next/link";
import { useSite } from "../cms/SiteProvider";

/** One centered statement and two actions. Nothing else. */
export default function AppleNudge({ available }: { available: boolean }) {
  const site = useSite();
  const n = site.nudge;
  return (
    <section className="apl-section apl-center" aria-labelledby="nudge-h">
      <div className="apl-wrap">
        <p className="apl-eyebrow">{available ? n.availableNote : n.eyebrow}</p>
        <h2 id="nudge-h" className="apl-h2 apl-measure-h mx-auto">
          {n.headline}
        </h2>
        <p className="apl-body apl-measure mx-auto">{n.body}</p>
        <div className="apl-actions">
          <Link href="/contact" className="apl-pill">
            {n.button}
          </Link>
          <a href={`mailto:${site.email}`} className="apl-more">
            {n.secondary}
          </a>
        </div>
      </div>
    </section>
  );
}
