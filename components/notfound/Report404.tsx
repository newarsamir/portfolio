"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { toast } from "@/lib/toast";
import { useSite } from "../cms/SiteProvider";
import { ArrowSwap, RollText } from "../RollText";

/* Thirty days of a page doing well, then not existing. Deterministic, so the server and browser agree. */
const DAYS = 30;
const SERIES = Array.from({ length: DAYS }, (_, i) =>
  i === DAYS - 1 ? 0 : Math.round(170 + i * 10 + 46 * Math.sin(i * 1.3) + 28 * Math.sin(i * 0.55 + 1)),
);
const MAX = 600;
const PAD = { l: 46, r: 14, t: 16, b: 30 };

/** Chart geometry in CSS pixels, so the labels and strokes stay the same size at any width. */
function geometry(cw: number) {
  const ch = Math.round(Math.min(300, Math.max(190, cw * 0.34)));
  const xAt = (i: number) => PAD.l + (i / (DAYS - 1)) * (cw - PAD.l - PAD.r);
  const yAt = (v: number) => PAD.t + (1 - v / MAX) * (ch - PAD.t - PAD.b);
  const line = SERIES.map((v, i) => `${i ? "L" : "M"}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join("");
  const area = `${line}L${xAt(DAYS - 1)} ${yAt(0)}L${xAt(0)} ${yAt(0)}Z`;
  return { cw, ch, xAt, yAt, line, area };
}

/** What each tile showed before the page went missing, and how to print it. */
const KPI_FORMATS: { from: number; fmt: (n: number) => string }[] = [
  { from: 12480, fmt: (n) => Math.round(n).toLocaleString("en-US") },
  { from: 48.2, fmt: (n) => `${n.toFixed(1)}%` },
  { from: 6.4, fmt: (n) => `${n.toFixed(1)}%` },
  {
    from: 8240,
    fmt: (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
];

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function Report404() {
  const site = useSite();
  const copy = site.notFound;
  const r = copy.report;
  const quips = copy.quips.filter((q) => q.trim() !== "");
  const kpis = r.kpis.filter((k) => k.trim() !== "");
  const [t, setT] = useState(0); // 0 = before, 1 = now (all zero)
  const [hover, setHover] = useState<number | null>(null);
  const [quip, setQuip] = useState(0);
  const [path, setPath] = useState("");
  const chart = useRef<SVGSVGElement>(null);
  const [cw, setCw] = useState(640);
  const { ch, xAt, yAt, line, area } = useMemo(() => geometry(cw), [cw]);

  useEffect(() => {
    const el = chart.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCw(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setPath(window.location.pathname);
    const q = window.setInterval(() => setQuip((n) => n + 1), 5200);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setT(1);
      return () => window.clearInterval(q);
    }
    let raf = 0;
    const start = performance.now() + 500;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / 1700));
      setT(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(q);
    };
  }, []);

  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const el = chart.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * cw;
    const i = Math.round(((x - PAD.l) / (cw - PAD.l - PAD.r)) * (DAYS - 1));
    setHover(Math.min(DAYS - 1, Math.max(0, i)));
  };

  const total = SERIES.reduce((a, b) => a + b, 0);

  return (
    <main className="nfr">
      <div className="nfr-wrap">
        <header className="nfr-head">
          <div className="min-w-0">
            <p className="mono nfr-eyebrow">{copy.eyebrow}</p>
            <h1 className="nfr-title">
              {r.title}
              <span className="nfr-path mono">{path || "…"}</span>
            </h1>
          </div>
          <div className="nfr-chips mono">
            <span className="nfr-chip">Last 30 days</span>
            <span className="nfr-chip nfr-chip-bad">
              <span className="nfr-live" aria-hidden="true" />
              404
            </span>
          </div>
        </header>

        <section className="nfr-kpis" aria-label="Results">
          {kpis.map((label, i) => {
            const f = KPI_FORMATS[i % KPI_FORMATS.length];
            return (
              <div key={`${label}-${i}`} className="nfr-kpi" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
                <p className="nfr-kpi-label">{label}</p>
                <p className="nfr-kpi-value">{f.fmt(f.from * (1 - t))}</p>
                <p className="nfr-kpi-delta mono" data-shown={t > 0.98 || undefined}>
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M5 9 1 4h8z" fill="currentColor" />
                  </svg>
                  −100%
                </p>
              </div>
            );
          })}
        </section>

        <section className="nfr-card nfr-chart-card">
          <div className="nfr-card-head">
            <h2>{r.chart}</h2>
            <p className="mono">{hover === null ? `${money(total)} total` : `Day ${hover + 1} · ${money(SERIES[hover])}`}</p>
          </div>
          <svg
            ref={chart}
            viewBox={`0 0 ${cw} ${ch}`}
            className="nfr-chart"
            role="img"
            aria-label={`${r.chart}: rising for 29 days, then zero today.`}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="nfr-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--lime)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--lime)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 200, 400, 600].map((v) => (
              <g key={v}>
                <line x1={PAD.l} x2={cw - PAD.r} y1={yAt(v)} y2={yAt(v)} className="nfr-grid" />
                <text x={PAD.l - 10} y={yAt(v) + 4} textAnchor="end" className="nfr-axis">
                  {money(v)}
                </text>
              </g>
            ))}
            <text x={PAD.l} y={ch - 8} className="nfr-axis">
              30 days ago
            </text>
            <text x={cw - PAD.r} y={ch - 8} textAnchor="end" className="nfr-axis">
              Today
            </text>
            <path d={area} fill="url(#nfr-fill)" className="nfr-area" />
            <path d={line} pathLength={1} className="nfr-line" />
            <g className="nfr-crash" transform={`translate(${xAt(DAYS - 1)} ${yAt(0)})`}>
              <circle r="14" className="nfr-pulse" />
              <circle r="5" className="nfr-dot" />
              <text y="-14" textAnchor="end" x="-8" className="nfr-crash-label">
                404
              </text>
            </g>
            {hover !== null && (
              <g className="nfr-hover" aria-hidden="true">
                <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.t} y2={yAt(0)} />
                <circle cx={xAt(hover)} cy={yAt(SERIES[hover])} r="4.5" />
              </g>
            )}
          </svg>
        </section>

        <section className="nfr-card nfr-insight">
          <p className="mono nfr-insight-label">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
            </svg>
            {r.insight}
          </p>
          <p className="nfr-advice">{r.advice}</p>
          <p key={quip} className="nfr-quip blur-swap" aria-live="polite">
            {quips.length ? quips[quip % quips.length] : copy.headline}
          </p>
          <div className="nfr-actions">
            <Link href="/" className="btn btn-lime">
              <RollText text={copy.primary} />
              <ArrowSwap />
            </Link>
            <Link href="/work" className="btn btn-ghost">
              <RollText text={copy.secondary} />
            </Link>
            <button type="button" onClick={() => toast.info(copy.blameBody, copy.blameTitle)} className="nfr-blame mono">
              {copy.blame}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
