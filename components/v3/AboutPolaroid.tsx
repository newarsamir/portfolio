"use client";

import Image from "next/image";
import { isRemote } from "@/lib/images";
import { useSite } from "../cms/SiteProvider";

/** About: a taped-up polaroid, the story in a calm column, the tools as stickers. */
export default function AboutPolaroid() {
  const site = useSite();
  const a = site.about;
  return (
    <section id="about" className="ap" aria-labelledby="ap-h">
      <div className="wrap ap-grid">
        <figure className="ap-polaroid">
          <span className="ap-tape" aria-hidden="true" />
          <div className="ap-photo">
            {a.portrait ? (
              <Image
                src={a.portrait}
                alt={a.portraitAlt}
                width={720}
                height={900}
                sizes="(min-width: 1024px) 24rem, 80vw"
                unoptimized={isRemote(a.portrait)}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <figcaption className="ap-cap">
            <span>{a.caption}</span>
            <span className="mono text-muted">{site.location}</span>
          </figcaption>
        </figure>

        <div>
          <p className="v3-label">{a.label}</p>
          <h2 id="ap-h" className="v3-h2">
            {a.heading}
          </h2>
          <div className="ap-story">
            {a.story.map((p, i) => (
              <p key={i} className={i === 0 ? "ap-lead" : undefined}>
                {p}
              </p>
            ))}
          </div>
          {a.tools.length > 0 && (
            <>
              <p className="v3-label mt-10">{a.toolsHeading}</p>
              <ul className="ap-stickers">
                {a.tools.map((t, i) => (
                  <li key={t.name} className="ap-sticker" data-alt={i % 2 || undefined} style={{ ["--r" as string]: `${[-3, 2, -1.5, 3][i % 4]}deg` }} title={t.use}>
                    {t.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
