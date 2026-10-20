"use client";

import { fill } from "@/lib/cms";
import SectionRule from "../SectionRule";
import { useSite } from "./SiteProvider";

/** Reads a dotted path like "casePage.resultsLabel" from the site content. */
export function useText(path: string, count?: number): string {
  let v: unknown = useSite();
  for (const part of path.split(".")) v = v && typeof v === "object" ? (v as Record<string, unknown>)[part] : undefined;
  const text = typeof v === "string" ? v : "";
  return count === undefined ? text : fill(text, count);
}

/** A piece of editable text, for server-rendered pages. */
export function SiteText({ path, count }: { path: string; count?: number }) {
  return <>{useText(path, count)}</>;
}

/** A section rule whose label and note come from the site content. */
export function SiteRule({ label, note, count }: { label: string; note?: string; count?: number }) {
  const l = useText(label);
  const n = useText(note ?? "", count);
  return <SectionRule label={l} note={note ? n : undefined} />;
}
