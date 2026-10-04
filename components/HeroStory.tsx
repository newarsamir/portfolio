"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { at, STORY_DURATION, STORY_LINES } from "@/lib/hero-story";
import type { HeroVideoHandle } from "./HeroVideo";

/**
 * The hero "video": a narrated motion story drawn with real HTML in the
 * site's own fonts and colors, timed to public/hero/story/narration.mp3.
 * It runs silently with captions; "Tap for sound" plays the narration in
 * sync. Everything is sized in container units, so it stays crisp at any
 * size, including while the hero frame is scaled down.
 */

const PROBLEMS = [
  { bad: "Wall of text", good: "Easy to scan", chip: "+ readers" },
  { bad: "Offer buried at the bottom", good: "Offer up top", chip: "+ clicks" },
  { bad: "Button too small to tap", good: "Thumb-sized button", chip: "+ taps" },
  { bad: "Broken on phones", good: "Built for mobile", chip: "+ mobile orders" },
  { bad: "Lost in dark mode", good: "Works everywhere", chip: "+ trust" },
  { bad: "Cart with no product", good: "Shows what they left", chip: "+ recovered carts" },
];
const P_IDS = ["p1", "p2", "p3", "p4", "p5", "p6"];
// Where along the revenue line (x in its 0-1000 viewBox) each stage reaches.
const LINE_AT = [220, 310, 400, 490, 580, 670, 760, 1000];

/* ------------------------------ Email bits ------------------------------ */

const Bar = ({ w = "100%", h = 0.42, c = "bg-[#d9d5c8]", className = "" }: { w?: string; h?: number; c?: string; className?: string }) => (
  <span className={`block rounded-full ${c} ${className}`} style={{ width: w, height: `${h}cqw` }} />
);

function Head({ dark = false, hideLogo = false }: { dark?: boolean; hideLogo?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`rounded-[0.3cqw] ${hideLogo ? "bg-[#232220]" : dark ? "bg-[#f4f1e6]" : "bg-[#1c1b17]"}`}
        style={{ width: "5.2cqw", height: "0.9cqw" }}
      />
      <span className="flex gap-[0.4cqw]">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`rounded-full ${dark ? "bg-white/30" : "bg-[#1c1b17]/25"}`} style={{ width: "1.3cqw", height: "0.32cqw" }} />
        ))}
      </span>
    </div>
  );
}

const Screen = ({ id, children, dark = false }: { id: string; children: ReactNode; dark?: boolean }) => (
  <div data-screen={id} className={`absolute inset-0 flex flex-col gap-[0.8cqw] p-[1.3cqw] opacity-0 ${dark ? "bg-[#1c1b17]" : "bg-[#fffef8]"}`}>
    {children}
  </div>
);

const Btn = ({ children, big = false, className = "" }: { children: ReactNode; big?: boolean; className?: string }) => (
  <span
    className={`grid place-items-center rounded-full bg-[#c6f432] font-semibold text-[#23300f] ${className}`}
    style={{ height: big ? "3.4cqw" : "2.4cqw", fontSize: big ? "1.15cqw" : "0.95cqw" }}
  >
    {children}
  </span>
);

const Serum = ({ className = "" }: { className?: string }) => (
  <span
    className={`block rounded-[0.6cqw] bg-[#f3f0e2] ${className}`}
    style={{ backgroundImage: "url(/hero/story/founder.webp)", backgroundSize: "430%", backgroundPosition: "71% 40%" }}
  />
);

function Emails() {
  const h = (s: number) => ({ fontSize: `${s}cqw` });
  return (
    <>
      {/* The founder's original email: opened, then scrolled past. */}
      <Screen id="intro">
        <Head />
        <span className="block rounded-[0.6cqw] bg-[#d9d5c8]" style={{ height: "11cqw" }} />
        {[92, 100, 86, 97, 74, 95, 88, 100, 80, 93, 70].map((w, i) => <Bar key={i} w={`${w}%`} />)}
        <span className="mt-auto text-[#b9b5a8] underline" style={h(0.8)}>shop now</span>
      </Screen>

      {/* 01 */}
      <Screen id="bad-p1">
        <Head />
        <span className="font-semibold text-[#9c988b]" style={h(0.95)}>Our Autumn Update</span>
        {Array.from({ length: 22 }, (_, i) => <Bar key={i} w={`${[96, 100, 91, 99, 87][i % 5]}%`} h={0.36} />)}
      </Screen>
      <Screen id="good-p1">
        <Head />
        <div className="rounded-[0.8cqw] bg-[#c6f432] p-[1.2cqw] text-[#23300f]">
          <p className="font-display font-semibold leading-[1.05]" style={h(1.9)}>Your skin, simplified.</p>
          <p className="mt-[0.6cqw] opacity-80" style={h(0.85)}>One serum. Three minutes a day.</p>
        </div>
        <Bar w="80%" c="bg-[#1c1b17]/25" /> <Bar w="62%" c="bg-[#1c1b17]/25" />
        <div className="mt-[0.6cqw] grid grid-cols-3 gap-[0.6cqw]">
          {["Clean", "Gentle", "Daily"].map((t) => (
            <span key={t} className="rounded-[0.5cqw] bg-[#f3f0e2] py-[0.8cqw] text-center font-medium text-[#1c1b17]" style={h(0.75)}>{t}</span>
          ))}
        </div>
        <Btn className="mt-auto">Shop the serum</Btn>
      </Screen>

      {/* 02 */}
      <Screen id="bad-p2">
        <Head />
        <span className="block rounded-[0.6cqw] bg-[#d9d5c8]" style={{ height: "14cqw" }} />
        {[95, 100, 88, 97, 90, 72].map((w, i) => <Bar key={i} w={`${w}%`} />)}
        <span className="mt-auto text-[#b9b5a8]" style={h(0.7)}>P.S. use WELCOME10 for 10% off</span>
      </Screen>
      <Screen id="good-p2">
        <Head />
        <div className="rounded-[0.8cqw] bg-[#1c1b17] p-[1.3cqw] text-[#f4f1e6]">
          <p className="font-mono opacity-70" style={h(0.7)}>Welcome gift</p>
          <p className="mt-[0.3cqw] font-display font-semibold leading-[1.02]" style={h(2.3)}>10% off your first order</p>
          <span className="mt-[0.8cqw] inline-block rounded-[0.4cqw] border border-dashed border-[#c6f432] px-[0.8cqw] py-[0.3cqw] font-mono text-[#c6f432]" style={h(0.85)}>WELCOME10</span>
        </div>
        <Btn big>Claim my 10%</Btn>
        <Bar w="85%" c="bg-[#1c1b17]/20" /> <Bar w="70%" c="bg-[#1c1b17]/20" />
      </Screen>

      {/* 03 */}
      <Screen id="bad-p3">
        <Head />
        <span className="block rounded-[0.6cqw] bg-[#e7e3d6]" style={{ height: "13cqw" }} />
        {[90, 100, 84].map((w, i) => <Bar key={i} w={`${w}%`} />)}
        <span className="relative mt-[0.4cqw] self-start text-[#9c988b] underline" style={h(0.7)}>
          click here
          <span data-thumb-miss className="absolute rounded-full border-[0.2cqw] border-[#1c1b17]/40 bg-[#1c1b17]/10" style={{ width: "3.2cqw", height: "3.2cqw", left: "4cqw", top: "-0.6cqw" }} />
        </span>
      </Screen>
      <Screen id="good-p3">
        <Head />
        <span className="block rounded-[0.6cqw] bg-[#f3f0e2]" style={{ height: "13cqw" }} />
        {[90, 100, 84].map((w, i) => <Bar key={i} w={`${w}%`} c="bg-[#1c1b17]/25" />)}
        <span className="relative mt-[0.6cqw]">
          <Btn big>Shop the serum</Btn>
          <span data-thumb-tap className="absolute rounded-full bg-[#1c1b17]/25" style={{ width: "3.4cqw", height: "3.4cqw", left: "45%", top: "0" }} />
        </span>
      </Screen>

      {/* 04 */}
      <Screen id="bad-p4">
        <div className="mx-auto mt-[6cqw] w-[70%] origin-top scale-[0.62] space-y-[0.4cqw] rounded-[0.3cqw] border border-[#d9d5c8] p-[0.6cqw]">
          <Head />
          <div className="grid grid-cols-3 gap-[0.4cqw]">
            {[0, 1, 2].map((i) => <span key={i} className="block rounded-[0.2cqw] bg-[#d9d5c8]" style={{ height: "4cqw" }} />)}
          </div>
          {[100, 92, 97, 85].map((w, i) => <Bar key={i} w={`${w}%`} h={0.25} />)}
          <span className="block text-[#b9b5a8]" style={h(0.4)}>pinch to zoom…</span>
        </div>
      </Screen>
      <Screen id="good-p4">
        <Head />
        <Serum className="h-[13cqw] w-full" />
        <p className="font-display font-semibold leading-[1.05] text-[#1c1b17]" style={h(1.7)}>Made for the phone in your hand.</p>
        <Bar w="90%" c="bg-[#1c1b17]/25" /> <Bar w="70%" c="bg-[#1c1b17]/25" />
        <Btn big className="mt-auto">Shop now</Btn>
      </Screen>

      {/* 05 */}
      <Screen id="bad-p5" dark>
        <Head dark hideLogo />
        {[0, 1].map((i) => (
          <span key={i} className="relative grid place-items-center rounded-[0.6cqw] border border-white/15 bg-white/5" style={{ height: "9cqw" }}>
            <svg viewBox="0 0 24 24" className="text-white/25" style={{ width: "2.4cqw" }} fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="16" rx="2" /><path d="m3 17 5-5 4 4 3-3 6 6M4 4l16 16" />
            </svg>
          </span>
        ))}
        <span className="mt-auto rounded-full bg-white/10 py-[0.6cqw] text-center text-white/30" style={h(0.8)}>[image: button]</span>
      </Screen>
      <Screen id="good-p5" dark>
        <Head dark />
        <p className="mt-[0.6cqw] font-display font-semibold leading-[1.05] text-[#f4f1e6]" style={h(2)}>Glow, even in dark mode.</p>
        <Bar w="88%" c="bg-white/30" /> <Bar w="66%" c="bg-white/30" />
        <Serum className="mt-[0.4cqw] h-[11cqw] w-full" />
        <Btn big className="mt-auto">Shop the serum</Btn>
      </Screen>

      {/* 06 */}
      <Screen id="bad-p6">
        <Head />
        <p className="font-semibold text-[#9c988b]" style={h(1.3)}>You forgot something!</p>
        <span className="grid place-items-center rounded-[0.6cqw] border-[0.15cqw] border-dashed border-[#d9d5c8] font-display text-[#d9d5c8]" style={{ height: "14cqw", fontSize: "4cqw" }}>?</span>
        <Bar w="80%" /> <Bar w="60%" />
        <span className="mt-auto rounded-full bg-[#e7e3d6] py-[0.6cqw] text-center text-[#9c988b]" style={h(0.8)}>Return to store</span>
      </Screen>
      <Screen id="good-p6">
        <Head />
        <p className="font-display font-semibold leading-[1.05] text-[#1c1b17]" style={h(1.6)}>Still thinking it over?</p>
        <div className="flex gap-[0.8cqw] rounded-[0.8cqw] border border-[#e2ddcb] p-[0.8cqw]">
          <Serum className="h-[8cqw] w-[6.4cqw] shrink-0" />
          <div className="flex min-w-0 flex-col justify-center gap-[0.3cqw]">
            <p className="font-semibold text-[#1c1b17]" style={h(0.95)}>Daily Serum</p>
            <p className="text-[#e3a008]" style={h(0.8)}>★★★★★</p>
            <p className="font-mono text-[#6b675c]" style={h(0.75)}>In your cart</p>
          </div>
        </div>
        <p className="text-[#6b675c]" style={h(0.8)}>“My skin hasn&apos;t looked this calm in years.”</p>
        <Btn big className="mt-auto">Complete my order</Btn>
      </Screen>
    </>
  );
}

function MiniEmail({ label, tone }: { label: string; tone: "lime" | "ink" | "cream" }) {
  const top = tone === "lime" ? "bg-[#c6f432]" : tone === "ink" ? "bg-[#1c1b17]" : "bg-[#f3f0e2]";
  return (
    <div data-mini className="flex flex-col items-center gap-[0.8cqw] opacity-0">
      <div className="flex w-[10cqw] flex-col gap-[0.5cqw] rounded-[1cqw] border border-[#e2ddcb] bg-[#fffef8] p-[0.8cqw] shadow-[0_2cqw_3cqw_-2cqw_rgba(28,27,23,0.35)]" style={{ height: "14cqw" }}>
        <span className={`block rounded-[0.5cqw] ${top}`} style={{ height: "5cqw" }} />
        <Bar w="90%" h={0.35} c="bg-[#1c1b17]/20" />
        <Bar w="70%" h={0.35} c="bg-[#1c1b17]/20" />
        <span className="mt-auto block rounded-full bg-[#c6f432]" style={{ height: "1.6cqw" }} />
      </div>
      <span className="font-mono text-[#1c1b17]" style={{ fontSize: "1.05cqw" }}>{label}</span>
    </div>
  );
}

/* -------------------------------- Story -------------------------------- */

const HeroStory = forwardRef<HeroVideoHandle, { reduced?: boolean }>(function HeroStory({ reduced = false }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const wantPlay = useRef(false);
  const [caption, setCaption] = useState(-1);
  const [sound, setSound] = useState(false);
  const [paused, setPaused] = useState(false);
  const soundRef = useRef(false);
  const pausedRef = useRef(false);

  useGSAP(
    () => {
      const t = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "expo.out", duration: 0.9 } });
      tl.current = t;
      const blurIn = { opacity: 0, filter: "blur(10px)" };

      // The line draws by length, so convert each stage's x into the length
      // along the curve where it reaches that x.
      const path = root.current!.querySelector<SVGPathElement>("[data-line]")!;
      const total = path.getTotalLength();
      const lenAt = (x: number) => {
        if (x >= 1000) return total;
        let lo = 0;
        let hi = total;
        for (let i = 0; i < 24; i++) {
          const mid = (lo + hi) / 2;
          if (path.getPointAtLength(mid).x < x) lo = mid;
          else hi = mid;
        }
        return hi;
      };
      const off = (stage: number) => total - lenAt(LINE_AT[stage]);
      gsap.set(path, { strokeDasharray: total, strokeDashoffset: total });
      const sharp = { opacity: 1, filter: "blur(0px)" };

      // 0: founder card already on stage (also the still frame before play).
      t.fromTo("[data-founder]", { scale: 1.06 }, { scale: 1, duration: 3, ease: "power2.out" }, 0);

      // Subscribers tick up.
      const subs = { v: 0 };
      t.fromTo("[data-subs]", { ...blurIn, y: 20 }, { ...sharp, y: 0 }, at("intro2"));
      t.to(subs, {
        v: 8240,
        duration: 2.6,
        ease: "power2.out",
        onUpdate: () => {
          const el = root.current?.querySelector("[data-subs-n]");
          if (el) el.textContent = Math.round(subs.v).toLocaleString("en-US");
        },
      }, at("intro2") + 0.2);

      // Her email gets opened, then scrolled past. Revenue stays flat.
      const i3 = at("intro3");
      t.fromTo("[data-phone]", { ...blurIn, xPercent: 60, rotate: 6 }, { ...sharp, xPercent: 0, rotate: 0, duration: 1.1 }, i3 - 0.3);
      t.set('[data-screen="intro"]', { opacity: 1 }, i3 - 0.3);
      t.fromTo("[data-opened]", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, ease: "back.out(2)", duration: 0.5 }, i3 + 0.5);
      t.to('[data-screen="intro"]', { yPercent: -35, filter: "blur(4px)", opacity: 0.35, duration: 1.4, ease: "power2.inOut" }, i3 + 1.6);
      t.to("[data-opened]", { opacity: 0, duration: 0.4 }, i3 + 2.4);
      t.fromTo("[data-chart]", blurIn, sharp, i3 + 0.4);
      t.fromTo("[data-line]", { strokeDashoffset: total }, { strokeDashoffset: off(0), duration: 1.6, ease: "power1.inOut" }, i3 + 0.6);

      // "Here's why." The founder steps aside.
      const w = at("why");
      t.to("[data-subs]", { opacity: 0, filter: "blur(8px)", duration: 0.5 }, w - 0.2);
      t.to("[data-founder]", { x: "-5cqw", y: "-4.5cqw", scale: 0.4, duration: 1.1, ease: "expo.inOut" }, w - 0.2);
      t.fromTo("[data-why]", { ...blurIn, scale: 0.85 }, { ...sharp, scale: 1 }, w);
      t.to('[data-screen="intro"]', { opacity: 0, duration: 0.4 }, w + 0.6);

      // The six problems, one identical beat each.
      P_IDS.forEach((id, i) => {
        const s = at(id);
        const label = `[data-plabel="${i}"]`;
        if (i === 0) t.to("[data-why]", { ...blurIn, y: -30, duration: 0.5 }, s - 0.3);
        else {
          t.to(`[data-plabel="${i - 1}"]`, { opacity: 0, y: -24, filter: "blur(8px)", duration: 0.45 }, s - 0.35);
          t.to(`[data-screen="good-p${i}"]`, { opacity: 0, duration: 0.35 }, s - 0.3);
        }
        t.fromTo(label, { opacity: 0, y: 28, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7 }, s - 0.1);
        t.set(`${label} [data-good]`, { opacity: 0 }, s - 0.1);
        t.set(`${label} [data-bad]`, { opacity: 1 }, s - 0.1);
        t.fromTo(`[data-screen="bad-${id}"]`, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.5 }, s - 0.25);
        if (id === "p3") t.fromTo("[data-thumb-miss]", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, s + 0.7);
        if (id === "p1") t.to('[data-screen="bad-p1"] > span', { opacity: 0.5, stagger: 0.02, duration: 0.3 }, s + 0.3);

        // The lime wipe: in from the left, swap, out to the right.
        const fix = s + 1.75;
        t.fromTo("[data-wipe]", { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.35, ease: "power3.in" }, fix);
        t.set(`[data-screen="bad-${id}"]`, { opacity: 0 }, fix + 0.35);
        t.set(`[data-screen="good-${id}"]`, { opacity: 1 }, fix + 0.35);
        t.set("[data-wipe]", { transformOrigin: "100% 50%" }, fix + 0.35);
        t.to("[data-wipe]", { scaleX: 0, duration: 0.45, ease: "power3.out" }, fix + 0.4);
        t.to(`${label} [data-bad]`, { opacity: 0, x: -12, duration: 0.3 }, fix + 0.3);
        t.fromTo(`${label} [data-good]`, { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.5 }, fix + 0.4);
        if (id === "p3") t.fromTo("[data-thumb-tap]", { scale: 0.4, opacity: 0.6 }, { scale: 2.2, opacity: 0, duration: 0.8, ease: "power2.out" }, fix + 0.9);

        // Revenue steps up, with a chip.
        t.to("[data-line]", { strokeDashoffset: off(i + 1), duration: 0.8, ease: "power2.out" }, fix + 0.45);
        t.fromTo(`[data-chip="${i}"]`, { opacity: 0, y: 10, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, fix + 0.6);
        t.to(`[data-chip="${i}"]`, { opacity: 0, y: -10, duration: 0.4 }, fix + 1.5);
      });

      // Fix the design: the phone leaves, the flow arrives, revenue climbs.
      const f = at("fix");
      t.to('[data-plabel="5"]', { opacity: 0, y: -24, filter: "blur(8px)", duration: 0.45 }, f - 0.3);
      t.to("[data-phone]", { opacity: 0, scale: 0.8, filter: "blur(10px)", duration: 0.7, ease: "expo.in" }, f - 0.2);
      t.to("[data-founder]", { x: 0, y: 0, scale: 0.78, duration: 1.2, ease: "expo.inOut" }, f);
      t.fromTo("[data-mini]", { ...blurIn, y: 40 }, { ...sharp, y: 0, stagger: 0.18 }, f + 0.4);
      t.fromTo("[data-flowpath]", { strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, f + 0.9);
      t.to("[data-line]", { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut" }, f + 0.6);
      t.fromTo("[data-notif]", { opacity: 0, x: 30, scale: 0.9 }, { opacity: 1, x: 0, scale: 1, stagger: 0.55, ease: "back.out(1.6)", duration: 0.6 }, at("flow"));

      // Samir.
      const me = at("me");
      t.to(["[data-founder]", "[data-mini]", "[data-flowpath]", "[data-notif]", "[data-chart]"], { opacity: 0, filter: "blur(10px)", duration: 0.6, stagger: 0.03 }, me - 0.4);
      t.fromTo("[data-end] > *", { ...blurIn, y: 30 }, { ...sharp, y: 0, stagger: 0.15, duration: 1 }, me);
      t.fromTo("[data-ask]", blurIn, sharp, at("ask"));

      // Back to the opening frame for a seamless loop.
      t.to(["[data-end]", "[data-ask]"], { opacity: 0, filter: "blur(10px)", duration: 0.6 }, STORY_DURATION - 0.8);
      t.fromTo(
        "[data-founder]",
        { opacity: 0, x: 0, y: 0, scale: 1.06, filter: "blur(10px)" },
        { opacity: 1, scale: 1.06, filter: "blur(0px)", duration: 0.6, immediateRender: false },
        STORY_DURATION - 0.6,
      );

      t.eventCallback("onUpdate", () => {
        const now = t.time();
        let idx = -1;
        STORY_LINES.forEach((l, i) => {
          const next = STORY_LINES[i + 1]?.start ?? STORY_DURATION;
          if (now >= l.start - 0.05 && now < Math.min(next - 0.1, l.end + 1.2)) idx = i;
        });
        setCaption((c) => (c === idx ? c : idx));
      });

      // With reduced motion, rest on a frame that tells the story at a glance
      // and wait for the play button.
      if (reduced) {
        t.time(at("flow") + 2.5);
        pausedRef.current = true;
        setPaused(true);
      }
      return () => t.kill();
    },
    { scope: root, dependencies: [reduced] },
  );

  // With sound on, the narration is the clock and the animation follows it.
  useEffect(() => {
    const sync = () => {
      const a = audio.current;
      if (soundRef.current && a && !a.paused && tl.current) tl.current.time(a.currentTime % STORY_DURATION);
    };
    gsap.ticker.add(sync);
    return () => gsap.ticker.remove(sync);
  }, []);

  const start = () => {
    const t = tl.current;
    if (!t || pausedRef.current) return;
    if (soundRef.current && audio.current) {
      t.pause();
      audio.current.currentTime = t.time();
      audio.current.play().catch(() => {
        soundRef.current = false;
        setSound(false);
        t.play();
      });
    } else t.play();
  };
  const stop = () => {
    tl.current?.pause();
    audio.current?.pause();
  };

  useImperativeHandle(ref, () => ({
    play() {
      wantPlay.current = true;
      if (!reduced) start();
    },
    pause() {
      wantPlay.current = false;
      stop();
    },
  }));

  const toggleSound = () => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSound(next);
    const a = audio.current;
    const t = tl.current;
    if (!a || !t) return;
    if (next) {
      // Tapping for sound also starts it, even when it was paused.
      pausedRef.current = false;
      setPaused(false);
      t.pause();
      a.currentTime = t.time();
      a.play().catch(() => {
        soundRef.current = false;
        setSound(false);
        t.play();
      });
    } else {
      a.pause();
      if (!pausedRef.current && (wantPlay.current || reduced)) t.play();
    }
  };

  const togglePause = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (next) stop();
    else start();
  };

  const line = caption >= 0 ? STORY_LINES[caption] : null;

  return (
    <div ref={root} className="story relative h-full w-full overflow-clip bg-[#faf8f0] text-[#1c1b17]" style={{ containerType: "inline-size" }}>
      <div className="story-grid absolute inset-0" aria-hidden="true" />

      <div className="absolute inset-0" aria-hidden="true">
        {/* Founder */}
        <figure data-founder className="absolute origin-top-left" style={{ left: "7cqw", top: "6cqw", width: "21cqw" }}>
          <span className="block overflow-clip rounded-[1.4cqw] shadow-[0_3cqw_5cqw_-3cqw_rgba(28,27,23,0.45)]" style={{ aspectRatio: "4/5" }}>
            <img src="/hero/story/founder.webp" alt="" className="h-full w-full object-cover" />
          </span>
          <figcaption className="mt-[0.8cqw] font-mono text-[#6b675c]" style={{ fontSize: "1cqw" }}>
            Founder, skincare brand
          </figcaption>
        </figure>

        <div data-subs className="absolute flex items-center gap-[0.8cqw] rounded-full bg-[#1c1b17] px-[1.4cqw] py-[0.8cqw] text-[#f4f1e6] opacity-0" style={{ left: "31cqw", top: "22cqw" }}>
          <span className="rounded-full bg-[#c6f432]" style={{ width: "0.8cqw", height: "0.8cqw" }} />
          <span className="font-mono" style={{ fontSize: "1.1cqw" }}>
            Subscribers <span data-subs-n className="font-semibold">0</span>
          </span>
        </div>

        {/* "Why?" */}
        <p data-why className="absolute font-display font-semibold tracking-[-0.03em] opacity-0" style={{ left: "8cqw", top: "16cqw", fontSize: "9cqw", lineHeight: 1 }}>
          Why?
        </p>

        {/* Problem labels */}
        {PROBLEMS.map((p, i) => (
          <div key={i} data-plabel={i} className="absolute opacity-0" style={{ left: "8cqw", top: "15cqw", width: "38cqw" }}>
            <p className="font-mono text-[#6b675c]" style={{ fontSize: "1.1cqw" }}>
              {String(i + 1).padStart(2, "0")} / 06
            </p>
            <div className="relative mt-[0.8cqw]" style={{ height: "9cqw" }}>
              <p data-bad className="absolute inset-x-0 top-0 font-display font-semibold leading-[1.04] text-[#9c988b]" style={{ fontSize: "3.6cqw" }}>
                {p.bad}
              </p>
              <p data-good className="absolute inset-x-0 top-0 font-display font-semibold leading-[1.04] opacity-0" style={{ fontSize: "3.6cqw" }}>
                <span className="rounded-[0.3em] bg-[#c6f432] px-[0.18em] text-[#23300f] [box-decoration-break:clone]">{p.good}</span>
              </p>
            </div>
          </div>
        ))}

        {/* Revenue line */}
        <div data-chart className="absolute opacity-0" style={{ left: "8cqw", top: "36.5cqw", width: "38cqw", height: "12cqw" }}>
          <p className="font-mono text-[#6b675c]" style={{ fontSize: "1cqw" }}>Revenue from email</p>
          <svg viewBox="0 0 1000 220" preserveAspectRatio="none" className="mt-[0.6cqw] h-[9cqw] w-full overflow-visible">
            <path d="M0 200 H1000" stroke="#e2ddcb" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            <path
              data-line
              d="M0 190 L220 190 C250 190 260 170 310 165 S360 140 400 136 S450 112 490 106 S540 84 580 78 S630 60 670 52 S720 36 760 30 C860 22 930 14 1000 6"
              fill="none"
              stroke="#c6f432"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="4000"
              strokeDashoffset="4000"
              style={{ filter: "drop-shadow(0 0 0.4cqw rgba(198,244,50,0.6))" }}
            />
          </svg>
          {PROBLEMS.map((p, i) => (
            <span
              key={i}
              data-chip={i}
              className="absolute whitespace-nowrap rounded-full bg-[#c6f432] px-[0.9cqw] py-[0.35cqw] font-mono font-semibold text-[#23300f] opacity-0"
              style={{ left: `${(LINE_AT[i + 1] / 1000) * 100 - 6}%`, top: `${[5.6, 4.8, 3.9, 3.2, 2.4, 1.7][i]}cqw`, fontSize: "0.95cqw" }}
            >
              {p.chip}
            </span>
          ))}
        </div>

        {/* Phone */}
        <div data-phone className="absolute opacity-0" style={{ left: "57cqw", top: "3.5cqw", width: "22cqw", height: "44cqw" }}>
          <div className="relative h-full w-full rounded-[2.8cqw] bg-[#1c1b17] p-[0.7cqw] shadow-[0_4cqw_6cqw_-3cqw_rgba(28,27,23,0.55)]">
            <span className="absolute left-1/2 top-[0.7cqw] z-10 -translate-x-1/2 rounded-b-[0.8cqw] bg-[#1c1b17]" style={{ width: "7cqw", height: "1.2cqw" }} />
            <div className="relative h-full w-full overflow-clip rounded-[2.1cqw] bg-[#fffef8]">
              <Emails />
              <span data-wipe className="absolute inset-0 z-20 bg-[#c6f432]" style={{ transform: "scaleX(0)" }} />
            </div>
          </div>
          <span data-opened className="absolute rounded-full bg-[#1c1b17] px-[1cqw] py-[0.4cqw] font-mono text-[#f4f1e6] opacity-0" style={{ left: "-4cqw", top: "6cqw", fontSize: "1cqw" }}>
            Opened ✓
          </span>
        </div>

        {/* The flow */}
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute overflow-visible" style={{ left: "45cqw", top: "16cqw", width: "44cqw", height: "4cqw" }}>
          <path data-flowpath pathLength={1000} d="M40 50 C200 0 300 100 500 50 S800 0 960 50" fill="none" stroke="#c6f432" strokeWidth="5" strokeDasharray="1000" strokeDashoffset="1000" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute flex justify-between" style={{ left: "45cqw", top: "9cqw", width: "44cqw" }}>
          <MiniEmail label="Welcome" tone="lime" />
          <MiniEmail label="Cart" tone="ink" />
          <MiniEmail label="Thank-you" tone="cream" />
        </div>

        {/* New orders */}
        <div className="absolute flex flex-col gap-[0.7cqw]" style={{ left: "23cqw", top: "8cqw" }}>
          {["Welcome flow", "Cart reminder", "Post-purchase"].map((src) => (
            <span key={src} data-notif className="flex items-center gap-[0.8cqw] rounded-[1cqw] border border-[#e2ddcb] bg-[#fffef8] px-[1.1cqw] py-[0.7cqw] opacity-0 shadow-[0_1.4cqw_2.4cqw_-1.4cqw_rgba(28,27,23,0.35)]">
              <span className="grid place-items-center rounded-full bg-[#c6f432] font-semibold text-[#23300f]" style={{ width: "1.9cqw", height: "1.9cqw", fontSize: "1cqw" }}>✓</span>
              <span>
                <span className="block font-semibold" style={{ fontSize: "1.05cqw" }}>New order</span>
                <span className="block font-mono text-[#6b675c]" style={{ fontSize: "0.8cqw" }}>from {src}</span>
              </span>
            </span>
          ))}
        </div>

        {/* End card */}
        <div data-end className="absolute inset-x-0 flex flex-col items-center text-center" style={{ top: "13cqw" }}>
          <p className="font-mono text-[#6b675c] opacity-0" style={{ fontSize: "1.2cqw" }}>Email designer for DTC brands</p>
          <p className="mt-[1cqw] font-display font-semibold tracking-[-0.03em] opacity-0" style={{ fontSize: "6.4cqw", lineHeight: 1 }}>Sthasamir</p>
          <p className="mt-[1.4cqw] opacity-0" style={{ fontSize: "2cqw" }}>Email design that pays for itself.</p>
          <span className="mt-[2cqw] rounded-full bg-[#c6f432] px-[2.6cqw] py-[1.1cqw] font-semibold text-[#23300f] opacity-0" style={{ fontSize: "1.5cqw" }}>
            Hire me
          </span>
        </div>
        <p data-ask className="absolute inset-x-0 text-center font-display font-semibold opacity-0" style={{ top: "38cqw", fontSize: "2.6cqw" }}>
          Which of these is costing you?
        </p>
      </div>

      {/* Captions: the narration, readable with the sound off. */}
      <div className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ bottom: "2.6cqw" }} aria-live="off">
        {line && line.id !== "ask" && (
          <p key={line.id} className="story-caption rounded-[0.8cqw] bg-[#1c1b17]/90 px-[1.4cqw] py-[0.6cqw] text-center font-medium text-[#f4f1e6]" style={{ fontSize: "1.55cqw", maxWidth: "70cqw" }}>
            {line.text}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="absolute flex gap-[0.6cqw]" style={{ right: "1.6cqw", top: "1.6cqw" }}>
        <button
          type="button"
          onClick={togglePause}
          aria-label={paused ? "Play the story" : "Pause the story"}
          className="story-btn grid place-items-center rounded-full border border-[#1c1b17]/15 bg-[#fffef8]/85 text-[#1c1b17] backdrop-blur"
        >
          {paused ? (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
          )}
        </button>
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={sound}
          className={`story-btn story-sound flex items-center gap-[0.5em] rounded-full px-[1em] font-medium ${
            sound ? "bg-[#1c1b17] text-[#f4f1e6]" : "bg-[#c6f432] text-[#23300f]"
          }`}
        >
          {sound ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="m17 9 5 6M22 9l-5 6" /></svg>
          )}
          {sound ? "Sound on" : "Tap for sound"}
        </button>
      </div>

      <audio ref={audio} src="/hero/story/narration.mp3" preload="none" loop />
    </div>
  );
});

export default HeroStory;
