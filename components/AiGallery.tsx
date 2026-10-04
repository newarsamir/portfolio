"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { site } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "@/lib/gsap";
import { Reveal, SplitHeading } from "./Reveal";
import { ArrowSwap, RollText } from "./RollText";
import SectionRule from "./SectionRule";
import { getLenis } from "./SmoothScroll";
import { ChevronIcon, CloseIcon } from "./icons";

export type GalleryTile = {
  id: string;
  src: string;
  width: number;
  height: number;
  kind: "product" | "lifestyle";
  caption: string;
  prompt: string;
};

/* Shown until real images are added in /admin. Drawn with CSS, clearly labeled. */
const PLACEHOLDERS: (Omit<GalleryTile, "src"> & { look: string })[] = [
  { id: "ph1", width: 4, height: 5, kind: "product", caption: "Serum on stone, morning light", prompt: "Glass dropper bottle on travertine, soft window light, beige palette, 50mm", look: "bottle-cream" },
  { id: "ph2", width: 1, height: 1, kind: "lifestyle", caption: "Bathroom shelf routine", prompt: "Lifestyle shelf scene, linen towel, plants, natural light, calm mood", look: "shelf" },
  { id: "ph3", width: 3, height: 4, kind: "product", caption: "Hero shot on lime", prompt: "Product on vivid lime backdrop, hard shadow, editorial, centered", look: "bottle-lime" },
  { id: "ph4", width: 4, height: 3, kind: "lifestyle", caption: "In hand, golden hour", prompt: "Hand holding product outdoors, golden hour, shallow depth of field", look: "sunset" },
  { id: "ph5", width: 4, height: 5, kind: "product", caption: "Dark mode packshot", prompt: "Product on charcoal, rim light, dramatic, premium", look: "bottle-ink" },
  { id: "ph6", width: 1, height: 1, kind: "product", caption: "Flat lay set", prompt: "Top-down flat lay, three products, cream paper, soft shadows", look: "flatlay" },
  { id: "ph7", width: 3, height: 4, kind: "lifestyle", caption: "Vanity mirror moment", prompt: "Vanity scene, mirror reflection, warm lamp light, cozy", look: "mirror" },
  { id: "ph8", width: 4, height: 3, kind: "product", caption: "Splash shot", prompt: "Product with water splash, frozen motion, studio lighting", look: "splash" },
];

function Placeholder({ look }: { look: string }) {
  const bottle = (body: string, cap: string) => (
    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[42%]" style={{ width: "26%", aspectRatio: "1 / 2.1" }}>
      <span className={`absolute inset-x-[30%] top-0 h-[18%] rounded-t-[30%] ${cap}`} />
      <span className={`absolute inset-x-0 bottom-0 top-[16%] rounded-[18%] ${body} shadow-[0_2.5rem_3rem_-1.5rem_rgba(0,0,0,0.45)]`} />
      <span className="absolute inset-x-[18%] top-[48%] h-[16%] rounded-[3px] bg-white/60" />
    </span>
  );
  switch (look) {
    case "bottle-cream":
      return <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,#fff7e6,#e9dfc6_55%,#d9cba8)]">{bottle("bg-[#f6f2e6]/90", "bg-[#c9b98f]")}</span>;
    case "bottle-lime":
      return <span className="absolute inset-0 bg-[#c6f432]">{bottle("bg-[#fffef8]", "bg-[#1c1b17]")}<span className="absolute bottom-[14%] left-[30%] h-[6%] w-[60%] rounded-full bg-black/15 blur-md" /></span>;
    case "bottle-ink":
      return <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#3a3830,#1c1b17_65%)]">{bottle("bg-[#c6f432]/90", "bg-[#f4f1e6]")}</span>;
    case "shelf":
      return (
        <span className="absolute inset-0 bg-[linear-gradient(#efe9da_62%,#d8ccb0_62%)]">
          <span className="absolute bottom-[38%] left-[14%] h-[30%] w-[14%] rounded-t-full bg-[#7d8f57]" />
          <span className="absolute bottom-[38%] left-[34%] h-[24%] w-[11%] rounded-[20%] bg-[#fffef8] shadow-lg" />
          <span className="absolute bottom-[38%] left-[50%] h-[18%] w-[16%] rounded-[25%] bg-[#c6f432]" />
          <span className="absolute bottom-[38%] right-[12%] h-[34%] w-[10%] rounded-[30%] bg-[#e6dcc4] shadow-lg" />
        </span>
      );
    case "sunset":
      return (
        <span className="absolute inset-0 bg-[linear-gradient(160deg,#ffcf8a,#f08a4b_55%,#7a3b2e)]">
          <span className="absolute right-[18%] top-[20%] h-[26%] w-[20%] rounded-full bg-[#fff1c9]/80 blur-sm" />
          <span className="absolute bottom-0 left-[22%] h-[62%] w-[30%] rounded-t-[45%] bg-[#5b2c22]/80" />
          <span className="absolute bottom-[34%] left-[30%] h-[30%] w-[12%] rounded-[25%] bg-[#fffef8]" />
        </span>
      );
    case "flatlay":
      return (
        <span className="absolute inset-0 bg-[#f3eee0]">
          <span className="absolute left-[14%] top-[18%] h-[34%] w-[22%] rounded-[18%] bg-[#fffef8] shadow-xl" />
          <span className="absolute left-[44%] top-[28%] h-[40%] w-[16%] rounded-full bg-[#c6f432] shadow-xl" />
          <span className="absolute right-[12%] top-[16%] h-[26%] w-[24%] rounded-full bg-[#1c1b17] shadow-xl" />
          <span className="absolute bottom-[12%] left-[20%] h-[12%] w-[46%] rounded-full bg-[#e3d9c0]" />
        </span>
      );
    case "mirror":
      return (
        <span className="absolute inset-0 bg-[linear-gradient(#5a4a3a,#2c241d)]">
          <span className="absolute left-1/2 top-[10%] h-[52%] w-[54%] -translate-x-1/2 rounded-t-full border-[6px] border-[#c9a86a] bg-[radial-gradient(circle_at_40%_35%,#fbe7c2,#a8875c)]" />
          <span className="absolute bottom-[14%] left-[20%] h-[18%] w-[12%] rounded-[25%] bg-[#fffef8]" />
          <span className="absolute bottom-[14%] left-[38%] h-[13%] w-[14%] rounded-[30%] bg-[#c6f432]" />
        </span>
      );
    default:
      return (
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,#e8f9ff,#9fd3e6_55%,#3d7d97)]">
          {bottle("bg-[#fffef8]", "bg-[#3d7d97]")}
          {[...Array(7)].map((_, i) => (
            <span key={i} className="absolute rounded-full bg-white/70" style={{ width: `${4 + (i % 3) * 3}%`, aspectRatio: "1", left: `${18 + i * 10}%`, top: `${58 + ((i * 17) % 22)}%` }} />
          ))}
        </span>
      );
  }
}

type Shown = GalleryTile & { look?: string };

export default function AiGallery({ items }: { items: GalleryTile[] }) {
  const g = site.gallery;
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const placeholder = items.length === 0;

  const list: Shown[] = useMemo(
    () => (placeholder ? PLACEHOLDERS.map((p) => ({ ...p, src: "" })) : items),
    [items, placeholder],
  );
  // Alternate images between the two rows, then repeat each row until it
  // is long enough to loop seamlessly on wide screens.
  const rows = useMemo(() => {
    const split = [list.filter((_, i) => i % 2 === 0), list.filter((_, i) => i % 2 === 1)];
    if (split[1].length === 0) split[1] = [...split[0]].reverse();
    return split.map((r) => {
      const out = [...r];
      while (out.length < 6) out.push(...r);
      return out.map((it) => ({ it, index: list.indexOf(it) }));
    });
  }, [list]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tracks = gsap.utils.toArray<HTMLElement>("[data-track]");
        const wraps = gsap.utils.toArray<HTMLElement>("[data-row]");
        const state = tracks.map((_, i) => ({ x: 0, dir: i === 0 ? -1 : 1, hover: 0, speed: 1 }));
        let boost = 0;
        let scrollDir = 1;

        // Arrive from opposite sides out of a blur, then drift up and down
        // against each other while the section scrolls past.
        wraps.forEach((w, i) => {
          gsap.fromTo(
            w,
            { xPercent: i === 0 ? 18 : -18, opacity: 0, filter: "blur(14px)" },
            {
              xPercent: 0,
              opacity: 1,
              filter: "blur(0px)",
              ease: "none",
              scrollTrigger: { trigger: root.current, start: "top 85%", end: "top 25%", scrub: 0.6 },
            },
          );
          gsap.fromTo(
            w,
            { y: i === 0 ? 70 : -40 },
            { y: i === 0 ? -50 : 60, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });

        const skews = tracks.map((t) => gsap.quickTo(t, "skewX", { duration: 0.5, ease: "power3" }));
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate(self) {
            const v = self.getVelocity();
            scrollDir = self.direction;
            boost = Math.min(Math.abs(v) / 90, 18);
            skews.forEach((s, i) => s(gsap.utils.clamp(-9, 9, (v / -260) * (i === 0 ? 1 : -1))));
          },
        });

        const tick = () => {
          if (!st.isActive) return;
          boost *= 0.92;
          if (boost < 0.05) skews.forEach((s) => s(0));
          tracks.forEach((t, i) => {
            const s = state[i];
            // Scrolling down pushes row one left and row two right; scrolling up flips both.
            const dir = s.dir * scrollDir;
            s.speed += ((s.hover ? 0 : 1) - s.speed) * 0.08;
            s.x += dir * (0.55 + boost) * s.speed;
            const half = t.scrollWidth / 2;
            if (s.x <= -half) s.x += half;
            if (s.x > 0) s.x -= half;
            gsap.set(t, { x: s.x });
          });
        };
        gsap.ticker.add(tick);

        // Hovering a row slows it to a stop so an image can be looked at.
        const offs = tracks.map((t, i) => {
          const on = () => (state[i].hover = 1);
          const off = () => (state[i].hover = 0);
          t.addEventListener("pointerenter", on);
          t.addEventListener("pointerleave", off);
          return () => {
            t.removeEventListener("pointerenter", on);
            t.removeEventListener("pointerleave", off);
          };
        });

        return () => {
          gsap.ticker.remove(tick);
          st.kill();
          offs.forEach((f) => f());
        };
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [rows] },
  );

  // Tilt the hovered image toward the pointer.
  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const tile = (e.target as Element).closest<HTMLElement>("[data-tile]");
      if (!tile) return;
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--rx", `${(((e.clientY - r.top) / r.height - 0.5) * -10).toFixed(2)}deg`);
      tile.style.setProperty("--ry", `${(((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(2)}deg`);
    };
    const out = (e: PointerEvent) => {
      const tile = (e.target as Element).closest<HTMLElement>("[data-tile]");
      if (tile && !tile.contains(e.relatedTarget as Node)) {
        tile.style.setProperty("--rx", "0deg");
        tile.style.setProperty("--ry", "0deg");
      }
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerout", out);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerout", out);
    };
  }, []);

  const tile = ({ it, index }: { it: Shown; index: number }, key: string, hidden: boolean) => (
    <li key={key} className="shrink-0 px-[clamp(0.4rem,1vw,0.8rem)]" aria-hidden={hidden || undefined}>
      <button
        type="button"
        data-tile
        data-cursor="view"
        tabIndex={hidden ? -1 : 0}
        onClick={() => setOpen(index)}
        aria-label={`Open ${it.caption || (it.kind === "lifestyle" ? "lifestyle image" : "product shot")}`}
        className="gallery-tile group relative block overflow-clip rounded-[1.4rem] bg-surface text-left"
        style={{ aspectRatio: `${it.width} / ${it.height}` } as CSSProperties}
      >
        {it.src ? (
          <img src={it.src} alt={it.caption} loading="lazy" decoding="async" className="gallery-img absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="gallery-img absolute inset-0">
            <Placeholder look={it.look ?? ""} />
          </span>
        )}
        <span className="mono absolute left-3 top-3 rounded-full bg-[#fffef8]/90 px-2.5 py-1 text-[0.72rem] text-[#1c1b17] backdrop-blur">
          {it.kind === "lifestyle" ? "Lifestyle" : "Product shot"}
        </span>
        {placeholder && (
          <span className="mono absolute right-3 top-3 hidden rounded-full bg-[#1c1b17]/80 px-2.5 py-1 text-[0.68rem] text-[#f4f1e6] sm:inline">Sample</span>
        )}
        {(it.caption || it.prompt) && (
          <span className="gallery-info absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1c1b17]/90 via-[#1c1b17]/60 to-transparent p-4 pt-12 text-[#f4f1e6]">
            {it.caption && <span className="block font-medium leading-snug">{it.caption}</span>}
            {it.prompt && (
              <span className="mono mt-1.5 block text-[0.72rem] leading-relaxed text-[#f4f1e6]/75">
                <span className="text-[#c6f432]">prompt ›</span> {it.prompt}
              </span>
            )}
          </span>
        )}
      </button>
    </li>
  );

  return (
    <section ref={root} id="photography" className="section overflow-x-clip" aria-labelledby="gallery-h">
      <div className="wrap">
        <SectionRule label={g.label} note={placeholder ? "Samples shown until real images are added" : `${items.length} images`} />
        <div className="grid gap-8 lg:grid-cols-12">
          <SplitHeading id="gallery-h" className="display-lg lg:col-span-7">
            {g.heading}
          </SplitHeading>
          <Reveal variant="stagger" className="self-end lg:col-span-5">
            <p className="max-w-[46ch] text-lg text-muted">{g.sub}</p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tools">
              {g.tools.map((t) => (
                <li key={t} className="mono rounded-full border border-line px-3 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>

      <div className="mt-[clamp(3rem,6vw,5rem)] space-y-[clamp(0.8rem,2vw,1.6rem)]">
        {rows.map((row, r) => (
          <div key={r} data-row className="gallery-row will-change-transform" data-lenis-prevent-touch>
            <ul data-track className="flex w-max will-change-transform" aria-label={r === 0 ? "AI images, row one" : "AI images, row two"}>
              {row.map((x, i) => tile(x, `a${i}`, false))}
              {row.map((x, i) => tile(x, `b${i}`, true))}
            </ul>
          </div>
        ))}
      </div>

      <Reveal className="wrap mt-[clamp(2.5rem,5vw,4rem)] flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/contact" className="btn btn-lime">
          <RollText text={g.cta} />
          <ArrowSwap />
        </Link>
        <p className="text-muted">Hover an image to see how it was made.</p>
      </Reveal>

      <GalleryViewer list={list} index={open} onClose={() => setOpen(null)} onNavigate={setOpen} placeholder={placeholder} />
    </section>
  );
}

function GalleryViewer({
  list,
  index,
  onClose,
  onNavigate,
  placeholder,
}: {
  list: Shown[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
  placeholder: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const item = index === null ? null : list[index];

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) {
      d.showModal();
      getLenis()?.stop();
    } else if (index === null && d.open) d.close();
    if (index === null) getLenis()?.start();
  }, [index]);

  const go = (dir: 1 | -1) => index !== null && onNavigate((index + dir + list.length) % list.length);

  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label={item?.caption || "Image"}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      {item && (
        <div className="lightbox-panel pointer-events-none mx-auto flex h-full max-w-[80rem] flex-col items-center justify-center gap-4 p-4 md:p-10">
          <div
            className="pointer-events-auto relative max-h-[78dvh] w-auto overflow-clip rounded-[1.6rem] bg-surface"
            style={{ aspectRatio: `${item.width} / ${item.height}`, height: `min(78dvh, calc(92vw * ${(item.height / item.width).toFixed(4)}))` }}
          >
            {item.src ? (
              <img src={item.src} alt={item.caption} className="h-full w-full object-contain" />
            ) : (
              <Placeholder look={item.look ?? ""} />
            )}
          </div>
          <div className="pointer-events-auto flex w-full max-w-[44rem] items-center gap-3 rounded-2xl bg-bg p-3 pl-5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {item.caption}
                {placeholder ? " (sample)" : ""}
              </p>
              {item.prompt && <p className="mono truncate text-[0.75rem] text-muted">prompt › {item.prompt}</p>}
            </div>
            <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line hover:bg-ink hover:text-bg">
              <ChevronIcon className="rotate-180" width={18} height={18} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next image" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line hover:bg-ink hover:text-bg">
              <ChevronIcon width={18} height={18} />
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-bg">
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
