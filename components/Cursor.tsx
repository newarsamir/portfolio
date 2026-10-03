"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Desktop-only follower. Grows over links and buttons, and shows "View"
 * over anything marked data-cursor="view" (the showcase cards).
 * The 3D canvas sets the state through a "cursor:state" window event.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" });
    let forced: string | null = null;

    const move = (e: PointerEvent) => {
      el.dataset.on = "true";
      x(e.clientX);
      y(e.clientY);
      if (forced) return;
      const t = e.target as Element | null;
      const marked = t?.closest?.("[data-cursor]") as HTMLElement | null;
      if (marked) el.dataset.state = marked.dataset.cursor;
      else if (t?.closest?.("a, button, summary, [role='button'], label, select")) el.dataset.state = "link";
      else el.dataset.state = "";
    };
    const leave = () => (el.dataset.on = "false");
    const force = (e: Event) => {
      forced = (e as CustomEvent<string | null>).detail;
      el.dataset.state = forced ?? "";
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("cursor:state", force);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("cursor:state", force);
    };
  }, []);

  return (
    <div ref={ref} className="cursor" aria-hidden="true" data-on="false">
      <div className="cursor-dot">
        <span>View</span>
      </div>
    </div>
  );
}

export function setCursor(state: string | null) {
  window.dispatchEvent(new CustomEvent("cursor:state", { detail: state }));
}
