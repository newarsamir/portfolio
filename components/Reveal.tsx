"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, useGSAP, MOTION_OK } from "@/lib/gsap";

/** Heading that rises line by line out of a mask when scrolled into view. */
export function SplitHeading({
  as: Tag = "h2",
  children,
  className,
  id,
}: {
  as?: "h2" | "h3";
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 1,
              ease: "power4.out",
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            });
          },
        });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  // The tag varies but the props used here are shared by all of them.
  const Comp = Tag as "h2";
  return (
    <Comp ref={ref as RefObject<HTMLHeadingElement>} className={className} id={id}>
      {children}
    </Comp>
  );
}

type Variant = "fade" | "stagger" | "slide" | "scale";

/**
 * Scroll reveal with a few different treatments so sections do not all
 * arrive the same way. "stagger" animates the direct children one by one.
 */
export function Reveal({
  children,
  className,
  variant = "fade",
  as: Tag = "div",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  as?: "div" | "ul" | "ol" | "figure";
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const st = { trigger: el, start: "top 86%", once: true };
        if (variant === "stagger") {
          gsap.from(el.children, {
            y: 28,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.08,
            delay,
            scrollTrigger: st,
          });
        } else if (variant === "slide") {
          gsap.from(el, { x: -40, autoAlpha: 0, duration: 0.9, ease: "power3.out", delay, scrollTrigger: st });
        } else if (variant === "scale") {
          gsap.from(el, {
            scale: 0.94,
            autoAlpha: 0,
            duration: 0.9,
            ease: "power3.out",
            delay,
            scrollTrigger: st,
          });
        } else {
          gsap.from(el, { y: 24, autoAlpha: 0, duration: 0.9, ease: "power3.out", delay, scrollTrigger: st });
        }
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const Comp = Tag as "div";
  return (
    <Comp ref={ref as RefObject<HTMLDivElement>} className={className}>
      {children}
    </Comp>
  );
}

/** A cover panel that slides away to unmask whatever is underneath. */
export function MaskReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const cover = el.querySelector<HTMLElement>("[data-cover]");
      const inner = el.querySelector<HTMLElement>("[data-inner]");
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.set(cover, { display: "block" });
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%", once: true } });
        tl.to(cover, { scaleY: 0, duration: 1.1, ease: "power4.inOut" }).from(
          inner,
          { scale: 1.18, duration: 1.4, ease: "power3.out" },
          0,
        );
        // Gentle parallax after the reveal.
        gsap.to(inner, {
          yPercent: -6,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={`relative overflow-clip ${className ?? ""}`}>
      <div data-inner className="h-full w-full">
        {children}
      </div>
      <div data-cover className="absolute inset-0 hidden origin-top bg-lime" aria-hidden="true" />
    </div>
  );
}
