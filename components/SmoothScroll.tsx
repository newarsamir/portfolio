"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { isEditFrame } from "./cms/SiteProvider";

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/** Lenis smooth scroll driven by the GSAP ticker and wired to ScrollTrigger. */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // The admin preview scrolls natively so it can jump to a section. Touch screens
    // scroll smoothly on their own; Lenis there only costs a scroll read every frame.
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)").matches || isEditFrame()) return;

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

  // New page: start at the top (or at the hash) and re-measure the triggers,
  // once the fonts are in (they change text metrics). One full re-measure
  // instead of two: each one costs a few hundred milliseconds on a phone.
  useEffect(() => {
    const hash = window.location.hash;
    let live = true;
    const id = window.setTimeout(() => {
      (document.fonts?.ready ?? Promise.resolve()).then(() => {
        if (!live) return;
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
      });
    }, 60);
    return () => {
      live = false;
      window.clearTimeout(id);
    };
  }, [pathname]);

  return null;
}
