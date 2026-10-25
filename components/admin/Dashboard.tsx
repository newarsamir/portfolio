"use client";

import type { AdminView, Layouts } from "@/lib/cms";
import { SECTIONS } from "@/lib/cms";
import type { ContactRow } from "./AdminPanel";
import type { DbStatusData } from "./DbStatus";

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Dashboard({
  rows,
  counts,
  layouts,
  available,
  design,
  dbConnected,
  dbStatus,
  onNavigate,
  onEditSection,
}: {
  rows: ContactRow[];
  counts: { showcase: number; cases: number; gallery: number };
  layouts: Layouts;
  available: boolean;
  design: string;
  dbConnected: boolean;
  dbStatus: DbStatusData;
  onNavigate: (v: AdminView) => void;
  onEditSection: (id: string) => void;
}) {
  const unread = rows.filter((r) => !r.is_read).length;
  const hidden = Object.values(layouts).reduce((n, l) => n + l.hidden.length, 0);
  const problems = dbStatus.checks.filter((c) => !c.ok);

  const stats: { label: string; value: number; view: AdminView; note: string }[] = [
    { label: "Unread inquiries", value: unread, view: "inbox", note: `${rows.length} in total` },
    { label: "Emails in the showcase", value: counts.showcase, view: "showcase", note: "Selected emails carousel" },
    { label: "Case studies", value: counts.cases, view: "cases", note: "On the home page and /work" },
    { label: "Gallery images", value: counts.gallery, view: "gallery", note: "AI photography section" },
  ];

  const quick = ["hero", "about", "services", "faq", "contact", "footer"].map((id) => SECTIONS.find((s) => s.id === id)!);

  return (
    <div className="space-y-8">
      <div>
        <p className="mono text-muted">{greeting()}</p>
        <h1 className="mt-1 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight">Here&apos;s your site today.</h1>
      </div>

      {(!dbConnected || problems.length > 0) && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/40 bg-surface p-4">
          <p>
            {!dbConnected
              ? "Supabase isn't connected, so changes can't be saved yet."
              : `Part of the database isn't set up: ${problems.map((c) => c.name).join(", ")}.`}
          </p>
          <button type="button" className="cms-btn" onClick={() => onNavigate("database")}>
            See what to fix
          </button>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <button
              type="button"
              onClick={() => onNavigate(s.view)}
              className="group flex h-full w-full flex-col rounded-2xl border border-line bg-raised p-5 text-left transition-colors hover:border-ink"
            >
              <span className="text-sm text-muted">{s.label}</span>
              <span className="mt-2 font-display text-4xl font-semibold">{s.value}</span>
              <span className="mt-auto pt-3 text-xs text-muted">{s.note}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl border border-line bg-raised" aria-labelledby="recent-h">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="recent-h" className="font-semibold">
              Latest inquiries
            </h2>
            <button type="button" className="cms-btn" onClick={() => onNavigate("inbox")}>
              Open inbox
            </button>
          </div>
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-muted">No inquiries yet. They show up here when someone sends the contact form.</p>
          ) : (
            <ul>
              {rows.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-start gap-3 border-b border-line px-5 py-3.5 last:border-b-0">
                  <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${r.is_read ? "bg-line" : "bg-lime ring-1 ring-ink/40"}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${r.is_read ? "" : "font-semibold"}`}>
                      {r.name}
                      {r.brand && <span className="font-normal text-muted"> · {r.brand}</span>}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {r.project_type} · {r.budget}
                    </p>
                  </div>
                  <time dateTime={r.created_at} className="mono shrink-0 text-muted">
                    {fmt.format(new Date(r.created_at))}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-raised p-5" aria-labelledby="status-h">
            <h2 id="status-h" className="font-semibold">
              Status
            </h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Availability</dt>
                <dd className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${available ? "bg-lime ring-1 ring-ink/40" : "bg-muted"}`} aria-hidden="true" />
                  {available ? "Taking projects" : "Booked"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Design</dt>
                <dd>{design}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Hidden sections</dt>
                <dd>{hidden}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Database</dt>
                <dd>{!dbConnected ? "Not connected" : problems.length ? "Needs setup" : "All good"}</dd>
              </div>
            </dl>
            <button type="button" className="cms-btn mt-4 w-full justify-center" onClick={() => onNavigate("settings")}>
              Change settings
            </button>
          </section>

          <section className="rounded-2xl border border-line bg-raised p-5" aria-labelledby="quick-h">
            <h2 id="quick-h" className="font-semibold">
              Quick edit
            </h2>
            <p className="mt-1 text-sm text-muted">Jump straight into a section in the page editor.</p>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {quick.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => onEditSection(s.id)} className="cms-btn w-full justify-center">
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
