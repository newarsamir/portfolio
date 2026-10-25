"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";
import { isRemote } from "@/lib/images";
import { useSite } from "../cms/SiteProvider";
import LocalTime from "../LocalTime";

/**
 * "Repeat": the about section reads like the end of a good email. The story
 * lights up word by word as you scroll; beside it sits the signature, and
 * the tools are the attachments.
 */
export default function AboutX() {
  const site = useSite();
  const a = site.about;
  const root = useRef<HTMLElement>(null);
  const story = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = new SplitText(story.current!.querySelectorAll("p"), { type: "words" });
        gsap.fromTo(
          split.words,
          { opacity: 0.16 },
          {
            opacity: 1,
            stagger: 0.04,
            ease: "none",
            scrollTrigger: { trigger: story.current, start: "top 75%", end: "bottom 45%", scrub: true },
          },
        );
        return () => split.revert();
      });
    },
    { scope: root, dependencies: [a.story.join("|")] },
  );

  const socials = site.socials.filter((s) => s.href && s.href !== "#");

  return (
    <section ref={root} id="about" className="ax" aria-labelledby="ax-h" data-stage="4">
      <div className="wrap ax-grid">
        <div>
          <p className="x-label">
            {a.label} · {site.location}
          </p>
          <h2 id="ax-h" className="x-display ax-h2">
            {a.heading}
          </h2>
          <div ref={story} className="ax-story">
            {a.story.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {a.tools.length > 0 && (
            <div className="ax-tools">
              <p className="x-label">{a.toolsHeading}</p>
              <ul className="ax-attachments">
                {a.tools.map((t) => (
                  <li key={t.name} className="ax-file">
                    <span className="ax-file-icon" aria-hidden="true">
                      {t.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{t.name}</span>
                      <span className="block truncate text-sm text-muted">{t.use}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="ax-sig-wrap" aria-label="Signature">
          <div className="ax-sig">
            <div className="ax-portrait">
              {a.portrait ? (
                <Image
                  src={a.portrait}
                  alt={a.portraitAlt}
                  width={720}
                  height={900}
                  sizes="(min-width: 1024px) 26rem, 90vw"
                  unoptimized={isRemote(a.portrait)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full place-items-center font-display text-7xl font-bold">{site.name.slice(0, 1)}</span>
              )}
            </div>
            <p className="ax-signoff">{a.signOff}</p>
            <p className="x-display ax-name">{site.name}</p>
            <p className="text-muted">{site.title}</p>
            <dl className="ax-meta mono">
              <div>
                <dt>{a.basedIn}</dt>
                <dd>{site.location}</dd>
              </div>
              <div>
                <dt>{site.footer.timeLabel}</dt>
                <dd>
                  <LocalTime />
                </dd>
              </div>
              <div>
                <dt>{a.emailLabel}</dt>
                <dd>
                  <a href={`mailto:${site.email}`} className="link">
                    {site.email}
                  </a>
                </dd>
              </div>
            </dl>
            {socials.length > 0 && (
              <ul className="ax-socials">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer me" className="ax-chip x-press">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
