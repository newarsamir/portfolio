import Link from "next/link";
import { site } from "@/content/site";
import CopyEmail from "./CopyEmail";
import Magnetic from "./Magnetic";
import { Reveal, SplitHeading } from "./Reveal";
import { ArrowSwap, RollText } from "./RollText";
import { ArrowUpRight } from "./icons";
import SectionRule from "./SectionRule";
import Spotlight from "./Spotlight";
import VelocityMarquee from "./VelocityMarquee";

/** Circle of text spinning around a lime button. Speeds up on hover. */
function RotatingBadge() {
  const text = site.finalCta.badge;
  return (
    <Magnetic strength={0.5}>
      <Link
        href="/contact"
        className="badge relative grid h-40 w-40 place-items-center rounded-full md:h-52 md:w-52"
        aria-label={site.finalCta.button}
      >
        <svg viewBox="0 0 200 200" className="badge-ring absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <path id="badge-circle" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
          </defs>
          <text className="fill-ink font-mono text-[13.5px] uppercase tracking-[0.18em]">
            <textPath href="#badge-circle" textLength="500">
              {text}
            </textPath>
          </text>
        </svg>
        <span className="badge-core grid h-[58%] w-[58%] place-items-center rounded-full bg-lime text-on-lime shadow-[0_18px_40px_-14px_oklch(60%_0.2_125/0.8)]">
          <ArrowUpRight width={36} height={36} strokeWidth={1.8} />
        </span>
      </Link>
    </Magnetic>
  );
}

export default function FinalCta() {
  return (
    <Spotlight as="section" id="contact" className="section overflow-clip pb-[clamp(3rem,6vw,5rem)]" aria-labelledby="cta-h">
      <div className="wrap">
        <SectionRule label="Start a project" note={site.finalCta.eyebrow} />
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">
          <SplitHeading id="cta-h" className="display-xl max-w-[17ch]">
            {site.finalCta.headline}
          </SplitHeading>
          <Reveal variant="scale" className="justify-self-start lg:justify-self-end">
            <RotatingBadge />
          </Reveal>
        </div>
        <Reveal className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-6">
          <Magnetic strength={0.4}>
            <Link
              href="/contact"
              className="btn btn-lime min-h-[4.5rem] px-9 text-lg md:min-h-[5.25rem] md:px-12 md:text-2xl"
            >
              <RollText text={site.finalCta.button} />
              <ArrowSwap size={24} />
            </Link>
          </Magnetic>
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted">{site.finalCta.mini}</p>
            <CopyEmail />
          </div>
        </Reveal>
      </div>

      <div className="mt-[clamp(4rem,9vw,8rem)] border-y border-line">
        <VelocityMarquee words={site.finalCta.marquee} label={site.finalCta.marquee.join(", ")} />
      </div>
    </Spotlight>
  );
}
