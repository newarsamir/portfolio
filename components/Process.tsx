"use client";

import { useRef } from "react";
import { site } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { SplitHeading } from "./Reveal";

const PINNED = "(min-width: 900px) and (prefers-reduced-motion: no-preference)";

export default function Process() {
  const root = useRef<HTMLElement>(null);
  const steps = site.process.steps;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(PINNED, () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-step]", root.current);
        const bars = gsap.utils.toArray<HTMLElement>("[data-bar]", root.current);
        gsap.set(items.slice(1), { autoAlpha: 0 });
        gsap.set(bars, { scaleX: 0, transformOrigin: "left" });

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: "[data-process-pin]",
            start: "top top",
            end: `+=${(items.length - 1) * 85}%`,
            pin: true,
            scrub: 0.6,
            refreshPriority: 1,
          },
        });

        tl.to(bars[0], { scaleX: 1, duration: 0.3, ease: "none" }, 0);
        items.forEach((item, i) => {
          if (i === 0) return;
          const prev = items[i - 1];
          const at = i - 0.72;
          tl.to(prev.querySelector("[data-text]"), { autoAlpha: 0, y: -50, duration: 0.4 }, at)
            .to(prev.querySelector("[data-visual]"), { autoAlpha: 0, scale: 0.94, duration: 0.4 }, at)
            .set(prev, { autoAlpha: 0 }, at + 0.4)
            .set(item, { autoAlpha: 1 }, at + 0.4)
            .from(item.querySelector("[data-text]"), { autoAlpha: 0, y: 60, duration: 0.45 }, at + 0.4)
            .from(
              item.querySelector("[data-visual]"),
              { autoAlpha: 0, y: 90, rotate: 2.5, duration: 0.5 },
              at + 0.4,
            )
            .to(bars[i], { scaleX: 1, duration: 0.45, ease: "none" }, at + 0.4);
        });
        tl.to({}, { duration: 0.25 });
      });

      // Unpinned layouts get a simple staggered arrival instead.
      mm.add("(max-width: 899px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-step]", root.current).forEach((item) => {
          gsap.from(item.children, {
            y: 36,
            autoAlpha: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 82%", once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="process" aria-labelledby="process-h" className="gridlines bg-surface">
      <div data-process-pin className="process-pin py-24 min-[900px]:py-0">
        <div className="wrap w-full">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SplitHeading id="process-h" className="display-md">
              {site.process.heading}
            </SplitHeading>
            <div className="hidden w-64 gap-1.5 min-[900px]:motion-safe:flex" aria-hidden="true">
              {steps.map((s) => (
                <span key={s.title} className="h-1 flex-1 overflow-clip rounded-full bg-line">
                  <span data-bar className="block h-full w-full bg-ink" />
                </span>
              ))}
            </div>
          </div>

          <ol className="process-stage mt-12 min-[900px]:mt-14">
            {steps.map((step, i) => (
              <li key={step.title} data-step className="process-step grid items-center gap-8 min-[900px]:grid-cols-12 min-[900px]:gap-12">
                <div data-text className="min-[900px]:col-span-5">
                  <p className="mono text-muted">
                    Step {i + 1} of {steps.length}
                  </p>
                  <h3 className="mt-3 text-[clamp(2.5rem,5.5vw,5rem)]">{step.title}</h3>
                  <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-muted md:text-xl">{step.body}</p>
                  <p className="mono mt-6 flex items-center gap-3 text-ink">
                    <span className="h-px w-8 bg-ink" aria-hidden="true" />
                    {step.detail}
                  </p>
                </div>
                <div
                  data-visual
                  className="relative h-[27rem] overflow-clip rounded-2xl border border-line bg-bg min-[900px]:col-span-7 min-[900px]:h-full"
                  aria-hidden="true"
                >
                  {i === 0 && <BriefVisual />}
                  {i === 1 && (
                    <div className="grid h-full grid-cols-2">
                      <MiniEmail label="Light mode" />
                      <div className="bg-[oklch(19%_0.01_80)]">
                        <MiniEmail dark label="Dark mode" />
                      </div>
                    </div>
                  )}
                  {i === 2 && <HandoffVisual />}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- Step visuals. Decorative, drawn with plain elements. ---------- */

function BriefVisual() {
  const rows = [
    ["Goal", "Turn first-time buyers into second-time buyers"],
    ["Audience", "New subscribers, mostly on mobile"],
    ["Offer", "10% off the first order"],
    ["Tone", "Friendly. Zero exclamation marks."],
  ];
  return (
    <div className="grid h-full place-items-center p-4 sm:p-6">
      <div className="w-full max-w-md -rotate-1 rounded-2xl border border-line bg-raised p-5 text-[0.95rem] shadow-[0_24px_50px_-28px_rgb(0_0_0/0.45)]">
        <p className="mono text-muted">brief.doc</p>
        <dl className="mt-4 space-y-3.5">
          {rows.map(([k, v], i) => (
            <div key={k} className="grid grid-cols-[4.75rem_1fr] gap-3 border-t border-line pt-3.5">
              <dt className="mono pt-0.5 text-muted">{k}</dt>
              <dd className="leading-snug">{i === 2 ? <span className="hl">{v}</span> : v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function MiniEmail({ dark = false, label }: { dark?: boolean; label: string }) {
  // The dark variant is drawn with fixed colors so it looks the same in both site themes.
  const c = dark
    ? { card: "border-white/15 bg-[oklch(24%_0.012_80)]", ink: "bg-[oklch(95%_0.02_95)]", soft: "bg-white/25", tile: "bg-white/10", btn: "bg-[oklch(95%_0.02_95)] text-[oklch(19%_0.01_80)]", label: "text-[oklch(78%_0.02_90)]" }
    : { card: "border-line bg-raised", ink: "bg-ink", soft: "bg-ink/30", tile: "bg-surface", btn: "bg-ink text-bg", label: "text-muted" };
  return (
    <div className="relative grid h-full place-items-center px-4 py-11">
      <div
        className={`relative flex h-full max-h-[24rem] w-full max-w-[14.5rem] flex-col gap-2.5 rounded-xl border p-3.5 ${c.card} shadow-[0_24px_50px_-28px_rgb(0_0_0/0.5)]`}
      >
        <div className="flex items-center justify-between">
          <span className={`h-3 w-14 rounded-sm ${c.ink}`} />
          <span className="flex gap-1">
            <span className={`h-1.5 w-5 rounded-sm ${c.soft}`} />
            <span className={`h-1.5 w-5 rounded-sm ${c.soft}`} />
          </span>
        </div>
        <div className="relative grid flex-[1.5] place-items-center overflow-clip rounded-lg bg-lime text-on-lime">
          <span className="px-3 text-center font-display text-xl font-semibold leading-[1.08]">Your cart misses you</span>
        </div>
        <div className="space-y-1.5 px-1">
          <span className={`block h-2 w-full rounded-sm opacity-70 ${c.ink}`} />
          <span className={`block h-2 w-4/5 rounded-sm ${c.soft}`} />
        </div>
        <span className={`mx-auto grid h-8 w-32 max-w-full place-items-center rounded-full text-xs font-medium ${c.btn}`}>
          Finish checkout
        </span>
        <div className="grid flex-1 grid-cols-2 gap-2.5">
          <span className={`rounded-lg ${c.tile}`} />
          <span className={`rounded-lg ${c.tile}`} />
        </div>
      </div>
      <span className={`mono absolute bottom-3.5 left-4 ${c.label}`}>{label}</span>
    </div>
  );
}

function HandoffVisual() {
  const checks = [
    "600px wide, one column on mobile",
    "Images exported at 2x and compressed",
    "Alt text written for every image",
    "Headline and button in live text",
    "Dark mode checked",
    "Links and tracking notes listed",
  ];
  return (
    <div className="grid h-full place-items-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-raised p-5 shadow-[0_24px_50px_-28px_rgb(0_0_0/0.45)] sm:p-6">
        <div className="flex items-baseline justify-between">
          <p className="mono text-muted">Pre-send checklist</p>
          <p className="mono text-muted">
            {checks.length} / {checks.length}
          </p>
        </div>
        <ul className="mt-4">
          {checks.map((c) => (
            <li key={c} className="flex items-center gap-3 border-t border-line py-3 text-[0.9375rem]">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime text-on-lime">
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2.5 6.5 2.3 2.3L9.5 3.7" />
                </svg>
              </span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
