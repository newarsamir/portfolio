"use client";

import Image from "next/image";
import { isRemote } from "@/lib/images";
import { useSite } from "../cms/SiteProvider";

/** Portrait on one side, the story and the tools on the other, in a grey band. */
export default function AppleAbout() {
  const site = useSite();
  const a = site.about;
  return (
    <section id="about" className="apl-band" aria-labelledby="apl-about-h">
      <div className="apl-wrap apl-about">
        <div className="apl-portrait">
          {a.portrait && (
            <Image src={a.portrait} alt={a.portraitAlt} width={720} height={900} sizes="(min-width: 900px) 36vw, 90vw" unoptimized={isRemote(a.portrait)} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="apl-eyebrow">{a.label}</p>
          <h2 id="apl-about-h" className="apl-h2">
            {a.heading}
          </h2>
          <div className="apl-story">
            {a.story.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {a.tools.length > 0 && (
            <dl className="apl-tools">
              {a.tools.map((t) => (
                <div key={t.name}>
                  <dt>{t.name}</dt>
                  <dd>{t.use}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
