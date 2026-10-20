"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ScrollTrigger } from "@/lib/gsap";
import { sectionById } from "@/lib/cms";
import { isEditFrame } from "./SiteProvider";

type Box = { id: string; top: number; left: number; width: number; height: number } | null;

const post = (msg: Record<string, unknown>) => window.parent.postMessage({ source: "cms-site", ...msg }, window.location.origin);

/** The on-screen area of a section wrapper (which itself has no box). */
function measure(el: Element): DOMRect | null {
  let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
  for (const child of Array.from(el.children)) {
    const r = child.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return top === Infinity ? null : new DOMRect(left, top, right - left, bottom - top);
}

const boxFor = (id: string): Box => {
  const el = document.querySelector(`[data-cms="${CSS.escape(id)}"]`);
  const r = el && measure(el);
  return r ? { id, top: r.top, left: r.left, width: r.width, height: r.height } : null;
};

const sameBox = (a: Box, b: Box) =>
  a === b || (!!a && !!b && a.id === b.id && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

/**
 * Runs only inside the admin's preview frame: outlines sections on hover,
 * turns a click into "edit this section", and scrolls to a section when the
 * editor asks.
 */
export default function EditBridge() {
  const [on, setOn] = useState(false);
  const [hover, setHover] = useState<Box>(null);
  const [picked, setPicked] = useState<Box>(null);
  const hoverId = useRef<string | null>(null);
  const pickedId = useRef<string | null>(null);

  useEffect(() => {
    if (!isEditFrame()) return;
    setOn(true);
    document.documentElement.classList.add("cms-edit");

    const sectionAt = (target: EventTarget | null) =>
      target instanceof Element ? (target.closest("[data-cms]") as HTMLElement | null) : null;

    const onOver = (e: PointerEvent) => {
      hoverId.current = sectionAt(e.target)?.dataset.cms ?? null;
    };
    const onLeave = () => {
      hoverId.current = null;
    };
    const onClick = (e: MouseEvent) => {
      // Nothing navigates or submits in the preview; a click picks a section.
      e.preventDefault();
      e.stopPropagation();
      const id = sectionAt(e.target)?.dataset.cms;
      if (!id) return;
      pickedId.current = id;
      post({ type: "select", id });
    };
    const onSubmit = (e: Event) => e.preventDefault();

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const d = e.data as { source?: string; type?: string; id?: string };
      if (d?.source !== "cms-admin") return;
      if (d.type === "focus" && d.id) {
        pickedId.current = d.id;
        const el = document.querySelector(`[data-cms="${CSS.escape(d.id)}"]`);
        const first = el && Array.from(el.children).find((c) => c.getBoundingClientRect().height > 0);
        if (first) first.scrollIntoView({ behavior: "smooth", block: d.id === "footer" ? "end" : "start" });
      }
      if (d.type === "scale" && typeof (d as { value?: unknown }).value === "number") {
        document.documentElement.style.setProperty("--cms-scale", String(Math.max(0.2, (d as { value: number }).value)));
      }
      if (d.type === "layout" || d.type === "draft") window.setTimeout(() => ScrollTrigger.refresh(), 120);
    };

    // Boxes follow scrolling, sticky sections and animations.
    let raf = 0;
    const loop = () => {
      const h = hoverId.current && hoverId.current !== pickedId.current ? boxFor(hoverId.current) : null;
      const p = pickedId.current ? boxFor(pickedId.current) : null;
      setHover((old) => (sameBox(old, h) ? old : h));
      setPicked((old) => (sameBox(old, p) ? old : p));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    document.addEventListener("pointerover", onOver);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("message", onMessage);

    const ready = window.setTimeout(() => {
      const ids = Array.from(document.querySelectorAll<HTMLElement>("[data-cms]")).map((el) => el.dataset.cms);
      post({ type: "ready", path: window.location.pathname, sections: ids });
    }, 50);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(ready);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("message", onMessage);
      document.documentElement.classList.remove("cms-edit");
    };
  }, []);

  if (!on) return null;
  return createPortal(
    <>
      {hover && <Outline box={hover} kind="hover" />}
      {picked && <Outline box={picked} kind="picked" />}
    </>,
    document.body,
  );
}

function Outline({ box, kind }: { box: NonNullable<Box>; kind: "hover" | "picked" }) {
  const label = sectionById(box.id)?.label ?? box.id;
  // Keep the outline on screen for sections taller than the window.
  const top = Math.max(box.top, 2);
  const bottom = Math.min(box.top + box.height, window.innerHeight - 2);
  return (
    <div
      className={`cms-outline cms-${kind}`}
      style={{ top, left: Math.max(box.left, 2), width: Math.min(box.width, window.innerWidth - 4), height: Math.max(bottom - top, 0) }}
      aria-hidden="true"
    >
      <span className="cms-chip">{kind === "picked" ? `Editing · ${label}` : `Edit ${label}`}</span>
    </div>
  );
}
