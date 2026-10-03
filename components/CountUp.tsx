"use client";

import { useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

/**
 * Counts the number inside a value like "38%", "$12k" or "2.5x" up from
 * zero when it scrolls into view. Values without a number are shown as is.
 */
export default function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const match = value.match(/^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !match) return;
      const [, pre, num, post] = match;
      const end = Number(num.replace(/,/g, ""));
      const decimals = num.includes(".") ? num.split(".")[1].length : 0;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const state = { v: 0 };
        const render = () =>
          (el.textContent = `${pre}${state.v.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}${post}`);
        render();
        gsap.to(state, {
          v: end,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: render,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
        return () => (el.textContent = value);
      });
      return () => mm.revert();
    },
    { dependencies: [value] },
  );

  return <span ref={ref}>{value}</span>;
}
