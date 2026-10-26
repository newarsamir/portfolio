"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSite } from "../cms/SiteProvider";

/* --------------------------------- Geometry --------------------------------- */

type Pt = {
  x: number;
  y: number;
  ix: number;
  iy: number;
  ox: number;
  oy: number;
  smooth: boolean;
};
type Glyph = {
  id: string;
  name: string;
  fill: string;
  visible: boolean;
  subpaths: Pt[][];
};
type Tool = "direct" | "convert" | "add" | "delete";
type Sel = { g: number; s: number; i: number } | null;

const W = 760;
const H = 360;
const K = 0.5523; // circle-to-bezier handle length

const corner = (x: number, y: number): Pt => ({
  x,
  y,
  ix: x,
  iy: y,
  ox: x,
  oy: y,
  smooth: false,
});
const shift = (pts: [number, number][], dx: number, dy: number) => pts.map(([x, y]) => corner(x + dx, y + dy));

function ellipse(cx: number, cy: number, rx: number, ry: number, reverse = false): Pt[] {
  const pts: Pt[] = [
    {
      x: cx,
      y: cy - ry,
      ix: cx - K * rx,
      iy: cy - ry,
      ox: cx + K * rx,
      oy: cy - ry,
      smooth: true,
    },
    {
      x: cx + rx,
      y: cy,
      ix: cx + rx,
      iy: cy - K * ry,
      ox: cx + rx,
      oy: cy + K * ry,
      smooth: true,
    },
    {
      x: cx,
      y: cy + ry,
      ix: cx + K * rx,
      iy: cy + ry,
      ox: cx - K * rx,
      oy: cy + ry,
      smooth: true,
    },
    {
      x: cx - rx,
      y: cy,
      ix: cx - rx,
      iy: cy + K * ry,
      ox: cx - rx,
      oy: cy - K * ry,
      smooth: true,
    },
  ];
  if (!reverse) return pts;
  return pts.reverse().map((p) => ({ ...p, ix: p.ox, iy: p.oy, ox: p.ix, oy: p.iy }));
}

function four(dx: number): Pt[][] {
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

function initialGlyphs(): Glyph[] {
  return [
    { id: "a", name: "4", fill: "ink", visible: true, subpaths: four(40) },
    {
      id: "b",
      name: "0",
      fill: "lime",
      visible: true,
      subpaths: [ellipse(380, 180, 92, 140), ellipse(380, 180, 46, 96, true)],
    },
    { id: "c", name: "4", fill: "ink", visible: true, subpaths: four(512) },
  ];
}

const FILLS: Record<string, string> = {
  ink: "#1c1b17",
  lime: "#c6f432",
  cream: "#f4f1e6",
  coral: "#ff6b4a",
  none: "none",
};

function pathD(sub: Pt[]) {
  if (!sub.length) return "";
  let d = `M${sub[0].x.toFixed(1)} ${sub[0].y.toFixed(1)}`;
  sub.forEach((p, i) => {
    const n = sub[(i + 1) % sub.length];
    d += `C${p.ox.toFixed(1)} ${p.oy.toFixed(1)} ${n.ix.toFixed(1)} ${n.iy.toFixed(1)} ${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
  });
  return `${d}Z`;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function bez(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** Splits the segment after point i at t (de Casteljau), returning the new subpath. */
function splitAt(sub: Pt[], i: number, t: number): Pt[] {
  const a = sub[i];
  const b = sub[(i + 1) % sub.length];
  const p01 = { x: lerp(a.x, a.ox, t), y: lerp(a.y, a.oy, t) };
  const p12 = { x: lerp(a.ox, b.ix, t), y: lerp(a.oy, b.iy, t) };
  const p23 = { x: lerp(b.ix, b.x, t), y: lerp(b.iy, b.y, t) };
  const p012 = { x: lerp(p01.x, p12.x, t), y: lerp(p01.y, p12.y, t) };
  const p123 = { x: lerp(p12.x, p23.x, t), y: lerp(p12.y, p23.y, t) };
  const mid = { x: lerp(p012.x, p123.x, t), y: lerp(p012.y, p123.y, t) };
  const out = sub.map((p) => ({ ...p }));
  out[i] = { ...out[i], ox: p01.x, oy: p01.y };
  const bi = (i + 1) % sub.length;
  out[bi] = { ...out[bi], ix: p23.x, iy: p23.y };
  const curved = Math.hypot(p012.x - mid.x, p012.y - mid.y) > 0.5;
  const np: Pt = {
    x: mid.x,
    y: mid.y,
    ix: p012.x,
    iy: p012.y,
    ox: p123.x,
    oy: p123.y,
    smooth: curved,
  };
  out.splice(i + 1, 0, np);
  return out;
}

function toSvg(glyphs: Glyph[]) {
  const paths = glyphs
    .filter((g) => g.visible)
    .map((g) => {
      const fill = FILLS[g.fill] ?? FILLS.ink;
      const stroke = fill === "none" ? ' stroke="#1c1b17" stroke-width="2"' : "";
      return `  <path d="${g.subpaths.map(pathD).join(" ")}" fill="${fill}" fill-rule="evenodd"${stroke}/>`;
    })
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n  <rect width="${W}" height="${H}" fill="#ffffff"/>\n${paths}\n</svg>\n`;
}

/* ---------------------------------- Editor ---------------------------------- */

type Drag =
  | {
      kind: "anchor";
      g: number;
      s: number;
      i: number;
      start: Pt;
      px: number;
      py: number;
    }
  | {
      kind: "handle";
      g: number;
      s: number;
      i: number;
      which: "in" | "out";
      mirror: boolean;
    }
  | { kind: "convert"; g: number; s: number; i: number; moved: boolean }
  | { kind: "glyph"; g: number; start: Glyph; px: number; py: number };

const TOOLS: { id: Tool; label: string; key: string; icon: string }[] = [
  {
    id: "direct",
    label: "Direct Selection",
    key: "A",
    icon: "M5 3l13 9-6 1.2L9 20z",
  },
  {
    id: "convert",
    label: "Convert Anchor Point",
    key: "Shift+C",
    icon: "M4 20 12 4l8 16M8 12h8",
  },
  { id: "add", label: "Add Anchor Point", key: "+", icon: "M12 5v14M5 12h14" },
  { id: "delete", label: "Delete Anchor Point", key: "−", icon: "M5 12h14" },
];

export default function PenTool404() {
  const site = useSite();
  const copy = site.notFound;
  const pen = copy.pen;
  const svg = useRef<SVGSVGElement>(null);
  const [glyphs, setGlyphs] = useState<Glyph[]>(initialGlyphs);
  const [tool, setTool] = useState<Tool>("direct");
  const [sel, setSel] = useState<Sel>(null);
  const [layer, setLayer] = useState<number | null>(null);
  const [outline, setOutline] = useState(false);
  const [unit, setUnit] = useState(1);
  const [path, setPath] = useState("");
  const history = useRef<Glyph[][]>([]);
  const drag = useRef<Drag | null>(null);
  const glyphsRef = useRef(glyphs);
  glyphsRef.current = glyphs;

  useEffect(() => setPath(window.location.pathname), []);

  // Handles stay the same size on screen whatever the artboard's scale.
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setUnit(W / Math.max(1, el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const remember = useCallback(() => {
    history.current.push(structuredClone(glyphsRef.current));
    if (history.current.length > 60) history.current.shift();
  }, []);
  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (prev) setGlyphs(prev);
  }, []);
  const reset = () => {
    remember();
    setGlyphs(initialGlyphs());
    setSel(null);
  };

  const toPoint = (e: { clientX: number; clientY: number }) => {
    const el = svg.current!;
    const m = el.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  const update = (g: number, s: number, fn: (sub: Pt[]) => Pt[]) =>
    setGlyphs((all) =>
      all.map((gl, gi) =>
        gi !== g
          ? gl
          : {
              ...gl,
              subpaths: gl.subpaths.map((sub, si) => (si === s ? fn(sub) : sub)),
            },
      ),
    );

  const nearestSegment = (x: number, y: number) => {
    let best = { g: -1, s: -1, i: -1, t: 0, d: Infinity };
    glyphsRef.current.forEach((gl, g) => {
      if (!gl.visible) return;
      gl.subpaths.forEach((sub, s) =>
        sub.forEach((a, i) => {
          const b = sub[(i + 1) % sub.length];
          for (let k = 1; k < 40; k++) {
            const t = k / 40;
            const px = bez(a.x, a.ox, b.ix, b.x, t);
            const py = bez(a.y, a.oy, b.iy, b.y, t);
            const d = Math.hypot(px - x, py - y);
            if (d < best.d) best = { g, s, i, t, d };
          }
        }),
      );
    });
    return best;
  };

  /* ------------------------------ Pointer input ------------------------------ */

  const onDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const data = target.dataset;
    const { x, y } = toPoint(e);
    const g = Number(data.g);
    const s = Number(data.s);
    const i = Number(data.i);
    svg.current?.setPointerCapture(e.pointerId);

    if (tool === "add") {
      const hit = nearestSegment(x, y);
      if (hit.g < 0 || hit.d > 14 * unit) return;
      remember();
      update(hit.g, hit.s, (sub) => splitAt(sub, hit.i, hit.t));
      setSel({ g: hit.g, s: hit.s, i: hit.i + 1 });
      setLayer(hit.g);
      return;
    }
    if (data.kind === "anchor") {
      const p = glyphsRef.current[g].subpaths[s][i];
      setSel({ g, s, i });
      setLayer(g);
      if (tool === "delete") {
        if (glyphsRef.current[g].subpaths[s].length <= 3) return;
        remember();
        update(g, s, (sub) => sub.filter((_, k) => k !== i));
        setSel(null);
        return;
      }
      remember();
      drag.current =
        tool === "convert" ? { kind: "convert", g, s, i, moved: false } : { kind: "anchor", g, s, i, start: { ...p }, px: x, py: y };
      return;
    }
    if (data.kind === "handle") {
      remember();
      const p = glyphsRef.current[g].subpaths[s][i];
      // Alt (or the Convert tool) moves one handle on its own, breaking the curve.
      const independent = e.altKey || tool === "convert";
      if (independent && p.smooth) update(g, s, (sub) => sub.map((q, k) => (k === i ? { ...q, smooth: false } : q)));
      drag.current = {
        kind: "handle",
        g,
        s,
        i,
        which: data.h === "in" ? "in" : "out",
        mirror: p.smooth && !independent,
      };
      setSel({ g, s, i });
      return;
    }
    if (data.kind === "glyph" && tool === "direct") {
      remember();
      setLayer(g);
      setSel(null);
      drag.current = {
        kind: "glyph",
        g,
        start: structuredClone(glyphsRef.current[g]),
        px: x,
        py: y,
      };
      return;
    }
    setSel(null);
    setLayer(null);
  };

  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const { x, y } = toPoint(e);
    if (d.kind === "anchor") {
      const dx = x - d.px;
      const dy = y - d.py;
      const p = d.start;
      update(d.g, d.s, (sub) =>
        sub.map((q, k) =>
          k === d.i
            ? {
                ...q,
                x: p.x + dx,
                y: p.y + dy,
                ix: p.ix + dx,
                iy: p.iy + dy,
                ox: p.ox + dx,
                oy: p.oy + dy,
              }
            : q,
        ),
      );
    } else if (d.kind === "handle") {
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
    } else if (d.kind === "convert") {
      d.moved = true;
      update(d.g, d.s, (sub) =>
        sub.map((q, k) =>
          k === d.i
            ? {
                ...q,
                ox: x,
                oy: y,
                ix: 2 * q.x - x,
                iy: 2 * q.y - y,
                smooth: true,
              }
            : q,
        ),
      );
    } else if (d.kind === "glyph") {
      const dx = x - d.px;
      const dy = y - d.py;
      setGlyphs((all) =>
        all.map((gl, gi) =>
          gi !== d.g
            ? gl
            : {
                ...gl,
                subpaths: d.start.subpaths.map((sub) =>
                  sub.map((p) => ({
                    ...p,
                    x: p.x + dx,
                    y: p.y + dy,
                    ix: p.ix + dx,
                    iy: p.iy + dy,
                    ox: p.ox + dx,
                    oy: p.oy + dy,
                  })),
                ),
              },
        ),
      );
    }
  };

  const onUp = () => {
    const d = drag.current;
    // A click (no drag) with Convert turns a smooth point back into a corner.
    if (d?.kind === "convert" && !d.moved) {
      update(d.g, d.s, (sub) => sub.map((q, k) => (k === d.i ? { ...q, ix: q.x, iy: q.y, ox: q.x, oy: q.y, smooth: false } : q)));
    }
    drag.current = null;
  };

  /* -------------------------------- Keyboard -------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        setOutline((o) => !o);
      } else if (!mod && (e.key === "a" || e.key === "v")) setTool("direct");
      else if (!mod && e.key === "C" && e.shiftKey) setTool("convert");
      else if (!mod && (e.key === "+" || e.key === "=")) setTool("add");
      else if (!mod && (e.key === "-" || e.key === "_")) setTool("delete");
      else if (e.key === "Escape") setSel(null);
      else if (sel && (e.key === "Delete" || e.key === "Backspace")) {
        if (glyphsRef.current[sel.g].subpaths[sel.s].length <= 3) return;
        e.preventDefault();
        remember();
        update(sel.g, sel.s, (sub) => sub.filter((_, k) => k !== sel.i));
        setSel(null);
      } else if (sel && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        remember();
        update(sel.g, sel.s, (sub) =>
          sub.map((q, k) =>
            k === sel.i
              ? {
                  ...q,
                  x: q.x + dx,
                  y: q.y + dy,
                  ix: q.ix + dx,
                  iy: q.iy + dy,
                  ox: q.ox + dx,
                  oy: q.oy + dy,
                }
              : q,
          ),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, undo, remember]);

  /* --------------------------------- Actions --------------------------------- */

  const exportSvg = () => {
    const blob = new Blob([toSvg(glyphs)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "404.svg";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const setFill = (fill: string) => {
    remember();
    setGlyphs((all) => all.map((g, gi) => (layer === null || gi === layer ? { ...g, fill } : g)));
  };
  const selected = sel ? glyphs[sel.g]?.subpaths[sel.s]?.[sel.i] : null;
  const setCoord = (axis: "x" | "y", v: number) => {
    if (!sel || !selected || !Number.isFinite(v)) return;
    remember();
    const d = v - selected[axis];
    update(sel.g, sel.s, (sub) =>
      sub.map((q, k) =>
        k !== sel.i
          ? q
          : axis === "x"
            ? { ...q, x: q.x + d, ix: q.ix + d, ox: q.ox + d }
            : { ...q, y: q.y + d, iy: q.iy + d, oy: q.oy + d },
      ),
    );
  };
  const pointCount = useMemo(() => glyphs.reduce((n, g) => n + g.subpaths.reduce((m, s) => m + s.length, 0), 0), [glyphs]);

  const a = 7 * unit; // anchor size
  const r = 4 * unit; // handle radius

  return (
    <main className="pt">
      <h1 className="sr-only">{copy.headline}</h1>
      <div className="pt-menubar" aria-hidden="true">
        <span className="pt-logo">Ai</span>
        {["File", "Edit", "Object", "Type", "Select", "Effect", "View", "Window", "Help"].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      <div className="pt-tabbar">
        <span className="pt-tab">
          {pen.file} @ 100% (RGB/{outline ? "Outline" : "Preview"})
        </span>
        <span className="pt-tab-note">{copy.eyebrow}</span>
      </div>

      <div className="pt-body">
        <div className="pt-tools" role="toolbar" aria-label="Tools">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="pt-tool"
              aria-pressed={tool === t.id}
              title={`${t.label} (${t.key})`}
              aria-label={`${t.label} (${t.key})`}
              onClick={() => setTool(t.id)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              >
                <path d={t.icon} />
              </svg>
            </button>
          ))}
          <span className="pt-tool-sep" />
          <button type="button" className="pt-tool" title="Undo (Cmd/Ctrl+Z)" aria-label="Undo" onClick={undo}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
            </svg>
          </button>
          <button
            type="button"
            className="pt-tool"
            aria-pressed={outline}
            title={`${pen.outline} (Cmd/Ctrl+Y)`}
            aria-label={pen.outline}
            onClick={() => setOutline((o) => !o)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="7" />
            </svg>
          </button>
        </div>

        <div className="pt-canvas">
          <p className="pt-hint">{pen.hint}</p>
          <svg
            ref={svg}
            viewBox={`0 0 ${W} ${H}`}
            className="pt-board"
            data-tool={tool}
            role="img"
            aria-label="404, drawn as editable vector paths"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <rect width={W} height={H} fill="#ffffff" />
            {glyphs.map((g, gi) =>
              g.visible ? (
                <path
                  key={g.id}
                  d={g.subpaths.map(pathD).join(" ")}
                  fillRule="evenodd"
                  data-kind="glyph"
                  data-g={gi}
                  fill={outline ? "none" : FILLS[g.fill]}
                  stroke={outline || g.fill === "none" ? "#1c1b17" : layer === gi ? "#3b82f6" : "none"}
                  strokeWidth={outline || g.fill === "none" ? 1.2 * unit : 1.5 * unit}
                  className="pt-glyph"
                />
              ) : null,
            )}
            {/* Anchors and handles of the selected layer (all layers in outline view). */}
            {glyphs.map((g, gi) =>
              g.visible && (layer === gi || outline || layer === null)
                ? g.subpaths.map((sub, si) =>
                    sub.map((p, pi) => {
                      const isSel = sel && sel.g === gi && sel.s === si && sel.i === pi;
                      const showHandles = isSel || (sel && sel.g === gi && sel.s === si && Math.abs(sel.i - pi) === 1);
                      return (
                        <g key={`${g.id}-${si}-${pi}`}>
                          {showHandles && (p.ix !== p.x || p.iy !== p.y) && (
                            <>
                              <line x1={p.x} y1={p.y} x2={p.ix} y2={p.iy} className="pt-handle-line" strokeWidth={unit} />
                              <circle
                                cx={p.ix}
                                cy={p.iy}
                                r={r}
                                className="pt-handle"
                                data-kind="handle"
                                data-h="in"
                                data-g={gi}
                                data-s={si}
                                data-i={pi}
                                strokeWidth={unit}
                              />
                            </>
                          )}
                          {showHandles && (p.ox !== p.x || p.oy !== p.y) && (
                            <>
                              <line x1={p.x} y1={p.y} x2={p.ox} y2={p.oy} className="pt-handle-line" strokeWidth={unit} />
                              <circle
                                cx={p.ox}
                                cy={p.oy}
                                r={r}
                                className="pt-handle"
                                data-kind="handle"
                                data-h="out"
                                data-g={gi}
                                data-s={si}
                                data-i={pi}
                                strokeWidth={unit}
                              />
                            </>
                          )}
                          <rect
                            x={p.x - a / 2}
                            y={p.y - a / 2}
                            width={a}
                            height={a}
                            className="pt-anchor"
                            data-selected={isSel || undefined}
                            data-kind="anchor"
                            data-g={gi}
                            data-s={si}
                            data-i={pi}
                            strokeWidth={unit}
                          />
                        </g>
                      );
                    }),
                  )
                : null,
            )}
          </svg>
          <div className="pt-ctas">
            <Link href="/" className="pt-btn pt-btn-primary">
              {copy.primary}
            </Link>
            <Link href="/work" className="pt-btn">
              {copy.secondary}
            </Link>
          </div>
        </div>

        <aside className="pt-panels" aria-label="Panels">
          <section className="pt-panel">
            <h2>Transform</h2>
            {selected ? (
              <div className="pt-fields">
                {(["x", "y"] as const).map((axis) => (
                  <label key={axis}>
                    <span>{axis.toUpperCase()}</span>
                    <input type="number" value={Math.round(selected[axis])} onChange={(e) => setCoord(axis, Number(e.target.value))} />
                  </label>
                ))}
                <p className="pt-dim">{selected.smooth ? "Smooth point" : "Corner point"}</p>
              </div>
            ) : (
              <p className="pt-dim">Select an anchor to see its position.</p>
            )}
          </section>
          <section className="pt-panel">
            <h2>Fill</h2>
            <div className="pt-swatches">
              {Object.entries(FILLS).map(([id, color]) => (
                <button
                  key={id}
                  type="button"
                  className="pt-swatch"
                  data-none={color === "none" || undefined}
                  style={{ background: color === "none" ? undefined : color }}
                  aria-label={`Fill ${id}`}
                  title={id}
                  onClick={() => setFill(id)}
                />
              ))}
            </div>
            <p className="pt-dim">{layer === null ? "Applies to every layer." : `Applies to layer “${glyphs[layer].name}”.`}</p>
          </section>
          <section className="pt-panel">
            <h2>Layers</h2>
            <ul className="pt-layers">
              {glyphs.map((g, gi) => (
                <li key={g.id} data-on={layer === gi || undefined}>
                  <button
                    type="button"
                    className="pt-eye"
                    aria-label={g.visible ? `Hide layer ${g.name}` : `Show layer ${g.name}`}
                    aria-pressed={g.visible}
                    onClick={() => setGlyphs((all) => all.map((x, xi) => (xi === gi ? { ...x, visible: !x.visible } : x)))}
                  >
                    {g.visible ? "●" : "○"}
                  </button>
                  <button type="button" className="pt-layer-name" onClick={() => setLayer(layer === gi ? null : gi)}>
                    <span
                      className="pt-layer-swatch"
                      style={{
                        background: FILLS[g.fill] === "none" ? "transparent" : FILLS[g.fill],
                      }}
                    />
                    Layer “{g.name}”
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <div className="pt-panel pt-actions">
            <button type="button" className="pt-btn pt-btn-primary" onClick={exportSvg}>
              {pen.export}
            </button>
            <button type="button" className="pt-btn" onClick={reset}>
              {pen.reset}
            </button>
          </div>
        </aside>
      </div>

      <footer className="pt-status">
        <span>
          {pointCount} anchor points · {TOOLS.find((t) => t.id === tool)?.label}
        </span>
        <span className="pt-path">
          {copy.undeliverable}: {path}
        </span>
      </footer>
    </main>
  );
}
