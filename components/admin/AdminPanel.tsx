"use client";

import Link from "next/link";
import { useActionState, useDeferredValue, useMemo, useState, useTransition } from "react";
import { deleteContact, logout, saveSettings, setRead } from "@/app/admin/actions";
import { embedSrc, parseVideo } from "@/lib/video";

export type ContactRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  brand: string | null;
  project_type: string;
  budget: string;
  message: string;
  is_read: boolean;
};

type Settings = {
  heroVideoUrl: string;
  availableForWork: boolean;
  counters: { id: string; label: string; value: number }[];
};

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function AdminPanel({
  siteName,
  contacts,
  loadError,
  dbConnected,
  settings,
  poster,
}: {
  siteName: string;
  contacts: ContactRow[];
  loadError: string | null;
  dbConnected: boolean;
  settings: Settings;
  poster: string;
}) {
  const [tab, setTab] = useState<"contacts" | "settings">("contacts");
  const [rows, setRows] = useState(contacts);
  const unread = rows.filter((r) => !r.is_read).length;

  return (
    <main className="wrap min-h-svh py-8 md:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mono text-muted">{siteName}</p>
          <h1 className="display-md mt-1">Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="btn btn-ghost btn-sm">
            View site
          </Link>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {!dbConnected && (
        <p className="mt-6 rounded-xl border border-line bg-surface p-4">
          Supabase isn&apos;t connected. Add <code className="mono">SUPABASE_URL</code> and{" "}
          <code className="mono">SUPABASE_SERVICE_ROLE_KEY</code> in Vercel, run{" "}
          <code className="mono">supabase/schema.sql</code>, then redeploy. Until then the site uses the defaults from{" "}
          <code className="mono">content/site.ts</code>.
        </p>
      )}

      <div role="tablist" aria-label="Admin sections" className="mt-8 flex gap-1 border-b border-line">
        {(
          [
            ["contacts", `Contacts${unread ? ` (${unread} unread)` : ""}`],
            ["settings", "Settings"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-4 py-3 font-medium ${
              tab === id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-contacts" aria-labelledby="tab-contacts" hidden={tab !== "contacts"} className="pt-6">
        <Contacts rows={rows} setRows={setRows} loadError={loadError} dbConnected={dbConnected} />
      </div>
      <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings" hidden={tab !== "settings"} className="pt-6">
        <SettingsForm settings={settings} poster={poster} disabled={!dbConnected} />
      </div>
    </main>
  );
}

/* ------------------------------ Contacts ------------------------------ */

function Contacts({
  rows,
  setRows,
  loadError,
  dbConnected,
}: {
  rows: ContactRow[];
  setRows: React.Dispatch<React.SetStateAction<ContactRow[]>>;
  loadError: string | null;
  dbConnected: boolean;
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.brand ?? "", r.project_type, r.budget, r.message].some((f) => f.toLowerCase().includes(q)),
    );
  }, [rows, deferred]);

  const toggleRead = (row: ContactRow, next = !row.is_read) => {
    if (row.is_read === next) return;
    setRows((all) => all.map((r) => (r.id === row.id ? { ...r, is_read: next } : r)));
    startTransition(async () => {
      const res = await setRead(row.id, next);
      if (!res.ok) {
        setRows((all) => all.map((r) => (r.id === row.id ? { ...r, is_read: row.is_read } : r)));
        setNotice(res.message);
      }
    });
  };

  const remove = (row: ContactRow) => {
    if (!window.confirm(`Delete the inquiry from ${row.name}? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteContact(row.id);
      if (res.ok) setRows((all) => all.filter((r) => r.id !== row.id));
      setNotice(res.ok ? `Deleted the inquiry from ${row.name}.` : res.message);
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full max-w-sm">
          <span className="sr-only">Search inquiries</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, brand or message"
            className="field min-h-11 py-2"
          />
        </label>
        <div className="flex items-center gap-3">
          <p className="mono text-muted" aria-live="polite">
            {filtered.length} of {rows.length}
          </p>
          {dbConnected && (
            <a href="/admin/export" className="btn btn-ghost btn-sm" download>
              Export CSV
            </a>
          )}
        </div>
      </div>

      <p role="status" className="mt-3 min-h-6 text-[0.95rem] text-muted">
        {loadError ?? notice}
      </p>

      {rows.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-line p-8 text-center text-muted">
          No inquiries yet. When someone sends the contact form, it shows up here.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-line p-8 text-center text-muted">
          Nothing matches &quot;{deferred}&quot;. Try a shorter search.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[46rem] border-collapse text-left text-[0.95rem]">
            <thead className="bg-surface text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Received</th>
                <th scope="col" className="px-4 py-3 font-medium">From</th>
                <th scope="col" className="px-4 py-3 font-medium">Project</th>
                <th scope="col" className="px-4 py-3 font-medium">Budget</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const open = openId === r.id;
                return (
                  <FragmentRow key={r.id}>
                    <tr className={`border-t border-line align-top ${r.is_read ? "" : "font-semibold"}`}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${r.is_read ? "bg-transparent" : "bg-lime ring-1 ring-ink/40"}`}
                            aria-hidden="true"
                          />
                          <time dateTime={r.created_at}>{fmt.format(new Date(r.created_at))}</time>
                        </span>
                        <span className="sr-only">{r.is_read ? "Read" : "Unread"}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.name}
                        <a href={`mailto:${r.email}`} className="link block font-normal text-muted">
                          {r.email}
                        </a>
                        {r.brand && <span className="block font-normal text-muted">{r.brand}</span>}
                      </td>
                      <td className="px-4 py-3">{r.project_type}</td>
                      <td className="whitespace-nowrap px-4 py-3">{r.budget}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5 font-normal">
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => {
                              setOpenId(open ? null : r.id);
                              if (!open) toggleRead(r, true);
                            }}
                            className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface"
                          >
                            {open ? "Hide" : "Read"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleRead(r)}
                            disabled={busy}
                            className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface"
                          >
                            {r.is_read ? "Mark unread" : "Mark read"}
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(r)}
                            disabled={busy}
                            className="rounded-lg border border-line px-3 py-1.5 text-danger hover:bg-surface"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-t border-line bg-surface">
                        <td colSpan={5} className="px-4 py-4">
                          <p className="max-w-[80ch] whitespace-pre-wrap leading-relaxed">{r.message}</p>
                          <a
                            href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: your ${r.project_type.toLowerCase()} inquiry`)}`}
                            className="btn btn-lime btn-sm mt-4"
                          >
                            Reply by email
                          </a>
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/* ------------------------------ Settings ------------------------------ */

function SettingsForm({ settings, poster, disabled }: { settings: Settings; poster: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  const [url, setUrl] = useState(settings.heroVideoUrl);
  const [available, setAvailable] = useState(settings.availableForWork);
  const preview = useDeferredValue(url);
  const parsed = useMemo(() => parseVideo(preview), [preview]);
  const embed = parsed ? embedSrc(parsed)?.replace("autoplay=1", "autoplay=0").replace("controls=0", "controls=1") : null;

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-2">
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="font-display text-2xl font-semibold tracking-tight">Home page video</legend>
        <div>
          <label htmlFor="heroVideoUrl" className="mb-2 block font-medium">
            Video URL
          </label>
          <input
            id="heroVideoUrl"
            name="heroVideoUrl"
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="field"
            aria-describedby="video-help"
            aria-invalid={url && !parsed ? true : undefined}
          />
          <p id="video-help" className="mt-2 text-[0.95rem] text-muted">
            A direct .mp4 link, a YouTube link or a Vimeo link.
            {parsed && (
              <>
                {" "}
                Detected: <strong className="text-ink">{parsed.kind === "file" ? "video file" : parsed.kind}</strong>.
              </>
            )}
          </p>
        </div>
        <div className="aspect-video overflow-clip rounded-xl border border-line bg-surface">
          {parsed?.kind === "file" && (
            <video key={parsed.src} src={parsed.src} poster={poster} controls muted playsInline preload="metadata" className="h-full w-full object-cover" />
          )}
          {embed && <iframe key={embed} src={embed} title="Video preview" allow="fullscreen; picture-in-picture" className="h-full w-full" />}
          {!parsed && (
            <p className="grid h-full place-items-center px-6 text-center text-muted">
              No preview. This link isn&apos;t a video file, YouTube or Vimeo link.
            </p>
          )}
        </div>
      </fieldset>

      <div className="space-y-10">
        <fieldset disabled={disabled}>
          <legend className="font-display text-2xl font-semibold tracking-tight">Availability</legend>
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-6 rounded-xl border border-line p-4">
            <span>
              <span className="block font-medium">Available for work</span>
              <span className="block text-[0.95rem] text-muted">
                The nav badge says &quot;{available ? "Available for work" : "Booked right now"}&quot;.
              </span>
            </span>
            <span className="relative inline-flex shrink-0">
              <input
                type="checkbox"
                name="available"
                role="switch"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
              />
              <span className="h-8 w-14 rounded-full border border-line bg-surface transition-colors peer-checked:border-transparent peer-checked:bg-lime peer-focus-visible:ring-4 peer-focus-visible:ring-ink" />
              <span className="pointer-events-none absolute left-1 top-1 h-6 w-6 rounded-full bg-ink transition-transform peer-checked:translate-x-6 peer-checked:bg-on-lime" />
            </span>
          </label>
        </fieldset>

        <fieldset disabled={disabled}>
          <legend className="font-display text-2xl font-semibold tracking-tight">Counters</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {settings.counters.map((c) => (
              <div key={c.id}>
                <label htmlFor={`counter_${c.id}`} className="mb-2 block font-medium">
                  {c.label}
                </label>
                <input
                  id={`counter_${c.id}`}
                  name={`counter_${c.id}`}
                  type="number"
                  min={0}
                  step={1}
                  required
                  defaultValue={c.value}
                  className="field"
                />
              </div>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-lime" disabled={pending || disabled}>
            {pending ? "Saving settings" : "Save settings"}
          </button>
          <p role="status" className={`font-medium ${state && !state.ok ? "text-danger" : ""}`}>
            {state?.message}
          </p>
        </div>
      </div>
    </form>
  );
}
