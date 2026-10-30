"use client";

import Link from "next/link";
import { startTransition, useActionState, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteContact, logout, saveSettings, setRead } from "@/app/admin/actions";
import { createVideoUpload } from "@/app/admin/showcase-actions";
import { putToSignedUrl } from "@/lib/admin-upload";
import { MAX_VIDEO, VIDEO_TYPES } from "@/lib/media";
import type { Site } from "@/content/site";
import type { AdminView, Layouts } from "@/lib/cms";
import { sectionById } from "@/lib/cms";
import { embedSrc, parseVideo } from "@/lib/video";
import { toast } from "@/lib/toast";
import CaseStudiesAdmin, { type AdminCaseStudy } from "./CaseStudiesAdmin";
import Dashboard from "./Dashboard";
import ShowcaseAdmin, { type AdminShowcaseItem } from "./ShowcaseAdmin";
import DbStatus, { type DbStatusData } from "./DbStatus";
import GalleryAdmin, { type AdminGalleryItem } from "./GalleryAdmin";
import LinksAdmin, { type AdminLink } from "./LinksAdmin";
import ImageInput from "./ImageInput";
import PageEditor from "./PageEditor";
import DesignPicker from "./DesignPicker";
import { VARIANTS, type VariantId } from "@/lib/variants";

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
  heroPoster: string;
  storyPhoto: string;
  availableForWork: boolean;
  variant: VariantId;
};

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const VIEWS: { id: AdminView; label: string; title: string; help: string }[] = [
  { id: "dashboard", label: "Dashboard", title: "Dashboard", help: "" },
  { id: "pages", label: "Pages", title: "Pages", help: "" },
  { id: "inbox", label: "Inbox", title: "Inbox", help: "Inquiries from the contact form." },
  { id: "showcase", label: "Showcase", title: "Selected emails", help: "The emails in the 3D carousel on the home page." },
  { id: "cases", label: "Case studies", title: "Case studies", help: "Shown on the home page and at /work." },
  { id: "gallery", label: "AI gallery", title: "AI photography", help: "The two-row gallery at the bottom of the home page." },
  { id: "files", label: "Files & links", title: "Files & links", help: "Short links on your own address that open a file or send people to any URL." },
  { id: "settings", label: "Settings", title: "Settings", help: "The site's design, the hero video and whether you're taking projects." },
  { id: "database", label: "Database", title: "Database", help: "Checks that every table and the storage bucket are set up." },
];

export default function AdminPanel({
  siteName,
  contacts,
  loadError,
  dbConnected,
  settings,
  caseStudies,
  showcase,
  dbStatus,
  gallery,
  content,
  layouts,
  caseSlug,
  links,
  siteUrl,
}: {
  links: { items: AdminLink[]; fromDb: boolean; error: string | null };
  siteUrl: string;
  dbStatus: DbStatusData;
  gallery: { items: AdminGalleryItem[]; fromDb: boolean; error: string | null };
  siteName: string;
  contacts: ContactRow[];
  loadError: string | null;
  dbConnected: boolean;
  settings: Settings;
  caseStudies: { items: AdminCaseStudy[]; fromDb: boolean; error: string | null };
  showcase: {
    items: AdminShowcaseItem[];
    fromDb: boolean;
    error: string | null;
    placeholderSrcs: string[];
  };
  content: Site;
  layouts: Layouts;
  caseSlug: string | null;
}) {
  const [view, setView] = useState<AdminView>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [rows, setRows] = useState(contacts);
  const [editorOpened, setEditorOpened] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const [editRequest, setEditRequest] = useState<{ id: string; n: number } | null>(null);
  const unread = rows.filter((r) => !r.is_read).length;

  const go = useCallback((v: AdminView) => {
    setView(v);
    setMenuOpen(false);
    if (v === "pages") setEditorOpened(true);
    window.history.replaceState(null, "", v === "dashboard" ? window.location.pathname : `#${v}`);
    window.scrollTo({ top: 0 });
  }, []);

  // Open the view named in the address (#pages, #inbox...).
  useEffect(() => {
    const fromHash = window.location.hash.slice(1) as AdminView;
    if (VIEWS.some((v) => v.id === fromHash)) go(fromHash);
  }, [go]);

  const editSection = (id: string) => {
    if (!sectionById(id)) return;
    setEditRequest((r) => ({ id, n: (r?.n ?? 0) + 1 }));
    go("pages");
  };

  const badge: Partial<Record<AdminView, string>> = {
    inbox: unread ? String(unread) : "",
    showcase: String(showcase.items.length),
    cases: String(caseStudies.items.length),
    gallery: String(gallery.items.length),
    files: String(links.items.length),
    database: dbConnected && dbStatus.checks.every((c) => c.ok) ? "" : "!",
    pages: editorDirty ? "•" : "",
  };
  const current = VIEWS.find((v) => v.id === view)!;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime font-display text-lg font-bold text-on-lime">
          {siteName.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-lg font-semibold leading-tight">{siteName}</span>
          <span className="mono block text-muted">Admin</span>
        </span>
      </div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {VIEWS.map((v) => (
            <li key={v.id}>
              <button type="button" data-view={v.id} onClick={() => go(v.id)} aria-current={view === v.id ? "page" : undefined} className="admin-nav-item">
                <NavIcon id={v.id} />
                <span className="flex-1 text-left">{v.label}</span>
                {badge[v.id] && (
                  <span
                    className={`mono rounded-full px-1.5 py-0.5 text-[0.68rem] ${
                      v.id === "inbox" || v.id === "pages" ? "bg-lime text-on-lime" : v.id === "database" ? "bg-danger text-bg" : "opacity-60"
                    }`}
                  >
                    {badge[v.id]}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-1 border-t border-line p-3">
        <Link href="/" target="_blank" className="admin-nav-item">
          <NavIcon id="site" />
          <span className="flex-1">View site ↗</span>
        </Link>
        <form action={logout}>
          <button type="submit" className="admin-nav-item">
            <NavIcon id="logout" />
            <span className="flex-1 text-left">Sign out</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-svh bg-bg lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      {/* Sidebar: fixed on desktop, a drawer on small screens. */}
      <aside className="sticky top-0 hidden h-svh border-r border-line bg-surface lg:block">{sidebar}</aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-bg px-4 py-3 lg:hidden">
        <span className="font-display text-lg font-semibold">{current.title}</span>
        <button type="button" className="cms-btn" aria-expanded={menuOpen} aria-controls="admin-drawer" onClick={() => setMenuOpen(true)}>
          Menu{unread ? ` · ${unread}` : ""}
        </button>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
          <aside id="admin-drawer" className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0">
        {editorOpened && (
          <div hidden={view !== "pages"} className="lg:h-svh">
            <div className="flex flex-col lg:h-full">
              <header className="hidden items-center justify-between gap-4 border-b border-line px-5 py-3 lg:flex">
                <div>
                  <h1 className="font-display text-xl font-semibold">Pages</h1>
                  <p className="text-sm text-muted">Click a section in the preview to edit it. Changes show instantly; save to publish.</p>
                </div>
              </header>
              <PageEditor
                content={content}
                layouts={layouts}
                caseSlug={caseSlug}
                dbConnected={dbConnected}
                onNavigate={go}
                onDirtyChange={setEditorDirty}
                request={editRequest}
              />
            </div>
          </div>
        )}

        {view !== "pages" && (
          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {view !== "dashboard" && (
              <header className="mb-8">
                <h1 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-tight">{current.title}</h1>
                {current.help && <p className="mt-1 text-muted">{current.help}</p>}
              </header>
            )}

            {view === "dashboard" && (
              <Dashboard
                rows={rows}
                counts={{ showcase: showcase.items.length, cases: caseStudies.items.length, gallery: gallery.items.length }}
                layouts={layouts}
                available={settings.availableForWork}
                design={VARIANTS.find((v) => v.id === settings.variant)?.label ?? "Classic"}
                dbConnected={dbConnected}
                dbStatus={dbStatus}
                onNavigate={go}
                onEditSection={editSection}
              />
            )}
            <div hidden={view !== "inbox"} data-panel="inbox">
              <Contacts rows={rows} setRows={setRows} loadError={loadError} dbConnected={dbConnected} />
            </div>
            <div hidden={view !== "showcase"} data-panel="showcase">
              <ShowcaseAdmin
                items={showcase.items}
                fromDb={showcase.fromDb}
                dbConnected={dbConnected}
                loadError={showcase.error}
                placeholderSrcs={showcase.placeholderSrcs}
                onEditText={() => editSection("showcase")}
              />
            </div>
            <div hidden={view !== "gallery"} data-panel="gallery">
              <GalleryAdmin items={gallery.items} fromDb={gallery.fromDb} dbConnected={dbConnected} loadError={gallery.error} />
              <EditTextHint onClick={() => editSection("gallery")} what="the gallery heading and intro" />
            </div>
            <div hidden={view !== "files"} data-panel="files">
              <LinksAdmin items={links.items} fromDb={links.fromDb} dbConnected={dbConnected} loadError={links.error} siteUrl={siteUrl} />
            </div>
            <div hidden={view !== "cases"} data-panel="cases">
              <CaseStudiesAdmin
                items={caseStudies.items}
                fromDb={caseStudies.fromDb}
                dbConnected={dbConnected}
                loadError={caseStudies.error}
              />
              <EditTextHint onClick={() => editSection("cases")} what="the section heading and intro" />
            </div>
            <div hidden={view !== "settings"} data-panel="settings">
              <DesignPicker current={settings.variant} disabled={!dbConnected} />
              <SettingsForm settings={settings} disabled={!dbConnected} />
            </div>
            <div hidden={view !== "database"} data-panel="database">
              {!dbConnected && (
                <p className="mb-6 rounded-xl border border-line bg-surface p-4">
                  Supabase isn&apos;t connected. Add <code className="mono">SUPABASE_URL</code> and{" "}
                  <code className="mono">SUPABASE_SERVICE_ROLE_KEY</code> in Vercel, run{" "}
                  <code className="mono">supabase/schema.sql</code>, then redeploy. Until then the site uses the defaults from{" "}
                  <code className="mono">content/site.ts</code>.
                </p>
              )}
              <DbStatus status={dbStatus} />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

function EditTextHint({ onClick, what }: { onClick: () => void; what: string }) {
  return (
    <p className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-muted">
      Want to change {what}?
      <button type="button" className="cms-btn" onClick={onClick}>
        Edit in Pages →
      </button>
    </p>
  );
}

function NavIcon({ id }: { id: AdminView | "site" | "logout" }) {
  const paths: Record<string, React.ReactNode> = {
    dashboard: <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />,
    pages: <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 9h16M9 9v11" />,
    inbox: <path d="M4 13l2.5-8h11L20 13v6H4zM4 13h5l1 2h4l1-2h5" />,
    showcase: <path d="M7 4h10v16H7zM3 6v12M21 6v12" />,
    cases: <path d="M4 7h16v12H4zM9 7V5h6v2M4 12h16" />,
    gallery: <path d="M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01" />,
    files: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
    settings: <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 8.5 4 8l-1 3 2 1v0l-2 1 1 3 2-.5L7.5 17l-.5 2 3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3z" />,
    database: <path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />,
    site: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
    logout: <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10" />,
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {paths[id]}
    </svg>
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
        toast.error(res.message);
      }
    });
  };

  const remove = (row: ContactRow) => {
    if (!window.confirm(`Delete the inquiry from ${row.name}? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteContact(row.id);
      if (res.ok) setRows((all) => all.filter((r) => r.id !== row.id));
      if (res.ok) toast.success(`Deleted the inquiry from ${row.name}.`);
      else toast.error(res.message);
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
        {loadError}
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

function SettingsForm({ settings, disabled }: { settings: Settings; disabled: boolean }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  useEffect(() => {
    if (state) toast.result(state);
  }, [state]);
  const [mode, setMode] = useState<"story" | "video">(settings.heroVideoUrl === "story" ? "story" : "video");
  const [url, setUrl] = useState(settings.heroVideoUrl === "story" ? "" : settings.heroVideoUrl);
  const [available, setAvailable] = useState(settings.availableForWork);
  const [poster, setPoster] = useState(settings.heroPoster);
  const [storyPhoto, setStoryPhoto] = useState(settings.storyPhoto);
  const videoFile = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  // Videos go straight to storage through a signed link, so they can be up to 50 MB.
  const uploadVideo = async (f: File | undefined) => {
    if (!f) return;
    if (!VIDEO_TYPES[f.type]) return void toast.error("Use an MP4 or WebM video.", "That file won't work");
    if (f.size > MAX_VIDEO) return void toast.error(`It's ${(f.size / 1024 / 1024).toFixed(1)} MB. Keep videos under 50 MB.`, "That video is too big");
    setProgress(0);
    try {
      const start = await createVideoUpload(f.type, f.size, "hero");
      if (!start.ok || !start.signedUrl || !start.publicUrl) throw new Error(start.message);
      await putToSignedUrl(start.signedUrl, f, setProgress);
      setUrl(start.publicUrl);
      toast.success("Video uploaded. Save settings to put it on the home page.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The video didn't upload.", "Upload failed");
    } finally {
      setProgress(null);
    }
  };
  const preview = useDeferredValue(url);
  const parsed = useMemo(() => parseVideo(preview), [preview]);
  const embed = parsed ? embedSrc(parsed)?.replace("autoplay=1", "autoplay=0").replace("controls=0", "controls=1") : null;

  return (
    <form
      // Submitted by hand: a form action would reset the fields after saving, putting radios and
      // uncontrolled inputs back to their first values while the editor still shows the new ones.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid gap-10 lg:grid-cols-2"
    >
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="font-display text-2xl font-semibold">Home page video</legend>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="What plays in the hero">
          {(
            [
              ["story", "Animated story", "Built in, narrated, with Tap for sound"],
              ["video", "My own video", "An .mp4, YouTube or Vimeo link"],
            ] as const
          ).map(([value, title, help]) => (
            <label
              key={value}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${mode === value ? "border-ink bg-surface" : "border-line"}`}
            >
              <input
                type="radio"
                name="heroMode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="mt-1 h-4 w-4 accent-[var(--lime-deep)]"
              />
              <span>
                <span className="block font-medium">{title}</span>
                <span className="block text-[0.9rem] text-muted">{help}</span>
              </span>
            </label>
          ))}
        </div>
        {/* Both images are always sent, so switching modes never clears the other one. */}
        <input type="hidden" name="heroPoster" value={poster} />
        <input type="hidden" name="storyPhoto" value={storyPhoto} />
        {mode === "story" ? (
          <div className="space-y-3">
            <p className="rounded-xl border border-line bg-surface p-4 text-[0.95rem] text-muted">
              The hero plays the narrated story about email design and revenue. Its words and voice are built in; its photo is yours to change.
            </p>
            <label htmlFor="storyPhoto" className="block font-medium">
              Story photo
            </label>
            <ImageInput
              id="storyPhoto"
              value={storyPhoto}
              onChange={setStoryPhoto}
              folder="hero"
              disabled={disabled}
              help="The founder in the story, also cropped for the product shot. Portrait (4:5) works best. Remove it to use the built-in photo."
            />
          </div>
        ) : (
        <>
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
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-ghost btn-sm" disabled={disabled || progress !== null} onClick={() => videoFile.current?.click()}>
              {progress === null ? "Upload a video" : `Uploading… ${progress}%`}
            </button>
            <span className="text-[0.9rem] text-muted">MP4 or WebM, up to 50 MB.</span>
            <input
              ref={videoFile}
              type="file"
              accept={Object.keys(VIDEO_TYPES).join(",")}
              className="hidden"
              tabIndex={-1}
              onChange={(e) => {
                uploadVideo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          {progress !== null && (
            <div className="mt-2 h-1.5 overflow-clip rounded-full bg-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Video upload">
              <div className="h-full origin-left bg-lime-deep transition-transform" style={{ transform: `scaleX(${progress / 100})` }} />
            </div>
          )}
          <p id="video-help" className="mt-2 text-[0.95rem] text-muted">
            Upload a video, or paste a direct .mp4 link, a YouTube link or a Vimeo link.
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
        <div>
          <label htmlFor="heroPoster" className="mb-2 block font-medium">
            Poster image
          </label>
          <ImageInput
            id="heroPoster"
            value={poster}
            onChange={setPoster}
            folder="hero"
            aspect="aspect-video"
            disabled={disabled}
            help="The still shown before the video plays (YouTube links use YouTube's own thumbnail). Remove it to use the built-in one."
          />
        </div>
        </>
        )}
      </fieldset>

      <div className="space-y-10">
        <fieldset disabled={disabled}>
          <legend className="font-display text-2xl font-semibold">Availability</legend>
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
