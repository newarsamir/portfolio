"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { site } from "@/content/site";
import AnchorLink from "./AnchorLink";
import Magnetic from "./Magnetic";
import { AboutIcon, ContactIcon, HireIcon, HomeIcon, ProcessIcon, WorkIcon } from "./icons";

const ICONS: Record<string, ReactNode> = {
  home: <HomeIcon />,
  work: <WorkIcon />,
  about: <AboutIcon />,
  process: <ProcessIcon />,
  contact: <ContactIcon />,
};

const DOCK_AT = 120;
const BASE = 44; // px, also the minimum touch target
const MAX_SCALE = 1.55;
const REACH = 130; // px of pointer influence

export default function Nav({ available }: { available: boolean }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [docked, setDocked] = useState(false);
  const [active, setActive] = useState<string>(onHome ? "home" : "contact");
  const dockRef = useRef<HTMLDivElement>(null);

  // Morph trigger + active section tracking.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      setDocked(window.scrollY > DOCK_AT);
      if (!onHome) {
        setActive(pathname.startsWith("/contact") ? "contact" : "");
        return;
      }
      const mid = window.innerHeight * 0.5;
      let current = "home";
      for (const item of site.nav) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= mid) current = item.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onHome, pathname]);

  // macOS-style magnification. Transforms only: each icon scales from its
  // bottom edge and its neighbors slide apart to make room.
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(dock.querySelectorAll<HTMLElement>("[data-dock-item]"));
    let centers: number[] = [];
    let raf = 0;
    let pointerX: number | null = null;

    const measure = () => {
      items.forEach((el) => (el.style.transform = ""));
      centers = items.map((el) => {
        const r = el.getBoundingClientRect();
        return r.left + r.width / 2;
      });
    };

    const apply = () => {
      raf = 0;
      const scales = items.map((_, i) => {
        if (pointerX === null || items[i].dataset.fixed) return 1;
        const d = Math.abs(pointerX - centers[i]);
        const t = Math.max(0, 1 - d / REACH);
        // Cosine falloff gives the soft "wave" of the real dock.
        return 1 + (MAX_SCALE - 1) * (0.5 - 0.5 * Math.cos(Math.PI * t));
      });
      const extra = scales.map((s) => (s - 1) * BASE);
      const total = extra.reduce((a, b) => a + b, 0);
      let before = 0;
      items.forEach((el, i) => {
        const shift = before + extra[i] / 2 - total / 2;
        before += extra[i];
        el.style.transform = `translate3d(${shift.toFixed(2)}px,0,0) scale(${scales[i].toFixed(3)})`;
      });
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const enter = () => {
      measure();
      items.forEach((el) => (el.style.transition = "transform 0.12s ease-out"));
    };
    const move = (e: PointerEvent) => {
      pointerX = e.clientX;
      queue();
    };
    const leave = () => {
      pointerX = null;
      items.forEach((el) => (el.style.transition = "transform 0.35s cubic-bezier(0.22,1,0.36,1)"));
      queue();
    };

    dock.addEventListener("pointerenter", enter);
    dock.addEventListener("pointermove", move);
    dock.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      dock.removeEventListener("pointerenter", enter);
      dock.removeEventListener("pointermove", move);
      dock.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable fixed left-4 top-4 z-[70] rounded-full bg-ink px-4 py-2 text-bg"
      >
        Skip to content
      </a>

      {/* Top bar: solid, full width, no glass. */}
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg transition-[transform,opacity] duration-500 ease-out"
        style={{
          transform: docked ? "translateY(-110%)" : "none",
          opacity: docked ? 0 : 1,
        }}
        inert={docked}
      >
        <div
          className="wrap flex h-16 items-center justify-between gap-4 transition-transform duration-500 ease-out"
          style={{ transform: docked ? "scaleX(0.5)" : "none" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <AnchorLink to="home" className="truncate font-display text-xl font-semibold tracking-tight">
              {site.name}
            </AnchorLink>
            <span className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-xs sm:max-md:inline-flex lg:inline-flex">
              <span
                className={`h-2 w-2 rounded-full ${available ? "bg-lime ring-1 ring-ink/40" : "bg-muted"}`}
                aria-hidden="true"
              />
              {available ? "Available for work" : "Booked right now"}
            </span>
          </div>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {site.nav.map((item) => (
                <li key={item.id}>
                  <AnchorLink
                    to={item.id}
                    aria-current={active === item.id ? "true" : undefined}
                    className="rounded-full px-3.5 py-2 text-[0.95rem] text-muted transition-colors hover:text-ink aria-[current=true]:text-ink"
                  >
                    {item.label}
                  </AnchorLink>
                </li>
              ))}
            </ul>
          </nav>

          <Magnetic>
            <Link href="/contact" className="btn btn-lime btn-sm">
              Hire me
            </Link>
          </Magnetic>
        </div>
      </header>

      {/* Dock: the one glass element. */}
      <nav
        aria-label="Dock"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.9rem,env(safe-area-inset-bottom))]"
        inert={!docked}
      >
        <div
          ref={dockRef}
          className="dock pointer-events-auto flex items-end gap-1 rounded-[1.4rem] p-1.5 transition-[transform,opacity] duration-[650ms] ease-spring sm:gap-1.5 sm:p-2"
          style={{
            transform: docked ? "none" : "translateY(140%) scale(0.7)",
            opacity: docked ? 1 : 0,
          }}
        >
          {site.nav.map((item) => (
            <AnchorLink
              key={item.id}
              to={item.id}
              data-dock-item
              aria-label={item.label}
              aria-current={active === item.id ? "true" : undefined}
              className="dock-item group relative grid h-11 w-11 origin-bottom place-items-center rounded-[0.9rem] text-ink hover:bg-ink/10"
            >
              {ICONS[item.id]}
              <span className="dock-tip" aria-hidden="true">
                {item.label}
              </span>
              <span
                aria-hidden="true"
                className={`absolute -bottom-[3px] h-1 w-1 rounded-full bg-accent-fg transition-opacity ${
                  active === item.id ? "opacity-100" : "opacity-0"
                }`}
              />
            </AnchorLink>
          ))}
          <span data-dock-item data-fixed="true" className="mx-0.5 mb-1.5 h-8 w-px bg-ink/15" aria-hidden="true" />
          <Link
            href="/contact"
            data-dock-item
            aria-label="Hire me"
            className="dock-item relative grid h-11 w-11 origin-bottom place-items-center rounded-[0.9rem] bg-lime text-on-lime"
          >
            <HireIcon />
            <span className="dock-tip" aria-hidden="true">
              Hire me
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
