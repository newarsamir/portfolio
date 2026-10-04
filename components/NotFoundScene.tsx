"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { toast } from "@/lib/toast";
import { ArrowSwap, RollText } from "./RollText";

const QUIPS = [
  "Hard bounce. The address you typed doesn't exist. We checked twice, then once more out of pity.",
  "Even Outlook 2007 renders this better than whatever you were expecting to find here.",
  "Open rate: 100%. Click rate: 100%. Usefulness: a confident 0%.",
  "This URL has the same energy as an email that starts with 'Dear Valued Customer'.",
  "It's not you, it's the link. Okay, statistically it might be you.",
  "Somewhere a marketer is already calling this page 'an engagement opportunity'.",
  "If this page were a subject line, it would be 'Re: Re: Fwd: (no subject)'.",
  "You found the one page on this site with worse deliverability than a cold sales email.",
];

const INTERN = [
  "The intern has been notified. The intern is also me.",
  "Blamed again. Morale is at an all-time low.",
  "The intern is now updating their LinkedIn.",
  "HR would like a quick word. Bring the URL.",
  "The intern has unsubscribed from this job.",
];

const ESCAPES = 7;

/** Falling envelopes behind everything. Positions are fixed so the server and client agree. */
const MAIL = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 7) % 100,
  delay: (i * 1.37) % 9,
  duration: 9 + ((i * 2.3) % 7),
  size: 1.4 + ((i * 7) % 5) * 0.35,
  spin: ((i * 53) % 70) - 35,
  returned: i % 4 === 0,
}));

function Envelope({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 28" className={className} aria-hidden="true">
      <rect x="1" y="1" width="38" height="26" rx="4" fill="var(--raised)" stroke="var(--ink)" strokeWidth="1.6" />
      <path d="m2.5 3 17.5 13L37.5 3" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export default function NotFoundScene() {
  const pathname = usePathname() ?? "/that-page";
  const router = useRouter();
  const scene = useRef<HTMLDivElement>(null);
  const [quip, setQuip] = useState(0);
  const [typed, setTyped] = useState<string[]>([]);
  const [blames, setBlames] = useState(0);
  const [dodges, setDodges] = useState(0);
  const [dodge, setDodge] = useState({ x: 0, y: 0 });
  const [reduced, setReduced] = useState(false);
  const dodgeZone = useRef<HTMLDivElement>(null);
  const unsub = useRef<HTMLButtonElement>(null);

  const path = pathname.length > 48 ? `${pathname.slice(0, 45)}…` : pathname;
  const report = [
    `550 5.1.1 <${path}>: recipient page does not exist`,
    "Diagnosis: a typo, a stale bookmark, or you were poking around. Respect.",
    "Attempts: 404 · Next retry: never · Mood: unbothered",
    "Spam score: 0.0 (this page is too empty to even be spam)",
  ];

  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  // Rotate the sarcasm.
  useEffect(() => {
    const id = window.setInterval(() => setQuip((q) => (q + 1) % QUIPS.length), 3600);
    return () => window.clearInterval(id);
  }, []);

  // Type the bounce report line by line.
  useEffect(() => {
    if (reduced) {
      setTyped(report);
      return;
    }
    let line = 0;
    let char = 0;
    let id = 0;
    const out: string[] = [];
    const tick = () => {
      if (line >= report.length) return;
      char++;
      out[line] = report[line].slice(0, char);
      setTyped([...out]);
      if (char >= report[line].length) {
        line++;
        char = 0;
        id = window.setTimeout(tick, 380);
      } else {
        id = window.setTimeout(tick, 16 + Math.random() * 22);
      }
    };
    id = window.setTimeout(tick, 1500);
    return () => window.clearTimeout(id);
    // The report only depends on the path.
  }, [reduced, path]);

  // The digits drift away from the pointer, each at its own depth.
  useEffect(() => {
    const el = scene.current;
    if (!el || reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty("--px", ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
        el.style.setProperty("--py", ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // The unsubscribe button runs from the pointer until it gets tired.
  const flee = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse" || dodges >= ESCAPES) return;
    const zone = dodgeZone.current?.getBoundingClientRect();
    const btn = unsub.current?.getBoundingClientRect();
    if (!zone || !btn) return;
    const maxX = Math.max(0, (zone.width - btn.width) / 2);
    const maxY = 70;
    let x = 0;
    let y = 0;
    // Jump somewhere clearly away from where it was.
    for (let i = 0; i < 6; i++) {
      x = (Math.random() * 2 - 1) * maxX;
      y = (Math.random() * 2 - 1) * maxY;
      if (Math.hypot(x - dodge.x, y - dodge.y) > 120) break;
    }
    setDodge({ x, y });
    setDodges((d) => d + 1);
  };

  const unsubscribe = () => {
    toast.info(
      "You can't unsubscribe from a page that doesn't exist. But we admire the commitment. Taking you home.",
      dodges >= ESCAPES ? "Fine. You win." : "Unsubscribed (sort of)",
    );
    window.setTimeout(() => router.push("/"), 1400);
  };

  const blame = () => {
    const n = blames + 1;
    setBlames(n);
    if (n > INTERN.length) {
      toast.error(`You've blamed the intern ${n} times. This is now a workplace issue.`, "Formal complaint filed");
    } else {
      toast.info(INTERN[n - 1], n === 1 ? "Blame received" : `Blame #${n}`);
    }
    scene.current?.classList.remove("nf-shake");
    void scene.current?.offsetWidth;
    scene.current?.classList.add("nf-shake");
  };

  return (
    <div ref={scene} className="nf-scene nf-landing relative min-h-svh overflow-clip">
      {/* Mail falling from the sky, some of it coming straight back. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {MAIL.map((m, i) => (
          <span
            key={i}
            className={`nf-mail ${m.returned ? "nf-mail-return" : ""}`}
            style={{
              left: `${m.left}%`,
              width: `${m.size}rem`,
              animationDelay: `${m.delay}s`,
              animationDuration: `${m.duration}s`,
              ["--spin" as string]: `${m.spin}deg`,
            }}
          >
            <Envelope className="h-auto w-full" />
          </span>
        ))}
      </div>

      <header className="wrap relative z-10 flex flex-wrap items-center justify-between gap-3 pt-6">
        <Link href="/" className="font-display text-xl font-semibold">
          {site.name}
        </Link>
        <p className="mono flex items-center gap-2 text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-danger" aria-hidden="true" />
          MAILER-DAEMON · Delivery failed
        </p>
      </header>

      <main className="wrap relative z-10 grid items-center gap-12 pb-24 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          <h1 className="sr-only">404: this page bounced</h1>
          <div className="nf-digits flex items-end font-display font-semibold leading-none" aria-hidden="true">
            <span className="nf-digit nf-glitch" data-text="4" style={{ ["--depth" as string]: 18, ["--i" as string]: 0 }}>
              4
            </span>
            <span className="nf-digit nf-zero" style={{ ["--depth" as string]: -26, ["--i" as string]: 1 }}>
              <span className="nf-letter">
                <span className="mono">nope.</span>
              </span>
              <svg viewBox="0 0 120 90" className="relative z-10 w-full">
                <rect x="4" y="18" width="112" height="68" rx="12" fill="var(--lime)" stroke="var(--ink)" strokeWidth="4" />
                <path d="m8 24 52 36 52-36" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" />
                <path className="nf-flap" d="M8 22 60 58 112 22Z" fill="var(--lime-deep)" stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="nf-digit nf-glitch" data-text="4" style={{ ["--depth" as string]: 30, ["--i" as string]: 2 }}>
              4
            </span>
          </div>

          <p className="display-lg mt-6 max-w-[14ch]">This page bounced.</p>
          <p key={quip} className="blur-swap mt-5 min-h-[5.5rem] max-w-[46ch] text-lg text-muted md:text-xl" aria-live="polite">
            {QUIPS[quip]}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/" className="btn btn-lime">
              <RollText text="Take me somewhere real" />
              <ArrowSwap />
            </Link>
            <button type="button" onClick={blame} className="btn btn-ghost">
              <RollText text={blames ? `Blame the intern (${blames})` : "Blame the intern"} />
            </button>
          </div>

          <div ref={dodgeZone} className="relative mt-6 flex h-[10rem] items-center justify-center rounded-2xl border border-dashed border-line">
            <span className="mono pointer-events-none absolute left-4 top-3 text-muted">
              {dodges >= ESCAPES ? "It gave up. Go on." : dodges > 0 ? `Escaped ${dodges} time${dodges > 1 ? "s" : ""}` : "Try to unsubscribe"}
            </span>
            <button
              ref={unsub}
              type="button"
              onPointerEnter={flee}
              onClick={unsubscribe}
              className="nf-unsub btn btn-ghost btn-sm bg-bg"
              style={{ transform: `translate(${dodge.x}px, ${dodge.y}px) rotate(${dodges % 2 ? -4 : 3}deg)` }}
            >
              {dodges >= ESCAPES ? "Okay fine, click me" : "Unsubscribe from this page"}
            </button>
          </div>
        </div>

        {/* The bounce notice, as a mail client would show it. */}
        <div className="relative">
          <div className="nf-stamp" aria-hidden="true">
            Return to sender
          </div>
          <article className="nf-card overflow-clip rounded-[1.75rem] border border-line bg-raised" aria-label="Delivery failure report">
            <div className="flex items-center gap-1.5 border-b border-line bg-surface px-5 py-3" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-danger" />
              <span className="h-3 w-3 rounded-full bg-lime" />
              <span className="h-3 w-3 rounded-full bg-line" />
              <span className="mono ml-auto text-xs text-muted">Inbox · 1 unread · 0 useful</span>
            </div>
            <dl className="mono grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1.5 border-b border-line px-5 py-4 text-[0.82rem]">
              <dt className="text-muted">From</dt>
              <dd className="truncate">Mail Delivery Subsystem</dd>
              <dt className="text-muted">To</dt>
              <dd>you (hi)</dd>
              <dt className="text-muted">Subject</dt>
              <dd className="break-all font-semibold">Undeliverable: {path}</dd>
            </dl>
            <div className="px-5 py-5">
              <p className="font-medium">Your request could not be delivered to the following page:</p>
              <p className="mono mt-2 break-all rounded-lg bg-surface px-3 py-2 text-[0.85rem]">{pathname}</p>
              <div className="mono mt-5 min-h-[9.5rem] space-y-2 text-[0.82rem] leading-relaxed" aria-live="off">
                {report.map((line, i) => (
                  <p key={i} className={typed[i] === undefined ? "invisible" : ""}>
                    <span className="text-muted">› </span>
                    {typed[i] ?? line}
                    {typed[i] !== undefined && typed[i].length < line.length && <span className="nf-caret" />}
                  </p>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-px overflow-clip rounded-xl border border-line bg-line text-center">
                {[
                  ["100%", "Open rate"],
                  ["100%", "Click rate"],
                  ["0%", "Got what they came for"],
                ].map(([v, l]) => (
                  <div key={l} className="bg-raised px-2 py-3">
                    <p className="font-display text-2xl font-semibold">{v}</p>
                    <p className="text-[0.75rem] leading-tight text-muted">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </main>

      <footer className="wrap mono relative z-10 flex flex-wrap justify-between gap-2 pb-8 text-muted">
        <span>Error 404 · Reported to absolutely nobody</span>
        <span>The emails on the home page, on the other hand, always arrive.</span>
      </footer>
    </div>
  );
}
