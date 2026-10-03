import type { Metadata } from "next";
import Link from "next/link";
import AdminPanel, { type ContactRow } from "@/components/admin/AdminPanel";
import LoginForm from "@/components/admin/LoginForm";
import { site } from "@/content/site";
import { isAdminConfigured, isAuthed } from "@/lib/auth";
import { getAllCaseStudies } from "@/lib/case-studies";
import { getSettings } from "@/lib/settings";
import { getSupabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAuthed();

  if (!authed) {
    return (
      <main className="wrap grid min-h-svh place-items-center py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="mono text-muted hover:text-ink">
            Back to the site
          </Link>
          <h1 className="display-md mt-4">Admin</h1>
          <p className="mt-3 text-muted">Sign in to read inquiries and change site settings.</p>
          <LoginForm configured={isAdminConfigured()} />
        </div>
      </main>
    );
  }

  const db = getSupabase();
  let contacts: ContactRow[] = [];
  let loadError: string | null = null;

  if (db) {
    const { data, error } = await db
      .from("contacts")
      .select("id, created_at, name, email, brand, project_type, budget, message, is_read")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) loadError = "Couldn't load inquiries. Check that supabase/schema.sql has been run.";
    else contacts = (data ?? []) as ContactRow[];
  }
  const settings = await getSettings();
  const cases = await getAllCaseStudies();

  return (
    <AdminPanel
      siteName={site.name}
      contacts={contacts}
      loadError={loadError}
      dbConnected={Boolean(db)}
      settings={{
        heroVideoUrl: settings.heroVideoUrl,
        availableForWork: settings.availableForWork,
        counters: settings.counters.map((c) => ({ id: c.id, label: c.label, value: c.value })),
      }}
      poster={site.defaults.heroPoster}
      caseStudies={{
        items: cases.items.map(({ sortOrder: _sortOrder, ...c }) => c),
        fromDb: cases.fromDb,
        error: cases.error,
      }}
    />
  );
}
