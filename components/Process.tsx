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
    <section ref={root} id="process" aria-labelledby="process-h" className="bg-surface">
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
                  <p className="mt-5 inline-block rounded-full border border-line bg-bg px-3.5 py-1.5 text-[0.95rem]">
                    {step.detail}
                  </p>
                </div>
                <div
                  data-visual
                  className="relative h-[27rem] overflow-clip rounded-[1.5rem] border border-line bg-bg min-[900px]:col-span-7 min-[900px]:h-full"
                  aria-hidden="true"
                >
                  {i === 0 && <BriefVisual />}
                  {i === 1 && <MiniEmail mode="wire" />}
                  {i === 2 && <MiniEmail mode="design" />}
                  {i === 3 && <HandoffVisual />}
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

function MiniEmail({ mode }: { mode: "wire" | "design" }) {
  const wire = mode === "wire";
  const box = wire ? "border border-dashed border-muted/70 bg-surface" : "";
  return (
    <div className="relative grid h-full place-items-center px-5 py-11">
      <div
        className={`relative flex h-full max-h-[26rem] w-[15.5rem] flex-col gap-2.5 rounded-xl border p-3.5 ${
          wire ? "border-line bg-raised" : "border-line bg-raised shadow-[0_24px_50px_-28px_rgb(0_0_0/0.5)]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`h-3 w-14 rounded ${wire ? "bg-line" : "bg-ink"}`} />
          <span className="flex gap-1">
            <span className="h-1.5 w-5 rounded bg-line" />
            <span className="h-1.5 w-5 rounded bg-line" />
          </span>
        </div>
        <div
          className={`relative grid flex-[1.5] place-items-center overflow-clip rounded-lg ${
            wire ? box : "bg-lime text-on-lime"
          }`}
        >
          {wire ? (
            <svg className="absolute inset-0 h-full w-full text-muted/50" preserveAspectRatio="none" viewBox="0 0 10 10">
              <path d="M0 0 10 10M10 0 0 10" stroke="currentColor" strokeWidth="0.12" vectorEffect="non-scaling-stroke" />
            </svg>
          ) : (
            <span className="px-3 text-center font-display text-[1.35rem] font-semibold leading-[1.02] tracking-tight">
              Hello, nice to meet you
            </span>
          )}
        </div>
        <div className="space-y-1.5 px-1">
          <span className={`block h-2 w-full rounded ${wire ? "bg-line" : "bg-ink/70"}`} />
          <span className={`block h-2 w-4/5 rounded ${wire ? "bg-line" : "bg-ink/35"}`} />
        </div>
        <span
          className={`mx-auto grid h-8 w-32 place-items-center rounded-full text-[0.7rem] font-semibold ${
            wire ? box + " text-muted" : "bg-ink text-bg"
          }`}
        >
          {wire ? "button" : "Shop the bestsellers"}
        </span>
        <div className="grid flex-1 grid-cols-2 gap-2.5">
          <span className={`rounded-lg ${wire ? box : "bg-surface"}`} />
          <span className={`rounded-lg ${wire ? box : "bg-ink/15"}`} />
        </div>

        {!wire && (
          <>
            {/* Figma-style selection */}
            <span className="pointer-events-none absolute -inset-1.5 rounded-[0.9rem] border-[1.5px] border-accent-fg" />
            <span className="mono absolute -top-7 left-0 text-[0.7rem] text-accent-fg">Welcome 01 / Mobile</span>
            <span className="absolute -bottom-9 -right-14 flex items-start gap-1">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-ink">
                <path d="M2 2l4.5 11 1.6-4.4L12.5 7 2 2Z" fill="currentColor" />
              </svg>
              <span className="mt-2.5 rounded-md bg-lime px-2 py-0.5 text-[0.7rem] font-semibold text-on-lime">Samir</span>
            </span>
          </>
        )}
      </div>
      {wire && <span className="mono absolute bottom-4 left-5 text-muted">wireframe, no colors yet</span>}
    </div>
  );
}

function HandoffVisual() {
  const layers = ["Header / Logo", "Hero / Headline", "Hero / Image", "Body / Intro copy", "CTA / Primary button", "Products / Grid 2-up", "Footer / Legal"];
  const chips = ["hero@2x.jpg", "600px desktop", "375px mobile", "Dark mode checked", "Alt text written"];
  return (
    <div className="grid h-full gap-4 p-5 sm:grid-cols-[1.1fr_1fr] sm:p-7">
      <div className="rounded-xl border border-line bg-raised p-4">
        <p className="mono text-muted">Layers</p>
        <ul className="mt-3 space-y-1">
          {layers.map((l, i) => (
            <li
              key={l}
              className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[0.9rem] ${i === 4 ? "bg-lime text-on-lime" : ""}`}
            >
              <span className={`h-2.5 w-2.5 rounded-[3px] border ${i === 4 ? "border-on-lime" : "border-muted"}`} />
              {l}
            </li>
          ))}
        </ul>
      </div>
      <div className="hidden flex-col justify-between sm:flex">
        <ul className="flex flex-wrap content-start gap-2">
          {chips.map((c) => (
            <li key={c} className="mono rounded-full border border-line bg-raised px-3 py-1.5">
              {c}
            </li>
          ))}
        </ul>
        <p className="mono text-muted">No layer is called &quot;Rectangle 247&quot;.</p>
      </div>
    </div>
  );
}
