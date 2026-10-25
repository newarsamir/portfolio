"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { parseVideo } from "@/lib/video";
import AnchorLink from "../AnchorLink";
import { useSite } from "../cms/SiteProvider";
import HeroStory from "../HeroStory";
import HeroVideo, { type HeroVideoHandle } from "../HeroVideo";
import LocalTime from "../LocalTime";
import Magnetic from "../Magnetic";
import { ArrowSwap, RollText } from "../RollText";

function posterFor(url: string, filePoster: string): string | undefined {
  const v = parseVideo(url);
  if (v?.kind === "youtube") return `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
  if (v?.kind === "file") return filePoster;
  return undefined;
}

/**
 * The hero is an inbox. One unread email (the headline) sits above the
 * competition's tired subject lines, and its video attachment opens into the
 * full-screen film as you scroll, like opening the email.
 */
export default function InboxHero({ videoUrl }: { videoUrl: string }) {
  const site = useSite();
  const h = site.hero;
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLDivElement>(null);
  const attachment = useRef<HTMLButtonElement>(null);
  const video = useRef<HeroVideoHandle>(null);
  const [reduced, setReduced] = useState(false);
  // Reduced motion: the attachment opens with a click instead of a scroll.
  const [open, setOpen] = useState(false);

  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const filmEl = film.current!;
        const att = attachment.current!;
        const stageEl = stage.current!;

        // Clip the full-screen film down to the attachment thumbnail, then open it.
        const clipFor = (target: Element, radius: number) => () => {
          const f = filmEl.getBoundingClientRect();
          const t = target.getBoundingClientRect();
          return `inset(${t.top - f.top}px ${f.right - t.right}px ${f.bottom - t.bottom}px ${t.left - f.left}px round ${radius}px)`;
        };

        let full = false;
        let visible = true;
        const sync = () => {
          if (full && visible && !document.hidden) video.current?.play();
          else video.current?.pause();
        };

        gsap.set(filmEl, { clipPath: clipFor(att, 18)(), autoAlpha: 1 });
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stageEl,
            // On phones the inbox is taller than the screen: show all of it, then open.
            start: "bottom bottom",
            end: "+=150%",
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (st) => {
              const now = st.progress > 0.92;
              if (now !== full) {
                full = now;
                filmEl.dataset.open = String(now);
                sync();
              }
            },
            onToggle: (st) => {
              visible = st.isActive || st.progress >= 1;
              sync();
            },
          },
        });
        tl.to("[data-ih-copy]", { autoAlpha: 0, filter: "blur(10px)", scale: 0.96, duration: 0.45 }, 0)
          .to("[data-ih-noise]", { autoAlpha: 0, yPercent: 40, stagger: 0.04, duration: 0.3 }, 0)
          .to("[data-ih-chrome]", { autoAlpha: 0, duration: 0.25 }, 0)
          .fromTo(filmEl, { clipPath: clipFor(att, 18) }, { clipPath: clipFor(stageEl, 0), duration: 1, ease: "power2.inOut" }, 0.05);

        // Keep playing past the pin while the film is still on screen.
        const out = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          onLeave: () => {
            visible = false;
            sync();
          },
          onEnterBack: () => {
            visible = true;
            sync();
          },
        });
        const onVis = () => sync();
        document.addEventListener("visibilitychange", onVis);
        return () => {
          out.kill();
          document.removeEventListener("visibilitychange", onVis);
          video.current?.pause();
        };
      });
    },
    { scope: root },
  );

  const words = h.headline.split(" ");
  const noise = h.noise.filter((n) => n.subject.trim());

  return (
    <section ref={root} id="home" aria-label="Introduction" data-stage="0" className="ih">
      <div ref={stage} className="ih-stage">
        <div className="wrap ih-inner">
          {/* Inbox chrome */}
          <div data-ih-chrome>
          <div className="ih-chrome load-fade" style={{ ["--d" as string]: "0.05s" }}>
            <span className="mono flex items-center gap-2">
              <span className="ih-dot" aria-hidden="true" />
              {h.inboxLabel} <span className="text-muted">· {h.unreadNote}</span>
            </span>
            <span className="ih-search mono hidden md:inline-flex" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              {h.search}
            </span>
            <span className="mono text-muted">
              <LocalTime />
            </span>
          </div>
          </div>

          {/* The unread email */}
          <article className="ih-mail" aria-labelledby="ih-h">
            <div data-ih-copy className="ih-copy">
              <p className="ih-from load-fade" style={{ ["--d" as string]: "0.1s" }}>
                <span className="ih-avatar" aria-hidden="true">
                  {site.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="font-semibold">{site.name}</span>
                <span className="mono truncate text-muted">&lt;{site.email}&gt;</span>
                <span className="ih-tag mono">{h.eyebrow}</span>
              </p>
              <h1 id="ih-h" className="x-display ih-h1" aria-label={h.headline}>
                {words.map((w, i) => (
                  <span key={i} aria-hidden="true">
                    <span className="w">
                      <span style={{ ["--i" as string]: i }}>{w}</span>
                    </span>{" "}
                  </span>
                ))}
              </h1>
              <div className="ih-foot">
                <p className="load-fade ih-sub" style={{ ["--d" as string]: "0.8s" }}>
                  {h.sub}
                </p>
                <div className="load-fade flex flex-wrap items-center gap-3" style={{ ["--d" as string]: "0.95s" }}>
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
              </div>
            </div>

            <button
              ref={attachment}
              type="button"
              className="ih-attach load-opacity"
              style={{ ["--d" as string]: "1.05s" }}
              onClick={() => {
                if (!reduced) {
                  // Same as scrolling: jump to the open state.
                  const el = root.current;
                  const pinAt = Math.max(0, (stage.current?.offsetHeight ?? 0) - window.innerHeight);
                  if (el) window.scrollTo({ top: el.offsetTop + pinAt + window.innerHeight * 1.5, behavior: "smooth" });
                  return;
                }
                setOpen(true);
                video.current?.play();
              }}
            >
              <span className="ih-attach-thumb" aria-hidden="true" />
              <span className="ih-attach-meta">
                <span className="ih-play" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M3 1.8v8.4L10 6z" fill="currentColor" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{h.attachment}</span>
                  <span className="mono block text-muted">{h.openHint}</span>
                </span>
              </span>
            </button>
          </article>

          {/* The competition */}
          {noise.length > 0 && (
            <ul className="ih-noise" aria-label="Other emails in the inbox">
              {noise.map((n, i) => (
                <li key={i} data-ih-noise className="ih-li">
                  <span className="ih-row load-fade" style={{ ["--d" as string]: `${1.1 + i * 0.06}s` }}>
                    <span className="ih-row-dot" aria-hidden="true" />
                    <span className="ih-row-from truncate">{n.from}</span>
                    <span className="ih-row-subject truncate">{n.subject}</span>
                    <span className="mono ih-row-time">{n.time}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* The film. Clipped to the attachment, opened by scrolling. */}
        <div
          ref={film}
          className="ih-film"
          data-open={reduced ? String(open) : undefined}
        >
          <div className="ih-film-box">
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
          {reduced && open && (
            <button type="button" className="btn btn-lime btn-sm ih-close" onClick={() => setOpen(false)}>
              Close
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
