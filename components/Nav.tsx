"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { site } from "@/content/site";
import AnchorLink, { scrollToId } from "./AnchorLink";
import LocalTime from "./LocalTime";
import Magnetic from "./Magnetic";
import { RollText } from "./RollText";
import {
  AboutIcon,
  ArrowUpIcon,
  CasesIcon,
  ContactIcon,
  HireIcon,
  ProcessIcon,
  WorkIcon,
} from "./icons";

const ICONS: Record<string, ReactNode> = {
  work: <WorkIcon />,
  cases: <CasesIcon />,
  about: <AboutIcon />,
  process: <ProcessIcon />,
  contact: <ContactIcon />,
};

// "Home" lives in the progress ring at the start of the dock.
const DOCK_NAV = site.nav.filter((n) => n.id !== "home");
const CITY = site.location.split(",")[0];

const DOCK_AT = 120;
const BASE = 44; // px, also the minimum touch target
const MAX_SCALE = 1.55;
const REACH = 130; // px of pointer influence

/** Replays the little hop an app icon makes when it is clicked. */
function bounce(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.dataset.bounce = "false";
  void el.offsetWidth;
  el.dataset.bounce = "true";
}

export default function Nav({ available }: { available: boolean }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [docked, setDocked] = useState(false);
  const [active, setActive] = useState<string>(onHome ? "home" : "");
  const dockRef = useRef<HTMLDivElement>(null);
  const puckRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const activeRef = useRef(active);

  // Morph trigger, active section and the scroll progress ring.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      setDocked(window.scrollY > DOCK_AT);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ringRef.current?.style.setProperty("--p", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
      if (!onHome) {
        setActive(pathname.startsWith("/work") ? "cases" : pathname.startsWith("/contact") ? "contact" : "");
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

  // The puck slides under whichever icon is active.
  useLayoutEffect(() => {
    activeRef.current = active;
    const dock = dockRef.current;
    const puck = puckRef.current;
    if (!dock || !puck) return;
    const target = dock.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!target || target.offsetParent === null) {
      puck.style.opacity = "0";
      return;
    }
    puck.style.opacity = "";
    puck.style.transform = `translate3d(${target.offsetLeft}px,0,0)`;
  }, [active, docked]);

  // macOS-style magnification. Transforms only: each icon scales from its
  // bottom edge and its neighbors slide apart to make room.
  useEffect(() => {
    const dock = dockRef.current;
    const puck = puckRef.current;
    if (!dock || !puck) return;
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
        const transform = `translate3d(${shift.toFixed(2)}px,0,0) scale(${scales[i].toFixed(3)})`;
        el.style.transform = transform;
        // The puck rides along with the active icon.
        if (el.dataset.id === activeRef.current) {
          puck.style.transform = `translate3d(${(el.offsetLeft + shift).toFixed(2)}px,0,0) scale(${scales[i].toFixed(3)})`;
        }
      });
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const enter = () => {
      measure();
      items.forEach((el) => (el.style.transition = "transform 0.12s ease-out"));
      puck.style.transition = "transform 0.12s ease-out, opacity 0.3s";
    };
    const move = (e: PointerEvent) => {
      pointerX = e.clientX;
      queue();
    };
    const leave = () => {
      pointerX = null;
      items.forEach((el) => (el.style.transition = "transform 0.35s cubic-bezier(0.22,1,0.36,1)"));
      puck.style.transition = "";
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

  const toTop = (e: MouseEvent<HTMLAnchorElement>) => {
    bounce(e);
    if (!onHome || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    scrollToId("home");
  };

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
            <AnchorLink to="home" className="truncate font-display text-xl font-semibold">
              {site.name}
            </AnchorLink>
            <span className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-xs sm:max-lg:inline-flex xl:inline-flex">
              <span
                className={`h-2 w-2 rounded-full ${available ? "pulse-dot bg-lime ring-1 ring-ink/40" : "bg-muted"}`}
                aria-hidden="true"
              />
              {available ? "Available for work" : "Booked right now"}
            </span>
          </div>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {site.nav.map((item) => {
                const current = active === item.id;
                const link = "rounded-full px-3.5 py-2 text-[0.95rem] text-muted transition-colors hover:text-ink aria-[current=true]:text-ink";
                return (
                  <li key={item.id}>
                    {item.id === "cases" ? (
                      <Link href="/work" aria-current={current ? "true" : undefined} className={link}>
                        <RollText text={item.label} />
                      </Link>
                    ) : (
                      <AnchorLink to={item.id} aria-current={current ? "true" : undefined} className={link}>
                        <RollText text={item.label} />
                      </AnchorLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <Magnetic>
            <Link href="/contact" className="btn btn-lime btn-sm">
              <RollText text="Hire me" />
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
          data-docked={docked}
          className="dock pointer-events-auto flex items-end gap-1 rounded-[1.4rem] p-1.5 transition-[transform,opacity] duration-[650ms] ease-spring sm:gap-1.5 sm:p-2"
          style={{
            transform: docked ? "none" : "translateY(140%) scale(0.7)",
            opacity: docked ? 1 : 0,
          }}
        >
          <span ref={puckRef} className="dock-puck" aria-hidden="true" />

          {/* Back to top, with a ring that fills as you scroll. */}
          <Link
            href="/"
            onClick={toTop}
            onAnimationEnd={(e) => (e.currentTarget.dataset.bounce = "false")}
            data-dock-item
            data-id="home"
            aria-label={onHome ? "Back to top" : "Home"}
            className="dock-item relative grid h-11 w-11 origin-bottom place-items-center rounded-[0.9rem] text-ink hover:bg-ink/10"
          >
            <span className="dock-pop relative grid place-items-center" style={{ ["--i" as string]: 0 }}>
              <svg ref={ringRef} viewBox="0 0 36 36" className="dock-ring absolute h-9 w-9" aria-hidden="true">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--accent-fg)" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              <ArrowUpIcon width={16} height={16} />
            </span>
            <span className="dock-tip" aria-hidden="true">
              {onHome ? "Back to top" : "Home"}
            </span>
          </Link>

          <span data-dock-item data-fixed="true" className="mx-0.5 mb-1.5 h-8 w-px bg-ink/15" aria-hidden="true" />

          {DOCK_NAV.map((item, i) => {
            const cls = `dock-item group relative h-11 w-11 origin-bottom place-items-center rounded-[0.9rem] text-ink hover:bg-ink/10 ${
              item.id === "contact" ? "hidden sm:grid" : "grid"
            }`;
            const inner = (
              <>
                <span className="dock-pop grid place-items-center" style={{ ["--i" as string]: i + 1 }}>
                  {ICONS[item.id]}
                </span>
                <span className="dock-tip" aria-hidden="true">
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-[3px] h-1 w-1 rounded-full bg-accent-fg transition-[opacity,scale] duration-300 ${
                    active === item.id ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                />
              </>
            );
            const common = {
              "data-dock-item": true,
              "data-id": item.id,
              "aria-label": item.label,
              "aria-current": active === item.id ? ("true" as const) : undefined,
              className: cls,
              onAnimationEnd: (e: React.AnimationEvent<HTMLAnchorElement>) => (e.currentTarget.dataset.bounce = "false"),
            };
            return item.id === "cases" ? (
              <Link key={item.id} href="/work" onClick={bounce} {...common}>
                {inner}
              </Link>
            ) : (
              <AnchorLink key={item.id} to={item.id} onClick={bounce} {...common}>
                {inner}
              </AnchorLink>
            );
          })}

          <span data-dock-item data-fixed="true" className="mx-0.5 mb-1.5 h-8 w-px bg-ink/15" aria-hidden="true" />

          {/* Local time, wide screens only. */}
          <span
            data-dock-item
            data-fixed="true"
            className="dock-pop mono hidden h-11 items-center gap-2 whitespace-nowrap rounded-[0.9rem] px-3 text-xs text-muted lg:flex"
            style={{ ["--i" as string]: DOCK_NAV.length + 1 }}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${available ? "pulse-dot bg-lime ring-1 ring-ink/40" : "bg-muted"}`}
              aria-hidden="true"
            />
            <span>
              {CITY} <LocalTime className="text-ink" />
            </span>
          </span>

          <Link
            href="/contact"
            data-dock-item
            data-fixed="true"
            aria-label="Hire me"
            onClick={bounce}
            onAnimationEnd={(e) => (e.currentTarget.dataset.bounce = "false")}
            className="dock-item dock-hire relative flex h-11 min-w-11 origin-bottom items-center justify-center gap-2 rounded-[0.9rem] bg-lime px-0 font-medium text-on-lime sm:px-4"
          >
            <span className="dock-pop grid place-items-center" style={{ ["--i" as string]: DOCK_NAV.length + 2 }}>
              <HireIcon width={20} height={20} />
            </span>
            <span className="dock-pop hidden text-[0.95rem] sm:inline" style={{ ["--i" as string]: DOCK_NAV.length + 2 }}>
              Hire me
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
