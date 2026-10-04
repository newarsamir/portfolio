"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import {
  deleteCaseStudy,
  importSampleCaseStudies,
  reorderCaseStudies,
  saveCaseStudy,
  setCaseStudyPublished,
} from "@/app/admin/actions";
import type { CaseMetric } from "@/content/site";
import { toast } from "@/lib/toast";

export type AdminCaseStudy = {
  id: string | null;
  slug: string;
  title: string;
  client: string;
  industry: string;
  year: string;
  services: string[];
  summary: string;
  cover: string;
  challenge: string;
  approach: string;
  outcome: string;
  metrics: CaseMetric[];
  gallery: string[];
  published: boolean;
};

const EMPTY: AdminCaseStudy = {
  id: null,
  slug: "",
  title: "",
  client: "",
  industry: "",
  year: String(new Date().getFullYear()),
  services: [],
  summary: "",
  cover: "",
  challenge: "",
  approach: "",
  outcome: "",
  metrics: [{ value: "", label: "" }],
  gallery: [],
  published: false,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export default function CaseStudiesAdmin({
  items,
  fromDb,
  dbConnected,
  loadError,
}: {
  items: AdminCaseStudy[];
  fromDb: boolean;
  dbConnected: boolean;
  loadError: string | null;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [editing, setEditing] = useState<AdminCaseStudy | null>(null);
  const [busy, startTransition] = useTransition();
  const canEdit = dbConnected && fromDb;

  useEffect(() => setRows(items), [items]);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const res = await fn();
      toast.result(res);
      if (res.ok) router.refresh();
    });

  const move = (index: number, dir: -1 | 1) => {
    const next = [...rows];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setRows(next);
    run(() => reorderCaseStudies(next.map((r) => r.id!)));
  };

  if (editing) {
    return (
      <Editor
        key={editing.id ?? "new"}
        initial={editing}
        onDone={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Case studies</h2>
          <p className="text-[0.95rem] text-muted">
            Published ones show on the home page and at /work. Drafts stay hidden.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && rows.length === 0 && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(importSampleCaseStudies)}>
              Import the samples
            </button>
          )}
          <button
            type="button"
            className="btn btn-lime btn-sm"
            disabled={!canEdit}
            onClick={() => setEditing({ ...EMPTY, metrics: [{ value: "", label: "" }] })}
          >
            New case study
          </button>
        </div>
      </div>

      {!canEdit && (
        <p className="mt-5 rounded-xl border border-line bg-surface p-4 text-[0.95rem]">
          {loadError ??
            "Supabase isn't connected, so these are the read-only samples from content/site.ts."}{" "}
          Connect Supabase and run <code className="mono">supabase/schema.sql</code> to create, edit and delete case
          studies here.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-8 text-center text-muted">
          No case studies yet, so the site shows the samples from content/site.ts. Start a new one, or import the samples
          and edit them.
        </p>
      ) : (
        <ol className="mt-6 grid gap-3">
          {rows.map((c, i) => (
            <li
              key={c.id ?? c.slug}
              className="grid items-center gap-4 rounded-2xl border border-line bg-raised p-3 sm:grid-cols-[5rem_1fr_auto]"
            >
              <div className="hidden h-20 w-20 overflow-clip rounded-xl bg-surface sm:block">
                {c.cover && (
                  <img src={c.cover} alt="" className="h-full w-full object-cover object-top" loading="lazy" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`mono rounded-full px-2 py-0.5 text-xs ${
                      c.published ? "bg-lime text-on-lime" : "border border-line text-muted"
                    }`}
                  >
                    {c.published ? "Live" : "Draft"}
                  </span>
                  <span className="mono truncate text-xs text-muted">/work/{c.slug}</span>
                </div>
                <p className="mt-1 truncate font-medium">{c.title}</p>
                <p className="truncate text-[0.9rem] text-muted">
                  {[c.client, c.industry, c.year].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5 text-[0.9rem]">
                {canEdit && (
                  <>
                    <button
                      type="button"
                      aria-label={`Move ${c.title} up`}
                      disabled={busy || i === 0}
                      onClick={() => move(i, -1)}
                      className="rounded-lg border border-line px-2.5 py-1.5 hover:bg-surface disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${c.title} down`}
                      disabled={busy || i === rows.length - 1}
                      onClick={() => move(i, 1)}
                      className="rounded-lg border border-line px-2.5 py-1.5 hover:bg-surface disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => setCaseStudyPublished(c.id!, !c.published))}
                      className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface"
                    >
                      {c.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(c)}
                      className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface"
                    >
                      Edit
                    </button>
                  </>
                )}
                {c.published && (
                  <a
                    href={`/work/${c.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface"
                  >
                    View
                  </a>
                )}
                {canEdit && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (!window.confirm(`Delete "${c.title}"? This can't be undone.`)) return;
                      run(() => deleteCaseStudy(c.id!));
                    }}
                    className="rounded-lg border border-line px-3 py-1.5 text-danger hover:bg-surface"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

/* ------------------------------- Editor ------------------------------- */

function Editor({ initial, onDone }: { initial: AdminCaseStudy; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveCaseStudy, null);
  const [id, setId] = useState(initial.id);
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [client, setClient] = useState(initial.client);
  const [summary, setSummary] = useState(initial.summary);
  const [cover, setCover] = useState(initial.cover);
  const [services, setServices] = useState(initial.services.join(", "));
  const [metrics, setMetrics] = useState<CaseMetric[]>(
    initial.metrics.length ? initial.metrics : [{ value: "", label: "" }],
  );

  // A new case study gets its id on the first save, so later saves update it.
  useEffect(() => {
    if (!state) return;
    toast.result(state);
    if (state.ok && state.id) setId(state.id);
  }, [state]);

  const field = "field";
  const label = "mb-2 block font-medium";
  const help = "mt-1.5 text-[0.9rem] text-muted";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => onDone()} className="mono text-muted hover:text-ink">
          ← All case studies
        </button>
        <p className="mono text-muted">{id ? "Editing" : "New case study"}</p>
      </div>

      <form action={action} className="mt-6 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <input type="hidden" name="id" value={id ?? ""} />
        <div className="space-y-8">
          <fieldset className="grid gap-5">
            <legend className="mb-4 font-display text-2xl font-semibold">The basics</legend>
            <div>
              <label htmlFor="cs-title" className={label}>
                Title
              </label>
              <input
                id="cs-title"
                name="title"
                required
                maxLength={160}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="cs-slug" className={label}>
                URL slug
              </label>
              <div className="flex items-center gap-2">
                <span className="mono shrink-0 text-muted">/work/</span>
                <input
                  id="cs-slug"
                  name="slug"
                  required
                  maxLength={80}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                  className={field}
                />
              </div>
              <p className={help}>Lowercase letters, numbers and dashes. Changing it breaks old links.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="cs-client" className={label}>
                  Client
                </label>
                <input
                  id="cs-client"
                  name="client"
                  maxLength={120}
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="cs-industry" className={label}>
                  Industry
                </label>
                <input id="cs-industry" name="industry" maxLength={120} defaultValue={initial.industry} className={field} />
              </div>
              <div>
                <label htmlFor="cs-year" className={label}>
                  Year
                </label>
                <input id="cs-year" name="year" maxLength={20} defaultValue={initial.year} className={field} />
              </div>
            </div>
            <div>
              <label htmlFor="cs-services" className={label}>
                Services
              </label>
              <input
                id="cs-services"
                name="services"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                className={field}
              />
              <p className={help}>Separate with commas, for example: Welcome flow, Template system.</p>
            </div>
            <div>
              <label htmlFor="cs-summary" className={label}>
                Summary
              </label>
              <textarea
                id="cs-summary"
                name="summary"
                rows={3}
                maxLength={600}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className={field}
              />
              <p className={help}>One or two sentences. Shown on the card and at the top of the page.</p>
            </div>
          </fieldset>

          <fieldset className="grid gap-5">
            <legend className="mb-4 font-display text-2xl font-semibold">The story</legend>
            {(
              [
                ["challenge", "The challenge", "What was broken, and why it mattered."],
                ["approach", "The approach", "What you did and the decisions behind it. Blank lines start new paragraphs."],
                ["outcome", "The outcome", "What changed after. Real numbers only."],
              ] as const
            ).map(([key, name, hint]) => (
              <div key={key}>
                <label htmlFor={`cs-${key}`} className={label}>
                  {name}
                </label>
                <textarea
                  id={`cs-${key}`}
                  name={key}
                  rows={5}
                  maxLength={4000}
                  defaultValue={initial[key]}
                  className={field}
                />
                <p className={help}>{hint}</p>
              </div>
            ))}
          </fieldset>

          <fieldset>
            <legend className="mb-4 font-display text-2xl font-semibold">Results</legend>
            <div className="grid gap-3">
              {metrics.map((m, i) => (
                <div key={i} className="grid grid-cols-[7rem_1fr_auto] gap-2">
                  <input
                    name="metric_value"
                    aria-label={`Result ${i + 1} number`}
                    placeholder="38%"
                    maxLength={24}
                    value={m.value}
                    onChange={(e) => setMetrics(metrics.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                    className={field}
                  />
                  <input
                    name="metric_label"
                    aria-label={`Result ${i + 1} label`}
                    placeholder="Higher click rate"
                    maxLength={80}
                    value={m.label}
                    onChange={(e) => setMetrics(metrics.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    className={field}
                  />
                  <button
                    type="button"
                    aria-label={`Remove result ${i + 1}`}
                    onClick={() => setMetrics(metrics.filter((_, j) => j !== i))}
                    className="rounded-xl border border-line px-3 text-muted hover:bg-surface hover:text-danger"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {metrics.length < 6 && (
              <button
                type="button"
                onClick={() => setMetrics([...metrics, { value: "", label: "" }])}
                className="btn btn-ghost btn-sm mt-3"
              >
                Add a result
              </button>
            )}
          </fieldset>

          <fieldset className="grid gap-5">
            <legend className="mb-4 font-display text-2xl font-semibold">Images</legend>
            <div>
              <label htmlFor="cs-cover" className={label}>
                Cover image
              </label>
              <input
                id="cs-cover"
                name="cover"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="/emails/email-01.webp"
                className={field}
              />
              <p className={help}>A path in /public, like /emails/email-01.webp, or an https link.</p>
            </div>
            <div>
              <label htmlFor="cs-gallery" className={label}>
                Gallery
              </label>
              <textarea
                id="cs-gallery"
                name="gallery"
                rows={4}
                defaultValue={initial.gallery.join("\n")}
                className={`${field} mono`}
              />
              <p className={help}>One image per line, up to 12. Tall email exports look best.</p>
            </div>
          </fieldset>
        </div>

        {/* Live card preview, sticky on wide screens. */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <p className="mono text-muted">Card preview</p>
          <div className="overflow-clip rounded-2xl border border-line bg-raised">
            <div className="aspect-[4/3] overflow-clip bg-surface">
              {cover ? (
                <img src={cover} alt="" className="h-full w-full object-cover object-top" />
              ) : (
                <p className="grid h-full place-items-center text-muted">No cover yet</p>
              )}
            </div>
            <div className="p-5">
              <p className="mono text-muted">{client || "Client"}</p>
              <p className="mt-2 font-display text-xl font-semibold leading-tight">{title || "Case study title"}</p>
              {summary && <p className="mt-2 line-clamp-3 text-[0.95rem] text-muted">{summary}</p>}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {services
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s) => (
                    <span key={s} className="mono rounded-full border border-line px-2 py-0.5 text-xs">
                      {s}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line p-4">
            <span>
              <span className="block font-medium">Published</span>
              <span className="block text-[0.9rem] text-muted">Off keeps it as a hidden draft.</span>
            </span>
            <input type="checkbox" name="published" defaultChecked={initial.published} className="h-5 w-5 accent-[var(--lime-deep)]" />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-lime" disabled={pending}>
              {pending ? "Saving" : "Save case study"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onDone()}>
              Done
            </button>
          </div>
          <p role="status" className={`min-h-6 font-medium ${state && !state.ok ? "text-danger" : ""}`}>
            {state?.message}
          </p>
        </aside>
      </form>
    </div>
  );
}
