import { site } from "@/content/site";

/** Slow marquee of the tools from /content/site.ts. Pauses on hover. */
export default function BrandStrip() {
  const items = site.brandStrip.items;
  // Repeat enough to fill wide screens, then duplicate once for the loop.
  const row = Array.from({ length: 4 }, () => items).flat();

  const Row = ({ hidden }: { hidden?: boolean }) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {row.map((name, i) => (
        <li key={i} className="flex items-center">
          <span className="font-display text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold tracking-tight [font-variation-settings:'wdth'_84]">
            {name}
          </span>
          <span className="mx-[clamp(1.25rem,3vw,2.75rem)] h-3 w-3 rotate-45 rounded-[3px] bg-lime ring-1 ring-ink/25" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={site.brandStrip.label} className="border-y border-line py-7">
      <p className="mono wrap mb-5 text-muted">{site.brandStrip.label}</p>
      <div className="marquee overflow-clip">
        <div className="marquee-track">
          {/* Screen readers get the short list once. */}
          <ul className="sr-only">
            {items.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <Row hidden />
          <Row hidden />
        </div>
      </div>
    </section>
  );
}
