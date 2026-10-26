"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSite } from "../cms/SiteProvider";
import { ArrowSwap, RollText } from "../RollText";

/* --------------------------------- Geometry --------------------------------- */

/** An anchor point with its two bezier handles (in = toward the previous point). */
type Pt = { x: number; y: number; ix: number; iy: number; ox: number; oy: number; smooth: boolean };
type Glyph = Pt[][];
type Sel = { g: number; s: number; i: number } | null;

const VIEW = { x: 20, y: 20, w: 720, h: 320 };
const K = 0.5523; // circle-to-bezier handle length

const corner = (x: number, y: number): Pt => ({ x, y, ix: x, iy: y, ox: x, oy: y, smooth: false });
const shift = (pts: [number, number][], dx: number, dy: number) => pts.map(([x, y]) => corner(x + dx, y + dy));

function ellipse(cx: number, cy: number, rx: number, ry: number, reverse = false): Pt[] {
  const pts: Pt[] = [
    { x: cx, y: cy - ry, ix: cx - K * rx, iy: cy - ry, ox: cx + K * rx, oy: cy - ry, smooth: true },
    { x: cx + rx, y: cy, ix: cx + rx, iy: cy - K * ry, ox: cx + rx, oy: cy + K * ry, smooth: true },
    { x: cx, y: cy + ry, ix: cx + K * rx, iy: cy + ry, ox: cx - K * rx, oy: cy + ry, smooth: true },
    { x: cx - rx, y: cy, ix: cx - rx, iy: cy + K * ry, ox: cx - rx, oy: cy - K * ry, smooth: true },
  ];
  if (!reverse) return pts;
  return pts.reverse().map((p) => ({ ...p, ix: p.ox, iy: p.oy, ox: p.ix, oy: p.iy }));
}

/** A "4": the outline, plus the triangle that is cut out of it. */
function four(dx: number): Glyph {
  const outer: [number, number][] = [
    [125, 0],
    [170, 0],
    [170, 170],
    [205, 170],
    [205, 212],
    [170, 212],
    [170, 280],
    [122, 280],
    [122, 212],
    [0, 212],
    [0, 172],
  ];
  const counter: [number, number][] = [
    [122, 70],
    [122, 170],
    [48, 170],
  ];
  return [shift(outer, dx, 40), shift(counter, dx, 40)];
}

const initial = (): Glyph[] => [four(40), [ellipse(380, 180, 92, 140), ellipse(380, 180, 46, 96, true)], four(512)];
const ORIGINAL = JSON.stringify(initial());

function pathD(sub: Pt[]) {
  let d = `M${sub[0].x.toFixed(1)} ${sub[0].y.toFixed(1)}`;
  sub.forEach((p, i) => {
    const n = sub[(i + 1) % sub.length];
    d += `C${p.ox.toFixed(1)} ${p.oy.toFixed(1)} ${n.ix.toFixed(1)} ${n.iy.toFixed(1)} ${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
  });
  return `${d}Z`;
}

const move = (p: Pt, dx: number, dy: number): Pt => ({
  ...p,
  x: p.x + dx,
  y: p.y + dy,
  ix: p.ix + dx,
  iy: p.iy + dy,
  ox: p.ox + dx,
  oy: p.oy + dy,
});

/** Double-click: a corner grows handles along its neighbours' direction; a curve goes back to a corner. */
function toggleCurve(sub: Pt[], i: number): Pt[] {
  const p = sub[i];
  const curved = p.ix !== p.x || p.iy !== p.y || p.ox !== p.x || p.oy !== p.y;
  if (curved) return sub.map((q, k) => (k === i ? corner(q.x, q.y) : q));
  const a = sub[(i - 1 + sub.length) % sub.length];
  const b = sub[(i + 1) % sub.length];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  // A third of the way to each neighbour, but never so short it hides under the point.
  const lin = Math.max(28, Math.hypot(p.x - a.x, p.y - a.y) / 3);
  const lout = Math.max(28, Math.hypot(b.x - p.x, b.y - p.y) / 3);
  return sub.map((q, k) =>
    k === i ? { ...q, ix: q.x - ux * lin, iy: q.y - uy * lin, ox: q.x + ux * lout, oy: q.y + uy * lout, smooth: true } : q,
  );
}

/* ---------------------------------- Page ---------------------------------- */

type Drag =
  | { kind: "anchor"; g: number; s: number; i: number; start: Pt; px: number; py: number; before: Glyph[]; moved: boolean }
  | { kind: "handle"; g: number; s: number; i: number; which: "in" | "out"; mirror: boolean; before: Glyph[]; moved: boolean };

/** The 404 as an editable vector: drag its points and handles like the Direct Selection tool. */
export default function Vector404() {
  const copy = useSite().notFound;
  const svg = useRef<SVGSVGElement>(null);
  const [glyphs, setGlyphs] = useState<Glyph[]>(initial);
  const [sel, setSel] = useState<Sel>(null);
  const [unit, setUnit] = useState(1.4);
  const [path, setPath] = useState("");
  const history = useRef<Glyph[][]>([]);
  const drag = useRef<Drag | null>(null);
  const lastTap = useRef<{ g: number; s: number; i: number; t: number } | null>(null);
  const latest = useRef(glyphs);
  latest.current = glyphs;
  const edited = useMemo(() => JSON.stringify(glyphs) !== ORIGINAL, [glyphs]);

  useEffect(() => setPath(window.location.pathname), []);

  // Points and handles stay the same size on screen, whatever the 404's size.
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setUnit(VIEW.w / Math.max(1, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const commit = useCallback((before: Glyph[]) => {
    history.current.push(before);
    if (history.current.length > 60) history.current.shift();
  }, []);
  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (prev) setGlyphs(prev);
  }, []);
  const update = (g: number, s: number, fn: (sub: Pt[]) => Pt[]) =>
    setGlyphs((all) => all.map((gl, gi) => (gi !== g ? gl : gl.map((sub, si) => (si === s ? fn(sub) : sub)))));

  const toPoint = (e: { clientX: number; clientY: number }) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  const onDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const data = (e.target as SVGElement).dataset;
    const g = Number(data.g);
    const s = Number(data.s);
    const i = Number(data.i);
    if (data.kind === "anchor") {
      // A second press on the same point (double-click or double-tap) toggles curve/corner.
      const last = lastTap.current;
      if (last && last.g === g && last.s === s && last.i === i && e.timeStamp - last.t < 400) {
        lastTap.current = null;
        commit(glyphs);
        update(g, s, (sub) => toggleCurve(sub, i));
        setSel({ g, s, i });
        return;
      }
      lastTap.current = { g, s, i, t: e.timeStamp };
      const { x, y } = toPoint(e);
      svg.current?.setPointerCapture(e.pointerId);
      setSel({ g, s, i });
      drag.current = { kind: "anchor", g, s, i, start: glyphs[g][s][i], px: x, py: y, before: glyphs, moved: false };
    } else if (data.kind === "handle") {
      svg.current?.setPointerCapture(e.pointerId);
      const p = glyphs[g][s][i];
      // Alt/Option moves one handle on its own and breaks the curve, as in Illustrator.
      if (e.altKey && p.smooth) update(g, s, (sub) => sub.map((q, k) => (k === i ? { ...q, smooth: false } : q)));
      drag.current = {
        kind: "handle",
        g,
        s,
        i,
        which: data.h === "in" ? "in" : "out",
        mirror: p.smooth && !e.altKey,
        before: glyphs,
        moved: false,
      };
    } else {
      setSel(null);
    }
  };

  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const { x, y } = toPoint(e);
    if (!d.moved) {
      d.moved = true;
      commit(d.before);
    }
    if (d.kind === "anchor") {
      update(d.g, d.s, (sub) => sub.map((q, k) => (k === d.i ? move(d.start, x - d.px, y - d.py) : q)));
      return;
    }
    update(d.g, d.s, (sub) =>
      sub.map((q, k) => {
        if (k !== d.i) return q;
        const next = d.which === "in" ? { ...q, ix: x, iy: y } : { ...q, ox: x, oy: y };
        if (!d.mirror) return next;
        // Keep the curve smooth: the other handle stays opposite, at its own length.
        const ang = Math.atan2(y - q.y, x - q.x) + Math.PI;
        const len = d.which === "in" ? Math.hypot(q.ox - q.x, q.oy - q.y) : Math.hypot(q.ix - q.x, q.iy - q.y);
        const ox = q.x + Math.cos(ang) * len;
        const oy = q.y + Math.sin(ang) * len;
        return d.which === "in" ? { ...next, ox, oy } : { ...next, ix: ox, iy: oy };
      }),
    );
  };

  const onUp = () => {
    drag.current = null;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "Escape") setSel(null);
      else if (sel && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        commit(latest.current);
        update(sel.g, sel.s, (sub) => sub.map((q, k) => (k === sel.i ? move(q, dx, dy) : q)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, undo, commit]);

  const reset = () => {
    commit(glyphs);
    setGlyphs(initial());
    setSel(null);
  };

  const a = 8 * unit; // anchor square
  const r = 4.5 * unit; // handle dot

  return (
    <main className="wrap grid min-h-svh place-items-center py-24">
      <div className="nf-in w-full max-w-2xl text-center">
        <p className="mono text-muted">{copy.eyebrow}</p>
        <h1 className="mt-6">
          <svg
            ref={svg}
            viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
            className="vec-404"
            role="img"
            aria-label="404"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            {glyphs.map((gl, gi) => (
              <path key={gi} d={gl.map(pathD).join(" ")} fillRule="evenodd" className="vec-glyph" data-glyph={gi} />
            ))}
            <g className="vec-points">
              {glyphs.map((gl, gi) =>
                gl.map((sub, si) =>
                  sub.map((p, pi) => (
                    <g key={`${gi}-${si}-${pi}`}>
                      <rect
                        x={p.x - a / 2}
                        y={p.y - a / 2}
                        width={a}
                        height={a}
                        className="vec-anchor"
                        data-selected={(sel?.g === gi && sel.s === si && sel.i === pi) || undefined}
                        strokeWidth={1.25 * unit}
                      />
                      <circle cx={p.x} cy={p.y} r={14 * unit} className="vec-hit" data-kind="anchor" data-g={gi} data-s={si} data-i={pi} />
                    </g>
                  )),
                ),
              )}
              {/* Handles of the selected point and its two neighbours, drawn over the points so they win when close. */}
              {sel &&
                glyphs[sel.g][sel.s].map((p, pi, sub) => {
                  const gap = Math.abs(sel.i - pi);
                  if (gap > 1 && gap !== sub.length - 1) return null;
                  return (["in", "out"] as const).map((h) => {
                    const hx = h === "in" ? p.ix : p.ox;
                    const hy = h === "in" ? p.iy : p.oy;
                    if (hx === p.x && hy === p.y) return null;
                    return (
                      <g key={`${pi}-${h}`}>
                        <line x1={p.x} y1={p.y} x2={hx} y2={hy} className="vec-handle-line" strokeWidth={unit} />
                        <circle cx={hx} cy={hy} r={r} className="vec-handle" strokeWidth={unit} />
                        <circle
                          cx={hx}
                          cy={hy}
                          r={12 * unit}
                          className="vec-hit vec-hit-handle"
                          data-kind="handle"
                          data-h={h}
                          data-g={sel.g}
                          data-s={sel.s}
                          data-i={pi}
                        />
                      </g>
                    );
                  });
                })}
            </g>
          </svg>
        </h1>
        <p className="mt-8 font-display text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold leading-tight">{copy.headline}</p>
        <p className="mx-auto mt-4 max-w-[44ch] text-lg text-muted">{copy.pen.hint}</p>
        {path && (
          <p className="mono mx-auto mt-2 max-w-full truncate text-[0.8rem] text-muted">
            {copy.undeliverable}: <span className="text-ink">{path}</span>
          </p>
        )}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn btn-lime">
            <RollText text={copy.primary} />
            <ArrowSwap />
          </Link>
          <Link href="/work" className="btn btn-ghost">
            <RollText text={copy.secondary} />
          </Link>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={!edited}
          className="vec-reset mono mt-10 text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
        >
          {copy.pen.reset}
        </button>
      </div>
    </main>
  );
}
