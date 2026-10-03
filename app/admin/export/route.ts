import { isAuthed } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Quote a CSV cell, and defuse values a spreadsheet would run as a formula. */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAuthed())) return new Response("Not signed in", { status: 401 });
  const db = getSupabase();
  if (!db) return new Response("Supabase is not connected", { status: 503 });

  const { data, error } = await db
    .from("contacts")
    .select("created_at, name, email, brand, project_type, budget, message, is_read")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return new Response("Export failed", { status: 500 });

  const head = ["Date", "Name", "Email", "Brand", "Project type", "Budget", "Message", "Read"];
  const rows = (data ?? []).map((r) =>
    [r.created_at, r.name, r.email, r.brand, r.project_type, r.budget, r.message, r.is_read ? "yes" : "no"]
      .map(cell)
      .join(","),
  );
  const csv = "﻿" + [head.map(cell).join(","), ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
