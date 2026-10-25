"use client";

import { useState, useTransition } from "react";
import { saveVariant } from "@/app/admin/actions";
import { toast } from "@/lib/toast";
import { VARIANTS, type VariantId } from "@/lib/variants";

/** Choose the site's design. Every design can also be previewed at its own address. */
export default function DesignPicker({ current, disabled }: { current: VariantId; disabled: boolean }) {
  const [chosen, setChosen] = useState(current);
  const [busy, start] = useTransition();

  const pick = (id: VariantId) => {
    if (id === chosen || disabled) return;
    const before = chosen;
    setChosen(id);
    start(async () => {
      const res = await saveVariant(id);
      toast.result(res);
      if (!res.ok) setChosen(before);
    });
  };

  return (
    <section aria-labelledby="design-h" className="mb-12">
      <h2 id="design-h" className="font-display text-2xl font-semibold">
        Design
      </h2>
      <p className="mt-1 text-muted">
        Pick the design for the whole site. Content is shared, so switching never loses an edit. Anyone can preview a design at its
        address.
      </p>
      <div role="radiogroup" aria-label="Site design" className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {VARIANTS.map((v) => {
          const on = chosen === v.id;
          return (
            <div key={v.id} className={`flex flex-col rounded-2xl border p-4 transition-colors ${on ? "border-ink bg-surface" : "border-line"}`}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                disabled={disabled || busy}
                onClick={() => pick(v.id)}
                className="flex items-start gap-3 text-left"
              >
                <span
                  className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${on ? "border-ink" : "border-line"}`}
                  aria-hidden="true"
                >
                  {on && <span className="h-2 w-2 rounded-full bg-ink" />}
                </span>
                <span>
                  <span className="block font-medium">{v.label}</span>
                  <span className="mt-1 block text-sm text-muted">{v.blurb}</span>
                </span>
              </button>
              <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-sm">
                <span className="mono text-muted">{v.path ?? "/"}</span>
                {v.path ? (
                  <a href={v.path} target="_blank" rel="noreferrer" className="cms-btn">
                    Preview ↗
                  </a>
                ) : (
                  on && <span className="text-muted">Live at /</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
