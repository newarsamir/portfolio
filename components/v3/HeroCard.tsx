"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { parseVideo } from "@/lib/video";
import AnchorLink from "../AnchorLink";
import { useSite } from "../cms/SiteProvider";
import HeroStory from "../HeroStory";
import HeroVideo, { type HeroVideoHandle } from "../HeroVideo";
import Magnetic from "../Magnetic";
import { ArrowSwap, RollText } from "../RollText";

function posterFor(url: string, filePoster: string): string | undefined {
  const v = parseVideo(url);
  if (v?.kind === "youtube") return `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
  if (v?.kind === "file") return filePoster;
  return undefined;
}

/**
 * A quiet hero: one light headline with a lime marker under its last words,
 * a short intro, two buttons, and a small fan of postcards. The film opens
 * in a pop-up instead of taking over the page.
 */
export default function HeroCard({ videoUrl, available, cards }: { videoUrl: string; available: boolean; cards: string[] }) {
  const site = useSite();
  const h = site.hero;
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HeroVideoHandle>(null);
  const [open, setOpen] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open) {
      d.showModal();
      const t = window.setTimeout(() => video.current?.play(), 250);
      return () => window.clearTimeout(t);
    }
    video.current?.pause();
    if (d.open) d.close();
  }, [open]);

  const words = h.headline.split(" ");
  const markFrom = Math.max(0, words.length - Math.max(0, Math.round(h.markWords)));
  const plain = words.slice(0, markFrom);
  const marked = words.slice(markFrom);
  const deck = cards.slice(0, 3);

  return (
    <section id="home" className="hc" aria-labelledby="hc-h">
      <div className="wrap hc-inner">
        <p className="hc-pill load-fade" style={{ ["--d" as string]: "0.05s" }}>
          <span className={`hc-dot ${available ? "pulse-dot" : ""}`} data-on={available} aria-hidden="true" />
          {h.eyebrow}
        </p>

        <h1 id="hc-h" className="hc-h1" aria-label={h.headline}>
          {plain.map((w, i) => (
            <span key={i} aria-hidden="true">
              <span className="w">
                <span style={{ ["--i" as string]: i }}>{w}</span>
              </span>{" "}
            </span>
          ))}
          {marked.length > 0 && (
            <span className="hc-mark" aria-hidden="true">
              {marked.map((w, j) => (
                <span key={j}>
                  <span className="w">
                    <span style={{ ["--i" as string]: plain.length + j }}>{w}</span>
                  </span>
                  {j < marked.length - 1 ? " " : ""}
                </span>
              ))}
              <svg className="hc-mark-line" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 15 C 60 7, 120 19, 180 11 S 270 8, 296 13" pathLength="1" />
              </svg>
            </span>
          )}
        </h1>

        <p className="hc-sub load-fade" style={{ ["--d" as string]: "0.75s" }}>
          {h.sub}
        </p>

        <div className="hc-ctas load-fade" style={{ ["--d" as string]: "0.9s" }}>
          <Magnetic>
            <AnchorLink to="work" className="btn btn-lime">
              <RollText text={h.primary} />
              <ArrowSwap size={16} />
            </AnchorLink>
          </Magnetic>
          <Magnetic>
            <Link href="/contact" className="btn btn-ghost">
              <RollText text={h.secondary} />
            </Link>
          </Magnetic>
        </div>
        <button type="button" className="hc-watch load-fade x-press" style={{ ["--d" as string]: "1.05s" }} onClick={() => setOpen(true)}>
          <span className="hc-play" aria-hidden="true">
            <svg width="10" height="10" viewBox="0 0 12 12">
              <path d="M3 1.8v8.4L10 6z" fill="currentColor" />
            </svg>
          </span>
          {h.watch}
        </button>

        {deck.length > 0 && (
          <div className="hc-deck load-opacity" style={{ ["--d" as string]: "1.1s" }} aria-hidden="true">
            {deck.map((src, i) => (
              <span key={src} className="hc-card" style={{ ["--n" as string]: i - (deck.length - 1) / 2 }}>
                <Image src={src} alt="" width={420} height={560} sizes="180px" unoptimized={/^https?:/.test(src)} className="hc-card-img" />
              </span>
            ))}
          </div>
        )}
      </div>

      <dialog
        ref={dialog}
        className="hc-film"
        aria-label={h.watch}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setOpen(false);
        }}
      >
        <div className="hc-film-box">
          {open &&
            (videoUrl === "story" ? (
              <HeroStory ref={video} reduced={reduced} />
            ) : (
              <HeroVideo
                ref={video}
                url={videoUrl}
                poster={posterFor(videoUrl, site.defaults.heroPoster)}
                title={`${site.name} showreel`}
                controls
              />
            ))}
        </div>
        <button type="button" className="hc-film-close x-press" onClick={() => setOpen(false)} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </dialog>
    </section>
  );
}
