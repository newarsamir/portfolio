"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

/**
 * The name set exactly as wide as the page. Letters rise in when it scrolls
 * into view and lift one by one under the pointer.
 */
export default function Wordmark({ text }: { text: string }) {
  const box = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLParagraphElement>(null);

  // Fit the font size to the container width.
  useLayoutEffect(() => {
    const wrap = box.current;
    const el = ref.current;
    if (!wrap || !el) return;
    const fit = () => {
      el.style.fontSize = "100px";
      const natural = el.scrollWidth;
      if (natural > 0) el.style.fontSize = `${(100 * wrap.clientWidth) / natural}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-letter]", {
          yPercent: 105,
          rotate: 8,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.035,
          scrollTrigger: { trigger: ref.current, start: "top 95%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={box}>
      <p
        ref={ref}
        aria-label={text}
        className="wordmark inline-flex select-none whitespace-nowrap font-display text-[12vw] font-semibold leading-[0.86] tracking-[-0.045em]"
      >
        {Array.from(text).map((c, i) => (
          <span key={i} aria-hidden="true" className="inline-block overflow-clip pb-[0.05em] pt-[0.04em]">
            <span data-letter className="wordmark-c">
              {c === " " ? " " : c}
            </span>
          </span>
        ))}
      </p>
    </div>
  );
}
