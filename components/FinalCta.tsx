import Link from "next/link";
import { site } from "@/content/site";
import CopyEmail from "./CopyEmail";
import Magnetic from "./Magnetic";
import { Reveal, SplitHeading } from "./Reveal";
import { ArrowUpRight } from "./icons";

export default function FinalCta() {
  return (
    <section id="contact" className="section pb-[clamp(4rem,8vw,7rem)]" aria-labelledby="cta-h">
      <div className="wrap">
        <SplitHeading id="cta-h" className="display-xl max-w-[14ch]">
          {site.finalCta.headline}
        </SplitHeading>
        <Reveal className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-6">
          <Magnetic strength={0.4}>
            <Link
              href="/contact"
              className="btn btn-lime min-h-[4.5rem] px-9 text-lg md:min-h-[5.25rem] md:px-12 md:text-2xl"
            >
              {site.finalCta.button}
              <ArrowUpRight width={24} height={24} />
            </Link>
          </Magnetic>
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted">{site.finalCta.mini}</p>
            <CopyEmail />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
