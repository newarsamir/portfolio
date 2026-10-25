"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { parseVideo } from "@/lib/video";
import AnchorLink from "../AnchorLink";
import { useSite } from "../cms/SiteProvider";
import HeroStory from "../HeroStory";
import HeroVideo, { type HeroVideoHandle } from "../HeroVideo";

function posterFor(url: string, filePoster: string): string | undefined {
  const v = parseVideo(url);
  if (v?.kind === "youtube") return `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
  if (v?.kind === "file") return filePoster;
  return undefined;
}

/** A product-page hero: small eyebrow, one headline, a calm line, two actions, and the film in a rounded frame. */
export default function AppleHero({ videoUrl }: { videoUrl: string }) {
  const site = useSite();
  const h = site.hero;
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HeroVideoHandle>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  // Play while at least half the film is on screen.
  useEffect(() => {
    const el = frame.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(([e]) => (e.intersectionRatio > 0.5 ? video.current?.play() : video.current?.pause()), {
      threshold: [0, 0.5, 1],
    });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.fromTo(
          frame.current,
          { scale: 0.92 },
          { scale: 1, ease: "none", scrollTrigger: { trigger: frame.current, start: "top bottom", end: "top 25%", scrub: true } },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="home" className="apl-hero" aria-labelledby="apl-hero-h">
      <div className="apl-wrap apl-center">
        <p className="apl-eyebrow load-fade" style={{ ["--d" as string]: "0.05s" }}>
          {h.eyebrow}
        </p>
        <h1 id="apl-hero-h" className="apl-h1 load-fade" style={{ ["--d" as string]: "0.15s" }}>
          {h.headline}
        </h1>
        <p className="apl-lead load-fade" style={{ ["--d" as string]: "0.3s" }}>
          {h.sub}
        </p>
        <div className="apl-actions load-fade" style={{ ["--d" as string]: "0.45s" }}>
          <AnchorLink to="work" className="apl-pill">
            {h.primary}
          </AnchorLink>
          <Link href="/contact" className="apl-more">
            {h.secondary}
          </Link>
        </div>
      </div>
      <div className="apl-wide">
        <div ref={frame} className="apl-film load-opacity" style={{ ["--d" as string]: "0.6s" }}>
          {videoUrl === "story" ? (
            <HeroStory ref={video} reduced={reduced} />
          ) : (
            <HeroVideo
              ref={video}
              url={videoUrl}
              poster={posterFor(videoUrl, site.defaults.heroPoster)}
              title={`${site.name} showreel`}
              controls={reduced}
            />
          )}
        </div>
      </div>
    </section>
  );
}
