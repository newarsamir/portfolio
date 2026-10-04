import "server-only";
import { cache } from "react";
import { site, type CaseMetric, type CaseStudy } from "@/content/site";
import { getSupabase } from "./supabase";

/** A case study as stored in Supabase. The defaults in site.ts have no id. */
export type CaseStudyRecord = CaseStudy & { id: string | null; sortOrder: number };

export const CASE_COLUMNS =
  "id, slug, title, client, industry, year, services, summary, cover, challenge, approach, outcome, metrics, gallery, published, sort_order";

type Row = {
  id: string;
  slug: string;
  title: string;
  client: string | null;
  industry: string | null;
  year: string | null;
  services: string[] | null;
  summary: string | null;
  cover: string | null;
  challenge: string | null;
  approach: string | null;
  outcome: string | null;
  metrics: unknown;
  gallery: string[] | null;
  published: boolean;
  sort_order: number;
};

function metricsFrom(value: unknown): CaseMetric[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m): m is CaseMetric => Boolean(m) && typeof m.value === "string" && typeof m.label === "string")
    .map((m) => ({ value: m.value, label: m.label }));
}

export function fromRow(r: Row): CaseStudyRecord {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    client: r.client ?? "",
    industry: r.industry ?? "",
    year: r.year ?? "",
    services: r.services ?? [],
    summary: r.summary ?? "",
    cover: r.cover ?? "",
    challenge: r.challenge ?? "",
    approach: r.approach ?? "",
    outcome: r.outcome ?? "",
    metrics: metricsFrom(r.metrics),
    gallery: r.gallery ?? [],
    published: r.published,
    sortOrder: r.sort_order,
  };
}

function defaults(): CaseStudyRecord[] {
  return site.caseStudies.items.map((c, i) => ({ ...c, id: null, sortOrder: i }));
}

/**
 * Every case study, drafts included. Supabase is the source once it is
 * connected and the table exists; otherwise the defaults from site.ts.
 */
export const getAllCaseStudies = cache(
  async (): Promise<{ items: CaseStudyRecord[]; fromDb: boolean; error: string | null }> => {
    const db = getSupabase();
    if (!db) return { items: defaults(), fromDb: false, error: null };
    try {
      const { data, error } = await db
        .from("case_studies")
        .select(CASE_COLUMNS)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error || !data) {
        return {
          items: defaults(),
          fromDb: false,
          error: "Couldn't read the case_studies table. Run supabase/schema.sql again to create it.",
        };
      }
      return { items: (data as Row[]).map(fromRow), fromDb: true, error: null };
    } catch {
      return { items: defaults(), fromDb: false, error: "Couldn't reach Supabase." };
    }
  },
);

/**
 * Published case studies, in display order. An empty table falls back to
 * the samples in site.ts until the first one is added in /admin.
 */
export async function getCaseStudies(): Promise<CaseStudyRecord[]> {
  const { items, fromDb } = await getAllCaseStudies();
  if (fromDb && items.length === 0) return defaults().filter((c) => c.published);
  return items.filter((c) => c.published);
}

export async function getCaseStudy(slug: string): Promise<CaseStudyRecord | null> {
  const items = await getCaseStudies();
  return items.find((c) => c.slug === slug) ?? null;
}
