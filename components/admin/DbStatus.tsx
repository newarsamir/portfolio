"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type DbStatusData = {
  configured: boolean;
  host: string | null;
  checks: { name: string; ok: boolean; detail: string }[];
};

/** What the site can and can't reach in Supabase, with the fix for each problem. */
export default function DbStatus({ status }: { status: DbStatusData }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const failing = status.checks.filter((c) => !c.ok).length;

  return (
    <section aria-labelledby="db-h" className="rounded-2xl border border-line p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="db-h" className="font-display text-2xl font-semibold">
            Database check
          </h2>
          <p className="mt-1 text-[0.95rem] text-muted">
            {status.configured ? (
              <>
                Connected to <code className="mono text-ink">{status.host}</code>. If that isn&apos;t the project where you
                ran the schema, change <code className="mono">SUPABASE_URL</code> and the key in Vercel, then redeploy.
              </>
            ) : (
              <>
                Not connected. Add <code className="mono">SUPABASE_URL</code> and{" "}
                <code className="mono">SUPABASE_SERVICE_ROLE_KEY</code> in Vercel, then redeploy.
              </>
            )}
          </p>
        </div>
        {status.configured && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => start(() => router.refresh())}>
            {busy ? "Checking" : "Check again"}
          </button>
        )}
      </div>

      {status.checks.length > 0 && (
        <ul className="mt-5 divide-y divide-line rounded-xl border border-line" data-testid="db-checks">
          {status.checks.map((c) => (
            <li key={c.name} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <span className="flex items-center gap-2 font-medium">
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold ${
                    c.ok ? "bg-lime text-on-lime" : "bg-danger text-bg"
                  }`}
                  aria-hidden="true"
                >
                  {c.ok ? "✓" : "!"}
                </span>
                <span className="mono">{c.name}</span>
                <span className="sr-only">{c.ok ? "OK" : "Problem"}</span>
              </span>
              <span className={`text-[0.95rem] ${c.ok ? "text-muted" : ""}`}>{c.detail}</span>
            </li>
          ))}
        </ul>
      )}
      {status.configured && failing === 0 && <p className="mt-4 font-medium">Everything the site needs is in place.</p>}
    </section>
  );
}
