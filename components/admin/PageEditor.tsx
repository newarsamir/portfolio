"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Site } from "@/content/site";
import { resetSection, saveLayout, saveSection } from "@/app/admin/content-actions";
import {
  type AdminView,
  type Layouts,
  type PageId,
  type SectionDef,
  PAGES,
  pageSections,
  sectionById,
} from "@/lib/cms";
import { toast } from "@/lib/toast";
import FieldEditor, { Switch } from "./FieldEditor";

type Device = "desktop" | "tablet" | "mobile";
const DEVICES: Record<Device, { width: number; label: string }> = {
  desktop: { width: 1440, label: "Desktop" },
  tablet: { width: 834, label: "Tablet" },
  mobile: { width: 390, label: "Mobile" },
};

const pick = (content: Site, s: SectionDef) => Object.fromEntries(s.keys.map((k) => [k, content[k]])) as Partial<Site>;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export default function PageEditor({
  content,
  layouts: initialLayouts,
  caseSlug,
  dbConnected,
  onNavigate,
  onDirtyChange,
  request,
}: {
  content: Site;
  layouts: Layouts;
  caseSlug: string | null;
  dbConnected: boolean;
  onNavigate: (view: AdminView) => void;
  onDirtyChange: (dirty: boolean) => void;
  /** Open a section from elsewhere in the admin (the dashboard, a "Edit in Pages" link). */
  request: { id: string; n: number } | null;
}) {
  const [saved, setSaved] = useState(content);
  const [draft, setDraft] = useState(content);
  const [layouts, setLayouts] = useState(initialLayouts);
  const [page, setPage] = useState<PageId>("home");
  const [selected, setSelected] = useState<string>("hero");
  const [device, setDevice] = useState<Device>("desktop");
  const [frameKey, setFrameKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [saving, startSave] = useTransition();
  const frame = useRef<HTMLIFrameElement>(null);

  const section = sectionById(selected) ?? sectionById("hero")!;
  const dirtyIds = useMemo(
    () => new Set([...pageSections(page), ...pageSections("global")].filter((s) => !same(pick(draft, s), pick(saved, s))).map((s) => s.id)),
    [draft, saved, page],
  );
  const anyDirty = useMemo(() => !same(draft, saved), [draft, saved]);
  useEffect(() => onDirtyChange(anyDirty), [anyDirty, onDirtyChange]);

  useEffect(() => {
    if (!anyDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyDirty]);

  /* ----------------------------- Preview link ----------------------------- */

  const path = (PAGES.find((p) => p.id === page)?.path ?? "/").replace("{slug}", caseSlug ?? "missing");
  const src = `${path}${path.includes("?") ? "&" : "?"}cms=1`;

  const send = useCallback((msg: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ source: "cms-admin", ...msg }, window.location.origin);
  }, []);

  // Messages from the preview: it's ready, or a section was clicked.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const layoutsRef = useRef(layouts);
  layoutsRef.current = layouts;
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { source?: string; type?: string; id?: string };
      if (d?.source !== "cms-site") return;
      if (d.type === "select" && d.id && sectionById(d.id)) setSelected(d.id);
      if (d.type === "ready") {
        setReady(true);
        // A fresh page load shows saved content; replay any unsaved edits and layout.
        if (!same(draftRef.current, savedRef.current)) send({ type: "draft", section: "*", patch: draftRef.current });
        for (const [p, layout] of Object.entries(layoutsRef.current)) send({ type: "layout", page: p, layout });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  // Edits reach the preview a moment after typing stops.
  const timer = useRef(0);
  const pushDraft = (s: SectionDef, next: Site) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => send({ type: "draft", section: s.id, patch: pick(next, s) }), 180);
  };

  const choose = (id: string) => {
    setSelected(id);
    send({ type: "focus", id });
  };

  const switchPage = (p: PageId) => {
    if (p === page) return;
    setPage(p);
    setReady(false);
    const first = pageSections(p)[0];
    if (first) setSelected(first.id);
  };

  useEffect(() => {
    const s = request && sectionById(request.id);
    if (!s) return;
    if (s.page !== "global") setPage(s.page);
    setSelected(s.id);
    send({ type: "focus", id: s.id });
  }, [request, send]);

  /* -------------------------------- Edits -------------------------------- */

  const update = (key: keyof Site, value: unknown) => {
    const next = { ...draft, [key]: value } as Site;
    setDraft(next);
    pushDraft(section, next);
  };

  const discard = () => {
    const next = { ...draft, ...pick(saved, section) } as Site;
    setDraft(next);
    send({ type: "draft", section: section.id, patch: pick(next, section) });
  };

  const save = () =>
    startSave(async () => {
      const res = await saveSection(section.id, pick(draft, section) as Record<string, unknown>);
      toast.result(res);
      if (res.ok && res.values) {
        setSaved((s) => ({ ...s, ...res.values }) as Site);
        setDraft((d) => ({ ...d, ...res.values }) as Site);
      }
    });

  const reset = () => {
    if (!window.confirm(`Put "${section.label}" back to the original text? Your changes to it will be lost.`)) return;
    startSave(async () => {
      const res = await resetSection(section.id);
      toast.result(res);
      if (res.ok && res.values) {
        setSaved((s) => ({ ...s, ...res.values }) as Site);
        const next = { ...draft, ...res.values } as Site;
        setDraft(next);
        send({ type: "draft", section: section.id, patch: res.values });
      }
    });
  };

  const changeLayout = (p: PageId | "global", next: Layouts[PageId], message: string, reload = false) => {
    const before = layouts[p];
    setLayouts((l) => ({ ...l, [p]: next }));
    send({ type: "layout", page: p, layout: next });
    startSave(async () => {
      const res = await saveLayout(p, next);
      if (res.ok) {
        toast.success(message);
        // A section that was hidden isn't in the loaded page yet; load it fresh.
        if (reload) {
          setReady(false);
          setFrameKey((k) => k + 1);
        }
      } else {
        toast.error(res.message);
        setLayouts((l) => ({ ...l, [p]: before }));
        send({ type: "layout", page: p, layout: before });
      }
    });
  };

  const toggleHidden = (s: SectionDef) => {
    const p = s.page;
    const l = layouts[p];
    const hidden = l.hidden.includes(s.id) ? l.hidden.filter((h) => h !== s.id) : [...l.hidden, s.id];
    const showing = !hidden.includes(s.id);
    changeLayout(p, { ...l, hidden }, showing ? `${s.label} is visible again.` : `${s.label} is hidden.`, showing);
  };

  const moveSection = (s: SectionDef, d: number) => {
    const p = s.page;
    const l = layouts[p];
    const i = l.order.indexOf(s.id);
    const j = i + d;
    if (i < 0 || j < 0 || j >= l.order.length) return;
    const order = [...l.order];
    [order[i], order[j]] = [order[j], order[i]];
    changeLayout(p, { ...l, order }, `Moved ${s.label} ${d < 0 ? "up" : "down"}.`);
    window.setTimeout(() => send({ type: "focus", id: s.id }), 250);
  };

  /* ----------------------------- Preview size ----------------------------- */

  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const deviceWidth = DEVICES[device].width;
  const scale = box.w ? Math.min(1, box.w / deviceWidth) : 1;
  // The preview is shrunk to fit; tell it so its labels stay readable.
  useEffect(() => {
    if (ready) send({ type: "scale", value: scale });
  }, [ready, scale, send]);

  const ordered = (p: PageId | "global") => {
    const l = layouts[p];
    return l.order.map((id) => sectionById(id)).filter((s): s is SectionDef => Boolean(s));
  };
  const hiddenHere = section.hideable && layouts[section.page].hidden.includes(section.id);
  const isDirty = dirtyIds.has(section.id);
  const unavailable = page === "case" && !caseSlug;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[17rem_minmax(0,1fr)_23rem]">
      {/* Sections */}
      <aside className="min-h-0 border-b border-line xl:overflow-y-auto xl:border-b-0 xl:border-r" aria-label="Sections">
        <div className="p-4">
          <label htmlFor="cms-page" className="mono text-muted">
            Page
          </label>
          <select id="cms-page" value={page} onChange={(e) => switchPage(e.target.value as PageId)} className="cms-field mt-1.5">
            {PAGES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <SectionGroup
          title="Sections on this page"
          sections={ordered(page)}
          layout={layouts[page]}
          selected={selected}
          dirty={dirtyIds}
          canMove={page === "home"}
          busy={saving || !dbConnected}
          onSelect={choose}
          onToggle={toggleHidden}
          onMove={moveSection}
        />
        <SectionGroup
          title="On every page"
          sections={ordered("global")}
          layout={layouts.global}
          selected={selected}
          dirty={dirtyIds}
          canMove={false}
          busy={saving || !dbConnected}
          onSelect={choose}
          onToggle={toggleHidden}
          onMove={moveSection}
        />
      </aside>

      {/* Preview */}
      <section className="flex min-h-[70svh] min-w-0 flex-col bg-surface xl:min-h-0" aria-label="Preview">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg px-3 py-2">
          <div className="flex items-center gap-1 rounded-xl border border-line p-0.5" role="group" aria-label="Preview size">
            {(Object.keys(DEVICES) as Device[]).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={`rounded-[0.6rem] px-3 py-1.5 text-sm ${device === d ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
              >
                {DEVICES[d].label}
              </button>
            ))}
          </div>
          <p className="mono hidden truncate text-muted md:block">
            {ready ? "Click any section to edit it" : "Loading preview"}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="cms-btn"
              onClick={() => {
                setReady(false);
                setFrameKey((k) => k + 1);
              }}
            >
              Reload
            </button>
            <a href={path} target="_blank" rel="noreferrer" className="cms-btn">
              Open page ↗
            </a>
          </div>
        </div>
        <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
          {unavailable ? (
            <p className="grid h-full place-items-center p-8 text-center text-muted">
              Publish a case study first. This page previews the first one.
            </p>
          ) : (
            box.w > 0 && (
              <div
                className="absolute top-0 overflow-hidden bg-bg shadow-[0_0_0_1px_var(--line)]"
                style={{
                  width: deviceWidth,
                  height: box.h / scale,
                  left: Math.max(0, (box.w - deviceWidth * scale) / 2),
                  transform: `scale(${scale})`,
                  transformOrigin: "0 0",
                }}
              >
                <iframe
                  key={`${src}-${frameKey}`}
                  ref={frame}
                  src={src}
                  title="Page preview"
                  className="h-full w-full border-0"
                  onLoad={() => window.setTimeout(() => send({ type: "focus", id: selected }), 400)}
                />
              </div>
            )
          )}
        </div>
      </section>

      {/* Inspector */}
      <aside className="flex min-h-0 flex-col border-t border-line xl:border-l xl:border-t-0" aria-label={`Edit ${section.label}`}>
        <div className="border-b border-line p-4">
          <p className="mono text-muted">{section.page === "global" ? "On every page" : PAGES.find((p) => p.id === section.page)?.label}</p>
          <h2 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold">
            {section.label}
            {isDirty && <span className="h-2 w-2 rounded-full bg-lime ring-1 ring-ink/40" title="Unsaved changes" />}
          </h2>
          <p className="mt-1 text-sm text-muted">{section.help}</p>
          <div className="mt-3 space-y-2">
            {section.hideable && (
              <Switch
                checked={!hiddenHere}
                onChange={() => toggleHidden(section)}
                label={hiddenHere ? "Hidden on the site" : "Shown on the site"}
                help={hiddenHere ? "Turn on to bring it back." : "Turn off to hide this section."}
              />
            )}
            {section.manage && (
              <button type="button" onClick={() => onNavigate(section.manage!.view)} className="cms-btn w-full justify-center">
                {section.manage.label} →
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          {!dbConnected && (
            <p className="rounded-xl border border-line bg-surface p-3 text-sm">
              Supabase isn&apos;t connected. You can try changes in the preview, but saving needs the database.
            </p>
          )}
          {section.keys.map((key) => (
            <FieldEditor
              key={`${section.id}-${key}`}
              value={draft[key]}
              name={key}
              path={key}
              omit={section.omit}
              fixed={section.fixed}
              canUpload={dbConnected}
              onChange={(v) => update(key, v)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-bg p-3">
          <button type="button" onClick={save} disabled={!isDirty || saving || !dbConnected} className="btn btn-lime btn-sm">
            {saving ? "Saving" : isDirty ? "Save and publish" : "Saved"}
          </button>
          <button type="button" onClick={discard} disabled={!isDirty || saving} className="cms-btn">
            Discard
          </button>
          <button type="button" onClick={reset} disabled={saving || !dbConnected} className="ml-auto text-sm text-muted underline-offset-4 hover:text-danger hover:underline">
            Reset to original
          </button>
        </div>
      </aside>
    </div>
  );
}

function SectionGroup({
  title,
  sections,
  layout,
  selected,
  dirty,
  canMove,
  busy,
  onSelect,
  onToggle,
  onMove,
}: {
  title: string;
  sections: SectionDef[];
  layout: Layouts[PageId];
  selected: string;
  dirty: Set<string>;
  canMove: boolean;
  busy: boolean;
  onSelect: (id: string) => void;
  onToggle: (s: SectionDef) => void;
  onMove: (s: SectionDef, d: number) => void;
}) {
  return (
    <div className="px-2 pb-4">
      <p className="mono px-2 pb-1.5 text-muted">{title}</p>
      <ul className="space-y-0.5">
        {sections.map((s, i) => {
          const hidden = layout.hidden.includes(s.id);
          const active = selected === s.id;
          return (
            <li key={s.id} className={`group flex items-center rounded-xl ${active ? "bg-ink text-bg" : "hover:bg-surface"}`}>
              <button type="button" onClick={() => onSelect(s.id)} aria-current={active || undefined} className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left">
                <span className={`truncate text-[0.95rem] ${hidden ? "line-through opacity-50" : ""}`}>{s.label}</span>
                {dirty.has(s.id) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-lime" title="Unsaved changes" />}
                {hidden && <span className={`mono ml-auto shrink-0 text-[0.65rem] ${active ? "text-bg/70" : "text-muted"}`}>Hidden</span>}
              </button>
              <span className={`flex shrink-0 items-center pr-1 ${active ? "" : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"}`}>
                {canMove && (
                  <>
                    <RowBtn label={`Move ${s.label} up`} disabled={busy || i === 0} onClick={() => onMove(s, -1)}>
                      ↑
                    </RowBtn>
                    <RowBtn label={`Move ${s.label} down`} disabled={busy || i === sections.length - 1} onClick={() => onMove(s, 1)}>
                      ↓
                    </RowBtn>
                  </>
                )}
                {s.hideable && (
                  <RowBtn label={hidden ? `Show ${s.label}` : `Hide ${s.label}`} disabled={busy} onClick={() => onToggle(s)}>
                    <EyeIcon off={hidden} />
                  </RowBtn>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RowBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-lg text-sm hover:bg-[color-mix(in_oklch,currentColor_14%,transparent)] disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}
