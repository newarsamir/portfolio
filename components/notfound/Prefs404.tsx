"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { useSite } from "../cms/SiteProvider";
import { ArrowSwap, RollText } from "../RollText";

/** The 404 as an unsubscribe page: every preference works except the ones that matter. */
export default function Prefs404() {
  const site = useSite();
  const copy = site.notFound;
  const p = copy.prefs;
  const steps = p.frequencies.filter((f) => f.trim() !== "");
  const never = Math.max(0, steps.length - 1);
  const reasons = copy.quips.filter((q) => q.trim() !== "");
  const [freq, setFreq] = useState(never);
  const [picked, setPicked] = useState<number[]>([]);
  const [nope, setNope] = useState(0);
  const [path, setPath] = useState("");
  const snap = useRef<number | undefined>(undefined);

  useEffect(() => {
    setPath(window.location.pathname);
    return () => window.clearTimeout(snap.current);
  }, []);

  // The slider moves, then snaps back to "Never". The page has made up its mind.
  const onFreq = (v: number) => {
    setFreq(v);
    window.clearTimeout(snap.current);
    if (v !== never) snap.current = window.setTimeout(() => setFreq(never), 900);
  };

  const onToggle = () => {
    setNope((n) => n + 1);
    toast.info(p.toggleNote, p.toggle);
  };

  return (
    <main className="nfp">
      <div className="nfp-card">
        <p className="nfp-brand">
          <span className="nfp-mark" aria-hidden="true">
            {site.name.slice(0, 1)}
          </span>
          <span className="mono">{copy.eyebrow}</span>
        </p>
        <h1 className="nfp-heading">{p.heading}</h1>
        <p className="nfp-body">{p.body}</p>
        {path && (
          <p className="nfp-path mono">
            {copy.undeliverable}: <span>{path}</span>
          </p>
        )}

        <div className="nfp-group">
          <div className="nfp-row">
            <div className="min-w-0">
              <p className="nfp-label" id="nfp-toggle-label">
                {p.toggle}
              </p>
              <p className="nfp-note">{path || "/"}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked="false"
              aria-labelledby="nfp-toggle-label"
              className="nfp-switch"
              // Alternates so the shake replays on every click without remounting (which drops focus).
              data-nope={nope === 0 ? undefined : nope % 2 ? "a" : "b"}
              onClick={onToggle}
            >
              <span className="nfp-knob" />
            </button>
          </div>
        </div>

        {steps.length > 1 && (
          <div className="nfp-group">
            <div className="nfp-row nfp-row-wrap">
              <label className="nfp-label" htmlFor="nfp-freq">
                {p.frequency}
              </label>
              <output key={freq} htmlFor="nfp-freq" className="nfp-value mono blur-swap" data-never={freq === never || undefined}>
                {steps[freq]}
              </output>
            </div>
            <input
              id="nfp-freq"
              type="range"
              min={0}
              max={never}
              step={1}
              value={freq}
              onChange={(e) => onFreq(Number(e.target.value))}
              className="nfp-range"
              style={{ "--pct": `${(freq / never) * 100}%` } as React.CSSProperties}
              aria-valuetext={steps[freq]}
            />
            <div className="nfp-ticks" aria-hidden="true">
              {steps.map((s, i) => (
                <span key={s} data-on={i <= freq || undefined} />
              ))}
            </div>
          </div>
        )}

        {reasons.length > 0 && (
          <div className="nfp-group">
            <fieldset className="nfp-fieldset">
              <legend className="nfp-label">{p.reasons}</legend>
              <div className="nfp-reasons">
                {reasons.map((r, i) => (
                  <label key={i} className="nfp-check">
                    <input
                      type="checkbox"
                      checked={picked.includes(i)}
                      onChange={(e) => setPicked((all) => (e.target.checked ? [...all, i] : all.filter((x) => x !== i)))}
                    />
                    <span className="nfp-box" aria-hidden="true">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2.5 6.5 5 9l4.5-6" />
                      </svg>
                    </span>
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        <div className="nfp-actions">
          <button type="button" className="btn btn-lime" onClick={() => toast.success(p.saved, p.save)}>
            <RollText text={p.save} />
          </button>
          <Link href="/" className="btn btn-ghost">
            <RollText text={copy.primary} />
            <ArrowSwap />
          </Link>
        </div>
        <p className="nfp-foot">
          <Link href="/work">{copy.secondary}</Link>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={() => toast.info(copy.blameBody, copy.blameTitle)}>
            {copy.blame}
          </button>
        </p>
      </div>
    </main>
  );
}
