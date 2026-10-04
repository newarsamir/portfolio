"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { ArrowSwap, RollText } from "./RollText";

const QUIPS = [
  "Like a cart abandoned at checkout, this page left without saying goodbye.",
  "Not in Primary. Not in Promotions. Not even in Spam. It's just gone.",
  "Even a 'LAST CHANCE: 50% off' subject line couldn't bring this page back.",
  "Somewhere a CFO is asking why this link has an ROI of exactly zero.",
  "This URL has the retention of a welcome flow with no email two.",
  "We A/B tested this page. Both versions were missing.",
];

/** A quiet 404: one number, one line of revenue-flavored sarcasm, one way home. */
export default function NotFoundScene() {
  const [quip, setQuip] = useState(0);
  // Filled in after mount so the server and browser markup match.
  const [path, setPath] = useState("");

  useEffect(() => {
    setPath(window.location.pathname);
    const id = window.setInterval(() => setQuip((q) => (q + 1) % QUIPS.length), 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="wrap grid min-h-svh place-items-center py-24">
      <div className="nf-in w-full max-w-2xl text-center">
        <p className="mono text-muted">Error 404 · Unsubscribed from existence</p>
        <h1 className="mt-6 font-display text-[clamp(6rem,20vw,13rem)] font-semibold leading-[0.85] tracking-[-0.05em]">
          4<span className="text-accent-fg">0</span>4
        </h1>
        <p className="mt-8 font-display text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold leading-tight">
          This page has a 0% conversion rate.
        </p>
        <p key={quip} className="blur-swap mx-auto mt-4 min-h-[3.5rem] max-w-[40ch] text-lg text-muted" aria-live="polite">
          {QUIPS[quip]}
        </p>
        {path && (
          <p className="mono mx-auto mt-2 max-w-full truncate text-[0.8rem] text-muted">
            Undeliverable: <span className="text-ink">{path}</span>
          </p>
        )}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn btn-lime">
            <RollText text="Back to the home page" />
            <ArrowSwap />
          </Link>
          <Link href="/work" className="btn btn-ghost">
            <RollText text="See the work" />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => toast.info("The intern has been notified. The intern is also me, and I've added it to the backlog.", "Blame received")}
          className="mono mt-10 text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
        >
          Blame the intern
        </button>
      </div>
    </main>
  );
}
