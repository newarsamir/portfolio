"use client";

import Image from "next/image";
import { useId, useState, type KeyboardEvent } from "react";
import { fill } from "@/lib/cms";
import { isRemote } from "@/lib/images";
import { useSite } from "../cms/SiteProvider";

/**
 * Services as an email client: folders on the left, the email in the middle,
 * the details on the right. Picking a folder swaps the panes with a short
 * blur so the change reads as one motion.
 */
export default function ServicesClient() {
  const { services } = useSite();
  const items = services.items;
  const [active, setActive] = useState(0);
  const base = useId();
  const current = items[Math.min(active, items.length - 1)];
  if (!current) return null;

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? i + 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const j = (next + items.length) % items.length;
    setActive(j);
    document.getElementById(`${base}-tab-${j}`)?.focus();
  };

  return (
    <section className="vx" aria-labelledby="vx-h">
      <div className="wrap">
        <div className="vx-head">
          <div>
            <p className="x-label">
              {services.label} · {fill(services.note, items.length)}
            </p>
            <h2 id="vx-h" className="x-display vx-h2">
              {services.heading}
            </h2>
          </div>
          <p className="vx-sub">{services.sub}</p>
        </div>

        <div className="vx-window">
          <div className="vx-bar" aria-hidden="true">
            <span className="vx-lights">
              <i />
              <i />
              <i />
            </span>
            <span className="mono">{services.label}</span>
            <span />
          </div>
          <div className="vx-panes">
            <div role="tablist" aria-orientation="vertical" aria-label={services.label} className="vx-folders">
              {items.map((s, i) => (
                <button
                  key={s.id || i}
                  id={`${base}-tab-${i}`}
                  role="tab"
                  type="button"
                  aria-selected={i === active}
                  aria-controls={`${base}-panel`}
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className="vx-folder"
                >
                  <span className="vx-folder-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </span>
                  <span className="truncate">{s.title}</span>
                  <span className="vx-count mono">{s.tag}</span>
                </button>
              ))}
            </div>

            <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`} className="vx-view">
              <div key={active} className="vx-swap vx-preview">
                {current.image && (
                  <Image
                    src={current.image}
                    alt=""
                    width={600}
                    height={1600}
                    sizes="(min-width: 1024px) 24rem, 80vw"
                    unoptimized={isRemote(current.image)}
                    className="vx-preview-img"
                  />
                )}
              </div>
              <div key={`d${active}`} className="vx-swap vx-detail">
                <p className="mono vx-when">{current.when}</p>
                <h3 className="x-display vx-title">{current.title}</h3>
                <p className="vx-body">{current.body}</p>
                <p className="vx-tag mono">{current.tag}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
