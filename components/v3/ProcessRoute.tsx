"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { useSite } from "../cms/SiteProvider";

/** Three stops on a dashed route; a little envelope travels along it as you scroll. */
export default function ProcessRoute() {
  const { process: p } = useSite();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const route = () => root.current!.querySelector<HTMLElement>("[data-route]")!;
      const scrub = (start: string, end: string) => ({ trigger: "[data-route]", start, end, scrub: 0.6, invalidateOnRefresh: true });
      mm.add(`${MOTION_OK} and (min-width: 900px)`, () => {
        gsap.fromTo("[data-envelope]", { x: 0 }, { x: () => route().offsetWidth, ease: "none", scrollTrigger: scrub("top 80%", "top 25%") });
        gsap.fromTo("[data-route-fill]", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: scrub("top 80%", "top 25%") });
      });
      mm.add(`${MOTION_OK} and (max-width: 899px)`, () => {
        gsap.fromTo("[data-envelope]", { y: 0 }, { y: () => route().offsetHeight, ease: "none", scrollTrigger: scrub("top 70%", "bottom 50%") });
        gsap.fromTo("[data-route-fill]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: scrub("top 70%", "bottom 50%") });
      });
    },
    { scope: root, dependencies: [p.steps.length] },
  );

  return (
    <section ref={root} id="process" className="pr" aria-labelledby="pr-h">
      <div className="wrap">
        <p className="v3-label">{p.label}</p>
        <h2 id="pr-h" className="v3-h2">
          {p.heading}
        </h2>

        <div className="pr-route" data-route>
          <span className="pr-line" aria-hidden="true">
            <span className="pr-line-fill" data-route-fill />
          </span>
          <span className="pr-envelope" data-envelope aria-hidden="true">
            <svg width="30" height="22" viewBox="0 0 30 22" fill="none">
              <rect x="1" y="1" width="28" height="20" rx="3" fill="var(--lime)" stroke="var(--ink)" strokeWidth="1.5" />
              <path d="M2 3l13 9 13-9" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </span>
          <ol className="pr-stops">
            {p.steps.map((s, i) => (
              <li key={i} className="pr-stop">
                <span className="pr-dot" aria-hidden="true" />
                <p className="pr-num">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="pr-title">{s.title}</h3>
                <p className="pr-body">{s.body}</p>
                {s.detail && <p className="pr-detail mono">{s.detail}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
