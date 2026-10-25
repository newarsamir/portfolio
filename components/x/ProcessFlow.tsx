"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { useSite } from "../cms/SiteProvider";

/**
 * The process drawn as an automation flow, the way it would look in Klaviyo:
 * a trigger, three steps with waits in between, and the send at the end.
 * The connectors draw themselves as you scroll down the flow.
 */
export default function ProcessFlow() {
  const { process: p } = useSite();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>("[data-wire]", root.current).forEach((wire) => {
          gsap.fromTo(
            wire,
            { scaleY: 0 },
            { scaleY: 1, ease: "none", scrollTrigger: { trigger: wire, start: "top 80%", end: "bottom 55%", scrub: true } },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-node]", root.current).forEach((node) => {
          gsap.from(node, {
            opacity: 0,
            y: 28,
            scale: 0.97,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: { trigger: node, start: "top 85%", once: true },
          });
        });
      });
    },
    { scope: root, dependencies: [p.steps.length] },
  );

  return (
    <section ref={root} id="process" className="px" aria-labelledby="px-h">
      <div className="wrap px-grid">
        <div className="px-head">
          <p className="x-label">
            {p.label} · {p.steps.length} {p.stepsLabel}
          </p>
          <h2 id="px-h" className="x-display px-h2">
            {p.heading}
          </h2>
        </div>

        <ol className="px-flow">
          <li data-node className="px-pill px-trigger">
            <span className="px-bolt" aria-hidden="true">
              ⚡
            </span>
            {p.trigger}
          </li>
          {p.steps.map((s, i) => (
            <li key={i} className="px-step">
              <span data-wire className="px-wire" aria-hidden="true" />
              <article data-node className="px-node" style={{ ["--side" as string]: i % 2 ? 1 : -1 }}>
                <header className="px-node-head">
                  <span className="px-num mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="px-node-kind mono">{p.nodeKind}</span>
                </header>
                <h3 className="px-node-title">{s.title}</h3>
                <p className="px-node-body">{s.body}</p>
              </article>
              {s.detail && (
                <>
                  <span data-wire className="px-wire" aria-hidden="true" />
                  <p data-node className="px-pill px-wait">
                    <span aria-hidden="true">⏱</span> {s.detail}
                  </p>
                </>
              )}
            </li>
          ))}
          <li className="px-step">
            <span data-wire className="px-wire" aria-hidden="true" />
            <p data-node className="px-pill px-done">
              ✓ {p.done}
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}
