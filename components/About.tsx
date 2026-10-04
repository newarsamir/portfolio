import Image from "next/image";
import { site } from "@/content/site";
import { MaskReveal, Reveal, SplitHeading } from "./Reveal";
import Parallax from "./Parallax";
import SectionRule from "./SectionRule";

export default function About() {
  const { about } = site;
  return (
    <section id="about" className="section" aria-labelledby="about-h">
      <div className="wrap">
        <SectionRule label="About" note={site.location} />
      </div>
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          {/* The card stays in view while the story scrolls past, tilting as it goes. */}
          <div className="lg:sticky lg:top-28">
          <Parallax y={0} rotate={2.5} trigger="#about">
          <MaskReveal className="aspect-[4/5] w-full max-w-[30rem] rounded-2xl bg-surface lg:max-w-[22rem] shadow-[0_40px_80px_-40px_oklch(20%_0.02_80/0.45)]">
            {about.portrait ? (
              <Image
                src={about.portrait}
                alt={about.portraitAlt}
                width={960}
                height={1200}
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col justify-between border border-dashed border-muted/60 p-6 [border-radius:inherit]">
                <span className="mono text-muted">Portrait placeholder</span>
                <svg viewBox="0 0 200 200" className="mx-auto w-2/3 text-line" aria-hidden="true">
                  <circle cx="100" cy="74" r="38" fill="currentColor" />
                  <path d="M24 200c6-52 38-78 76-78s70 26 76 78Z" fill="currentColor" />
                </svg>
                <span className="mono text-muted">Add /public/portrait.webp, 4:5</span>
              </div>
            )}
          </MaskReveal>
          </Parallax>
          <p className="mono mt-4 text-muted">
            {site.name}, {site.location}
          </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <SplitHeading id="about-h" className="display-lg">
            {about.heading}
          </SplitHeading>
          <Reveal variant="stagger" className="mt-9 max-w-[62ch] space-y-5 text-lg leading-relaxed text-muted md:text-xl">
            {about.story.map((p, i) => (
              <p key={i} className={i === 0 ? "text-ink" : undefined}>
                {p}
              </p>
            ))}
          </Reveal>

          <h3 className="mono mt-14 font-normal tracking-normal text-muted [font-family:var(--font-mono)]">
            {about.toolsHeading}
          </h3>
          <Reveal as="ul" variant="stagger" className="mt-4 border-t border-line">
            {about.tools.map((t) => (
              <li
                key={t.name}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-4"
              >
                <span className="font-display text-2xl font-semibold">{t.name}</span>
                <span className="text-muted">{t.use}</span>
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
