"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { NOT_FOUND_VARIANTS, enabledNotFoundVariants, isNotFoundVariant, type NotFoundVariant } from "@/lib/notfound";
import { useEditing, useSite } from "../cms/SiteProvider";
import NotFoundScene from "../NotFoundScene";
import Vector404 from "./Vector404";

const VIEWS: Record<NotFoundVariant, () => React.ReactNode> = {
  zero: () => <NotFoundScene />,
  pen: () => <Vector404 />,
};

/**
 * Shows the 404 design picked for this visit. The page is static, so the pick
 * happens in the browser: the inline script from notFoundPickScript() chooses
 * one before the first paint, the server HTML holds every design in the
 * rotation, and CSS shows only the chosen one until React drops the rest.
 *
 * `?nf=pen` forces a design, and the page editor gets a switcher so each
 * design's copy can be edited.
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

  const shown = view ? [view] : enabled;

  return (
    <div className="nf-root" data-ssr={view === null || undefined}>
      {shown.map((id) => (
        <div key={id} className="nf-view" data-v={id}>
          {VIEWS[id]()}
        </div>
      ))}
      {editing && (
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
      )}
    </div>
  );
}
