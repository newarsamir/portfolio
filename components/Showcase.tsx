"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import Lightbox from "./Lightbox";
import { Reveal, SplitHeading } from "./Reveal";
import ShowcaseCarousel from "./ShowcaseCarousel";

// three.js stays out of the first bundle. It is fetched when the section nears.
const ShowcaseCanvas = dynamic(() => import("./ShowcaseCanvas"), { ssr: false });

type Mode = "carousel" | "3d";

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Showcase() {
  const items = site.showcase.items;
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  // The carousel is also what the server renders, so the work is visible
  // without scripts. Desktop browsers with WebGL upgrade to 3D after mount.
  const [mode, setMode] = useState<Mode>("carousel");
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(
      "(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const decide = () => setMode(mq.matches && supportsWebGL() ? "3d" : "carousel");
    decide();
    mq.addEventListener("change", decide);
    return () => mq.removeEventListener("change", decide);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const load = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          load.disconnect();
        }
      },
      { rootMargin: "120% 0px" },
    );
    const view = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "10% 0px" });
    load.observe(el);
    view.observe(el);
    return () => {
      load.disconnect();
      view.disconnect();
    };
  }, []);

  useGSAP(
    () => {
      if (mode !== "3d") return;
      const st = ScrollTrigger.create({
        trigger: "[data-showcase-pin]",
        start: "top top",
        end: `+=${items.length * 32}%`,
        pin: true,
        scrub: true,
        refreshPriority: 2,
        onUpdate(self) {
          progress.current = self.progress;
          setCurrent(Math.round(self.progress * (items.length - 1)));
        },
      });
      // Created after the triggers further down the page, so put it in order.
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      return () => st.kill();
    },
    { scope: root, dependencies: [mode] },
  );

  const item = items[current];

  return (
    <section ref={root} id="work" aria-labelledby="work-h">
      {mode === "3d" ? (
        <div data-showcase-pin className="relative h-svh min-h-[38rem] overflow-clip">
          <div className="wrap relative z-10 flex items-start justify-between gap-8 pt-[clamp(1.5rem,5svh,3.5rem)]">
            <SplitHeading key="3d" id="work-h" className="display-md">
              {site.showcase.heading}
            </SplitHeading>
            <p className="hidden max-w-[34ch] pt-1 text-muted lg:block">{site.showcase.sub}</p>
          </div>

          <div className="absolute inset-0">
            {near && (
              <ShowcaseCanvas items={items} progress={progress} active={inView && open === null} onOpen={setOpen} />
            )}
          </div>

          {/* Labels stay in HTML, outside the canvas. */}
          <div className="wrap pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-6 pb-[clamp(5.5rem,11svh,7rem)]">
            <div aria-live="off">
              <p className="mono text-muted">
                {String(current + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold">{item.brand}</p>
              <p className="text-muted">{item.type}</p>
            </div>
            <ol className="pointer-events-auto flex gap-1" aria-label="Open an email">
              {items.map((it, i) => (
                <li key={it.src}>
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    aria-label={`Open ${it.brand}, ${it.type}`}
                    aria-current={i === current ? "true" : undefined}
                    className="mono grid h-11 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink aria-[current=true]:bg-lime aria-[current=true]:text-on-lime"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div className="section pb-[clamp(3rem,6vw,5rem)]">
          <div className="wrap">
            <SplitHeading key="carousel" id="work-h" className="display-lg">
              {site.showcase.heading.replace("Scroll to spin them.", "Swipe through them.")}
            </SplitHeading>
            <Reveal className="mt-5 max-w-[46ch] text-lg text-muted">
              <p>{site.showcase.sub}</p>
            </Reveal>
          </div>
          <div className="mt-6">
            <ShowcaseCarousel items={items} onOpen={setOpen} />
          </div>
        </div>
      )}

      <Lightbox items={items} index={open} onClose={() => setOpen(null)} onNavigate={setOpen} />
    </section>
  );
}
