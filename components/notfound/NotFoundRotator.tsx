"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { NOT_FOUND_VARIANTS, enabledNotFoundVariants, isNotFoundVariant, type NotFoundVariant } from "@/lib/notfound";
import { useEditing, useSite } from "../cms/SiteProvider";
import NotFoundScene from "../NotFoundScene";
import Bounce404 from "./Bounce404";
import PenTool404 from "./PenTool404";
import Prefs404 from "./Prefs404";
import Report404 from "./Report404";

const VIEWS: Record<NotFoundVariant, () => React.ReactNode> = {
  zero: () => <NotFoundScene />,
  bounce: () => <Bounce404 />,
  pen: () => <PenTool404 />,
  prefs: () => <Prefs404 />,
  report: () => <Report404 />,
};

/**
 * Shows the 404 design picked for this visit. The page is static, so the pick
 * happens in the browser: the inline script from notFoundPickScript() chooses
 * one before the first paint, the server HTML holds every design in the
 * rotation, and CSS shows only the chosen one until React drops the rest.
 *
 * `?nf=pen` forces a design, the button in the corner steps through the rest,
 * and the page editor gets a switcher so every design's copy can be edited.
 */
export default function NotFoundRotator() {
  const copy = useSite().notFound;
  const editing = useEditing();
  const enabled = enabledNotFoundVariants(copy.rotation);
  const [view, setView] = useState<NotFoundVariant | null>(null);

  // Take over the pick the inline script made, before paint. When Next renders
  // the 404 in the browser (notFound() on a case study) the script never ran,
  // so pick here. The page editor remounts this on every edit, and
  // <html data-nf> keeps the design it was showing.
  useLayoutEffect(() => {
    const picked = document.documentElement.dataset.nf;
    setView(isNotFoundVariant(picked) ? picked : enabled[Math.floor(Math.random() * enabled.length)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view) document.documentElement.dataset.nf = view;
  }, [view]);

  const next = () => setView((v) => enabled[(enabled.indexOf(v ?? enabled[0]) + 1) % enabled.length]);
  const shown = view ? [view] : enabled;

  return (
    <div className="nf-root" data-ssr={view === null || undefined}>
      {shown.map((id) => (
        <div key={id} className="nf-view" data-v={id}>
          {VIEWS[id]()}
        </div>
      ))}
      {editing ? (
        <div className="nf-switch" role="group" aria-label="404 design" data-cms-ui>
          {NOT_FOUND_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              data-off={!enabled.includes(v.id) || undefined}
              title={enabled.includes(v.id) ? v.label : `${v.label} (not in the rotation)`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      ) : (
        view &&
        enabled.length > 1 &&
        copy.shuffle.trim() !== "" && (
          <button type="button" className="nf-shuffle" onClick={next}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
            {copy.shuffle}
            <span className="nf-shuffle-count mono">
              {enabled.indexOf(view) + 1 || 1}/{enabled.length}
            </span>
          </button>
        )
      )}
    </div>
  );
}
