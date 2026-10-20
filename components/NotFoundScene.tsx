"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { useSite } from "./cms/SiteProvider";
import { ArrowSwap, RollText } from "./RollText";

/** A quiet 404: one number, one line of revenue-flavored sarcasm, one way home. */
export default function NotFoundScene() {
  const copy = useSite().notFound;
  const quips = copy.quips.filter((q) => q.trim() !== "");
  const [quip, setQuip] = useState(0);
  // Filled in after mount so the server and browser markup match.
  const [path, setPath] = useState("");

  useEffect(() => {
    setPath(window.location.pathname);
    const id = window.setInterval(() => setQuip((q) => q + 1), 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="wrap grid min-h-svh place-items-center py-24">
      <div className="nf-in w-full max-w-2xl text-center">
        <p className="mono text-muted">{copy.eyebrow}</p>
        <h1 className="mt-6 font-display text-[clamp(6rem,20vw,13rem)] font-semibold leading-[0.85] tracking-[-0.05em]">
          4<span className="text-accent-fg">0</span>4
        </h1>
        <p className="mt-8 font-display text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold leading-tight">
          {copy.headline}
        </p>
        <p key={quip} className="blur-swap mx-auto mt-4 min-h-[3.5rem] max-w-[40ch] text-lg text-muted" aria-live="polite">
          {quips.length ? quips[quip % quips.length] : null}
        </p>
        {path && (
          <p className="mono mx-auto mt-2 max-w-full truncate text-[0.8rem] text-muted">
            {copy.undeliverable}: <span className="text-ink">{path}</span>
          </p>
        )}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn btn-lime">
            <RollText text={copy.primary} />
            <ArrowSwap />
          </Link>
          <Link href="/work" className="btn btn-ghost">
            <RollText text={copy.secondary} />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => toast.info(copy.blameBody, copy.blameTitle)}
          className="mono mt-10 text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
        >
          {copy.blame}
        </button>
      </div>
    </main>
  );
}
