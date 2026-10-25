"use client";

import { useSite } from "../cms/SiteProvider";

/** Two marquee ribbons crossing like tape on a parcel: what I design, and where it leads. */
export default function Ribbons() {
  const site = useSite();
  const a = site.services.items.map((s) => s.title).filter(Boolean);
  const b = site.funnel.stages.filter(Boolean);
  if (!a.length && !b.length) return null;

  const Track = ({ words, sep }: { words: string[]; sep: string }) => {
    const row = Array.from({ length: Math.max(2, Math.ceil(10 / Math.max(words.length, 1))) }, () => words).flat();
    const Half = ({ hidden }: { hidden?: boolean }) => (
      <span className="rib-half" aria-hidden={hidden || undefined}>
        {row.map((w, i) => (
          <span key={i} className="rib-word">
            {w}
            <span className="rib-sep" aria-hidden="true">
              {sep}
            </span>
          </span>
        ))}
      </span>
    );
    return (
      <span className="rib-track">
        <Half />
        <Half hidden />
      </span>
    );
  };

  return (
    <div className="rib" aria-hidden="true">
      <div className="rib-band rib-a">
        <Track words={a} sep="✦" />
      </div>
      <div className="rib-band rib-b">
        <Track words={b} sep="→" />
      </div>
    </div>
  );
}
