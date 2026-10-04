import Link from "next/link";
import { site } from "@/content/site";
import Magnetic from "./Magnetic";
import { Reveal } from "./Reveal";
import { ArrowSwap, RollText } from "./RollText";

/** A short hire-me break halfway down the home page. */
export default function HireNudge({ available }: { available: boolean }) {
  const { nudge } = site;
  return (
    <section className="py-[clamp(2rem,5vw,4rem)]" aria-labelledby="nudge-h">
      <div className="wrap">
        <Reveal variant="scale">
          <div className="relative grid items-center gap-8 overflow-clip rounded-[2rem] bg-lime p-8 text-on-lime md:grid-cols-[1fr_auto] md:p-12 lg:p-14">
            <span
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[1.5px] border-on-lime/20"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border-[1.5px] border-on-lime/20"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="mono flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full bg-on-lime ${available ? "pulse-dot" : "opacity-40"}`} aria-hidden="true" />
                {available ? `${nudge.eyebrow} · Taking new projects` : nudge.eyebrow}
              </p>
              <h2 id="nudge-h" className="mt-4 max-w-[22ch] text-[clamp(1.75rem,3.4vw,3rem)]">
                {nudge.headline}
              </h2>
              <p className="mt-4 max-w-[56ch] text-lg leading-relaxed opacity-80">{nudge.body}</p>
            </div>
            <div className="relative flex flex-wrap items-center gap-3 md:flex-col md:items-stretch">
              <Magnetic strength={0.35}>
                <Link href="/contact" className="btn min-h-[3.75rem] bg-ink px-8 text-lg text-lime [--btn-fill:var(--bg)] hover:text-ink">
                  <RollText text={nudge.button} />
                  <ArrowSwap />
                </Link>
              </Magnetic>
              <a href={`mailto:${site.email}`} className="btn border-[1.5px] border-on-lime/40 text-on-lime [--btn-fill:var(--on-lime)] hover:text-lime">
                <RollText text={nudge.secondary} />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
