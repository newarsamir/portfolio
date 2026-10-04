import "server-only";
import { getSupabase } from "./supabase";

export type CheckResult = { name: string; ok: boolean; detail: string };
export type DbStatus = {
  configured: boolean;
  /** The Supabase project the site talks to, e.g. "abcd1234.supabase.co". */
  host: string | null;
  checks: CheckResult[];
};

const TABLES = ["contacts", "settings", "showcase_items", "case_studies", "login_attempts"];

export function supabaseHost(): string | null {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host : null;
  } catch {
    return null;
  }
}

/** Turns a Supabase error into a sentence that says what to do about it. */
export function explainDbError(err: { code?: string; message?: string } | null, table: string): string {
  const host = supabaseHost() ?? "your Supabase project";
  const code = err?.code ?? "";
  const msg = err?.message ?? "";
  if (code === "PGRST205" || code === "42P01" || /does not exist|schema cache/i.test(msg)) {
    return `The ${table} table isn't in the Supabase project this site is connected to (${host}). Open that project's SQL editor and run supabase/schema.sql. If you already did, check that SUPABASE_URL in Vercel points to the same project, then redeploy.`;
  }
  if (code === "42501" || /permission denied/i.test(msg)) {
    return `The site isn't allowed to read ${table}. SUPABASE_SERVICE_ROLE_KEY in Vercel must be the secret (service_role) key, not the anon or publishable key.`;
  }
  if (/invalid api key|jwt|unauthorized/i.test(msg) || code === "PGRST301") {
    return `Supabase rejected the key. Copy the secret (service_role) key for ${host} into SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy.`;
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(msg)) {
    return `Couldn't reach ${host}. Check SUPABASE_URL in Vercel and that the project isn't paused.`;
  }
  return `Couldn't read ${table}${msg ? `: ${msg}` : "."}`;
}

/** Checks every table and the storage bucket, for the admin's database panel. */
export async function checkDatabase(): Promise<DbStatus> {
  const db = getSupabase();
  const host = supabaseHost();
  if (!db) return { configured: false, host, checks: [] };

  const checks = await Promise.all(
    TABLES.map(async (name): Promise<CheckResult> => {
      try {
        // A real (not HEAD) read: HEAD requests don't report a missing table.
        const { error, count } = await db.from(name).select("*", { count: "exact" }).limit(1);
        if (error) return { name, ok: false, detail: explainDbError(error, name) };
        return { name, ok: true, detail: `${count ?? 0} row${count === 1 ? "" : "s"}` };
      } catch (e) {
        return { name, ok: false, detail: explainDbError({ message: String(e) }, name) };
      }
    }),
  );

  try {
    const { data, error } = await db.storage.getBucket("showcase");
    checks.push(
      error || !data
        ? {
            name: "showcase bucket",
            ok: false,
            detail: `The 'showcase' storage bucket is missing in ${host}. Run supabase/schema.sql there, or create a public bucket named showcase under Storage.`,
          }
        : { name: "showcase bucket", ok: true, detail: data.public ? "Public" : "Exists, but isn't public: turn on Public in Storage" },
    );
  } catch (e) {
    checks.push({ name: "showcase bucket", ok: false, detail: explainDbError({ message: String(e) }, "storage") });
  }

  return { configured: true, host, checks };
}
