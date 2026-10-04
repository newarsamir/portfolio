"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

/**
 * Moves its content against the scroll while it crosses the viewport.
 * `y` is the total travel in percent of its own height (positive drifts up),
 * `rotate` an optional tilt in degrees from -rotate to +rotate.
 * `trigger` measures the scroll against an ancestor instead, for content
 * that is pinned or sticky.
 */
export default function Parallax({
  children,
  y = 12,
  rotate = 0,
  trigger,
  className,
}: {
  children: ReactNode;
  y?: number;
  rotate?: number;
  trigger?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          el,
          { yPercent: y / 2, rotate: -rotate },
          {
            yPercent: -y / 2,
            rotate,
            ease: "none",
            scrollTrigger: {
              trigger: trigger ? el.closest(trigger) ?? el : el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [y, rotate, trigger] },
  );

  return (
    <div ref={ref} className={`will-change-transform ${className ?? ""}`}>
      {children}
    </div>
  );
}
