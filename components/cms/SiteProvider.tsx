"use client";

import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import { site as defaults, type Site } from "@/content/site";
import { type Layouts, type PageId, defaultLayouts, SECTIONS } from "@/lib/cms";

type State = {
  content: Site;
  layouts: Layouts;
  /** Bumped per section when the editor sends a draft, so the section remounts cleanly. */
  versions: Record<string, number>;
  /** True inside the admin's preview frame. */
  editing: boolean;
};

const SiteContext = createContext<State>({ content: defaults, layouts: defaultLayouts(), versions: {}, editing: false });

/** The admin preview loads pages as /path?cms=1 inside an iframe. */
export const isEditFrame = () =>
  typeof window !== "undefined" && window.self !== window.top && new URLSearchParams(window.location.search).get("cms") === "1";

/** Sections whose content shows up all over the site remount everything when edited. */
const EVERYWHERE = new Set(["identity", "nav"]);

export function SiteProvider({ content, layouts, children }: { content: Site; layouts: Layouts; children: ReactNode }) {
  const [state, setState] = useState<State>({ content, layouts, versions: {}, editing: false });

  // Fresh data from the server wins, except while the editor is showing a draft.
  useEffect(() => {
    setState((s) => (s.editing ? s : { ...s, content, layouts }));
  }, [content, layouts]);

  useEffect(() => {
    if (!isEditFrame()) return;
    setState((s) => ({ ...s, editing: true }));
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const d = e.data as { source?: string; type?: string; section?: string; patch?: Partial<Site>; page?: PageId | "global"; layout?: Layouts[PageId] };
      if (d?.source !== "cms-admin") return;
      if (d.type === "draft" && d.patch && d.section) {
        const key = EVERYWHERE.has(d.section) ? "*" : d.section;
        setState((s) => ({
          ...s,
          content: { ...s.content, ...d.patch },
          versions: { ...s.versions, [key]: (s.versions[key] ?? 0) + 1 },
        }));
      }
      if (d.type === "layout" && d.page && d.layout) {
        const page = d.page;
        const layout = d.layout;
        setState((s) => ({ ...s, layouts: { ...s.layouts, [page]: layout } }));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <SiteContext.Provider value={state}>{children}</SiteContext.Provider>;
}

/** Everything the site says, with any page-editor changes applied. */
export const useSite = () => useContext(SiteContext).content;
export const useEditing = () => useContext(SiteContext).editing;
export const usePageLayout = (page: PageId | "global") => useContext(SiteContext).layouts[page];

/** Element ids of hidden home sections, so the nav can drop their links. */
export function useHiddenAnchors() {
  const hidden = useContext(SiteContext).layouts.home.hidden;
  return SECTIONS.filter((s) => s.page === "home" && s.anchor && hidden.includes(s.id)).map((s) => s.anchor as string);
}

/**
 * Marks a section for the page editor. Outside the editor it renders the
 * children as they are; inside, it tags them so a click can select the section.
 */
export function Editable({ id, children }: { id: string; children: ReactNode }) {
  const { editing, versions } = useContext(SiteContext);
  if (!editing) return <>{children}</>;
  return (
    <div data-cms={id} style={{ display: "contents" }}>
      <Fragment key={`${versions[id] ?? 0}.${versions["*"] ?? 0}`}>{children}</Fragment>
    </div>
  );
}

/**
 * A page's sections in the saved order, without the hidden ones. The page
 * leaves hidden sections out of `nodes`; the layout check here hides one the
 * moment the page editor switches it off.
 */
export function SectionList({ page, nodes }: { page: PageId; nodes: Record<string, ReactNode> }) {
  const layout = usePageLayout(page);
  return (
    <>
      {layout.order
        .filter((id) => !layout.hidden.includes(id) && nodes[id] !== undefined && nodes[id] !== null)
        .map((id) => (
          <Editable key={id} id={id}>
            {nodes[id]}
          </Editable>
        ))}
    </>
  );
}
