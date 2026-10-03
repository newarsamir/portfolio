"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "@/lib/gsap";
import AnchorLink from "./AnchorLink";
import HeroVideo, { type HeroVideoHandle } from "./HeroVideo";
import Magnetic from "./Magnetic";
import { ArrowSwap, RollText } from "./RollText";
import { parseVideo } from "@/lib/video";

/** File videos use the poster from site.ts. YouTube brings its own thumbnail. */
function posterFor(url: string): string | undefined {
  const v = parseVideo(url);
  if (v?.kind === "youtube") return `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
  if (v?.kind === "file") return site.defaults.heroPoster;
  return undefined;
}

export default function Hero({ videoUrl }: { videoUrl: string }) {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HeroVideoHandle>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const pinEl = pin.current!;
        const frameEl = frame.current!;
        const copyEl = copy.current!;

        // 20% -> 80% of the viewport width on desktop, 60% -> 92% on mobile.
        // The frame is laid out at its final size, so only scale changes.
        const startScale = () => (window.innerWidth < 768 ? 60 / 92 : 20 / 80);
        const startY = () => {
          const h = pinEl.offsetHeight;
          const small = frameEl.offsetHeight * startScale();
          const gap = window.innerWidth < 768 ? 28 : 40;
          const top = copyEl.offsetTop + copyEl.offsetHeight + gap;
          // Keep the small player fully on screen on short viewports.
          const maxTop = h - small - 16;
          return Math.min(top, maxTop) + small / 2 - h / 2;
        };

        let playing = false;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: pinEl,
            start: "top top",
            end: "+=130%",
            pin: true,
            scrub: 0.5,
            invalidateOnRefresh: true,
            refreshPriority: 3,
            onUpdate(self) {
              const full = self.progress > 0.96;
              if (full && !playing) {
                playing = true;
                video.current?.play();
              } else if (!full && playing) {
                playing = false;
                video.current?.pause();
              }
            },
          },
        });

        tl.fromTo(
          frameEl,
          { scale: startScale, y: startY },
          { scale: 1, y: 0, duration: 1, ease: "power1.inOut" },
          0,
        ).to(copyEl, { autoAlpha: 0, y: -90, duration: 0.45 }, 0);

        return () => {
          video.current?.pause();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Re-measure once the web fonts have changed the headline height.
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  // Reduced motion: no pin, no autoplay. Mount the player with controls instead.
  useEffect(() => {
    if (!reduced) return;
    video.current?.play();
    const t = window.setTimeout(() => video.current?.pause(), 50);
    return () => window.clearTimeout(t);
  }, [reduced]);

  const words = site.hero.headline.split(" ");

  return (
    <section ref={root} id="home" aria-label="Introduction">
      <div ref={pin} className="hero-pin">
        <div ref={copy} className="hero-copy wrap">
          <p className="mono load-fade text-muted" style={{ ["--d" as string]: "0.05s" }}>
            {site.hero.eyebrow}
          </p>
          <h1 className="hero-h1 mt-5" aria-label={site.hero.headline}>
            {words.map((word, i) => (
              <span key={i} aria-hidden="true">
                <span className="w">
                  <span style={{ ["--i" as string]: i }}>{word}</span>
                </span>
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <p
            className="load-fade mt-6 max-w-[38rem] text-[1.0625rem] text-muted md:text-xl md:leading-snug"
            style={{ ["--d" as string]: "0.85s" }}
          >
            {site.hero.sub}
          </p>
          <div
            className="load-fade mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ ["--d" as string]: "1s" }}
          >
            <Magnetic>
              <AnchorLink to="work" className="btn btn-lime">
                <RollText text={site.hero.primary} />
                <ArrowSwap size={16} />
              </AnchorLink>
            </Magnetic>
            <Magnetic>
              <Link href="/contact" className="btn btn-ghost">
                <RollText text={site.hero.secondary} />
              </Link>
            </Magnetic>
          </div>
        </div>

        <div className="hero-stage">
        <div ref={frame} className="hero-frame">
          <div className="load-opacity h-full w-full" style={{ ["--d" as string]: "1.15s" }}>
            <HeroVideo
              ref={video}
              url={videoUrl}
              poster={posterFor(videoUrl)}
              title={`${site.name} showreel`}
              controls={reduced}
            />
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
