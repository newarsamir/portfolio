"use client";

import Link from "next/link";
import { useSite } from "../cms/SiteProvider";
import Magnetic from "../Magnetic";
import { ArrowSwap, RollText } from "../RollText";

/** The hire-me break as a lime sticky note, taped to the page. */
export default function NoteNudge({ available }: { available: boolean }) {
  const site = useSite();
  const n = site.nudge;
  return (
    <section className="nn" aria-labelledby="nudge-h">
      <div className="wrap">
        <div className="nn-note">
          <span className="nn-tape" aria-hidden="true" />
          <p className="mono nn-eyebrow">{available ? `${n.eyebrow} · ${n.availableNote}` : n.eyebrow}</p>
          <h2 id="nudge-h" className="nn-h2">
            {n.headline}
          </h2>
          <p className="nn-body">{n.body}</p>
          <div className="nn-ctas">
            <Magnetic strength={0.3}>
              <Link href="/contact" className="btn nn-btn">
                <RollText text={n.button} />
                <ArrowSwap />
              </Link>
            </Magnetic>
            <a href={`mailto:${site.email}`} className="nn-link">
              {n.secondary}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
