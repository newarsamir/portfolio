"use client";

import Link from "next/link";
import { useSite } from "../cms/SiteProvider";
import Magnetic from "../Magnetic";
import { ArrowSwap, RollText } from "../RollText";

/** The mid-page hire-me break: a lime slab with a spinning "approved" stamp. */
export default function NudgeX({ available }: { available: boolean }) {
  const site = useSite();
  const n = site.nudge;
  const ring = `${n.button} ✦ ${available ? n.availableNote : n.eyebrow} ✦ `;
  return (
    <section className="nx" aria-labelledby="nudge-h">
      <div className="nx-slab">
        <div className="wrap nx-inner">
          <div>
            <p className="mono nx-eyebrow">
              <span className={`nx-dot ${available ? "pulse-dot" : ""}`} aria-hidden="true" />
              {available ? `${n.eyebrow} · ${n.availableNote}` : n.eyebrow}
            </p>
            <h2 id="nudge-h" className="x-display nx-h2">
              {n.headline}
            </h2>
            <p className="nx-body">{n.body}</p>
            <div className="nx-ctas">
              <Magnetic strength={0.35}>
                <Link href="/contact" className="btn nx-btn">
                  <RollText text={n.button} />
                  <ArrowSwap />
                </Link>
              </Magnetic>
              <a href={`mailto:${site.email}`} className="btn nx-btn-ghost">
                <RollText text={n.secondary} />
              </a>
            </div>
          </div>

          <Link href="/contact" className="nx-stamp x-press" aria-label={n.button}>
            <svg viewBox="0 0 200 200" className="nx-ring" aria-hidden="true">
              <defs>
                <path id="nx-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
              </defs>
              <text>
                <textPath href="#nx-circle" textLength="488">
                  {ring.repeat(2).toUpperCase()}
                </textPath>
              </text>
            </svg>
            <span className="nx-stamp-core" aria-hidden="true">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
