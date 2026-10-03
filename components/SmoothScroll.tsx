"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/** Lenis smooth scroll driven by the GSAP ticker and wired to ScrollTrigger. */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({ lerp: 0.11, anchors: true, autoRaf: false });
    lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);

  // New page: start at the top (or at the hash) and re-measure the triggers.
  useEffect(() => {
    const hash = window.location.hash;
    const id = window.setTimeout(() => {
      ScrollTrigger.refresh();
      if (hash) {
        const el = document.querySelector(hash);
        if (el) {
          if (lenis) lenis.scrollTo(el as HTMLElement, { immediate: true });
          else el.scrollIntoView();
        }
      } else if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }
    }, 60);
    return () => window.clearTimeout(id);
  }, [pathname]);

  // Fonts change text metrics, so re-measure once they are in.
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  return null;
}
