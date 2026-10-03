"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "@/lib/gsap";

/**
 * Huge words drifting sideways. Scrolling speeds them up, flips their
 * direction to match and leans them into the motion.
 */
export default function VelocityMarquee({ words, label }: { words: readonly string[]; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = track.current!;
        let x = 0;
        let dir = -1;
        let boost = 0;
        const skew = gsap.quickTo(el, "skewX", { duration: 0.4, ease: "power3" });
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate(self) {
            const v = self.getVelocity();
            dir = self.direction === 1 ? -1 : 1;
            boost = Math.min(Math.abs(v) / 120, 14);
            skew(gsap.utils.clamp(-12, 12, v / -300));
          },
        });
        const tick = () => {
          if (!st.isActive) return;
          const half = el.scrollWidth / 2;
          x += dir * (0.6 + boost);
          boost *= 0.92;
          if (x <= -half) x += half;
          if (x > 0) x -= half;
          gsap.set(el, { x });
          if (Math.abs(boost) < 0.05) skew(0);
        };
        gsap.ticker.add(tick);
        return () => {
          gsap.ticker.remove(tick);
          st.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {[...words, ...words].map((w, i) => (
        <li key={i} className="flex items-center">
          <span
            className={`font-display text-[clamp(3.5rem,10vw,9.5rem)] font-semibold leading-none tracking-[-0.02em] ${
              i % 2 ? "outline-text" : ""
            }`}
          >
            {w}
          </span>
          <svg
            viewBox="0 0 24 24"
            className="mx-[clamp(1.5rem,4vw,3.5rem)] h-[clamp(2rem,4vw,3.5rem)] w-[clamp(2rem,4vw,3.5rem)] shrink-0 text-lime"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              stroke="var(--ink)"
              strokeWidth="0.6"
              d="M12 1.5c.6 5.2 3.3 7.9 8.5 8.5v4c-5.2.6-7.9 3.3-8.5 8.5h-.1c-.6-5.2-3.3-7.9-8.4-8.5v-4c5.1-.6 7.8-3.3 8.4-8.5Z"
            />
          </svg>
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={root} className="overflow-clip py-6" role="img" aria-label={label}>
      <div ref={track} className="flex w-max will-change-transform">
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}
