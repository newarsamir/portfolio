import Image from "next/image";
import { site } from "@/content/site";
import { Reveal, SplitHeading } from "./Reveal";
import SectionRule from "./SectionRule";

/**
 * The services as an index: one wide row per email type, with when it sends
 * and how many emails it usually is. On desktop a sample slides in on hover.
 */
export default function Services() {
  const items = site.services.items;
  return (
    <section className="section" aria-labelledby="services-h">
      <div className="wrap">
        <SectionRule label="Services" note={`${items.length} kinds of email`} />
        <div className="grid gap-6 lg:grid-cols-12">
          <SplitHeading id="services-h" className="display-lg lg:col-span-7">
            {site.services.heading}
          </SplitHeading>
          <Reveal className="self-end text-lg text-muted lg:col-span-5">
            <p className="max-w-[44ch]">{site.services.sub}</p>
          </Reveal>
        </div>

        <Reveal as="ul" variant="stagger" className="mt-14 border-t border-ink">
          {items.map((s) => (
            <li
              key={s.id}
              className="group relative grid gap-x-8 gap-y-3 border-b border-line py-8 transition-colors duration-300 hover:bg-surface md:grid-cols-12 md:py-10 lg:px-4"
            >
              <span
                className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-lime transition-transform duration-300 ease-out group-hover:scale-y-100"
                aria-hidden="true"
              />
              <h3 className="text-[clamp(1.75rem,3.2vw,2.75rem)] md:col-span-4">{s.title}</h3>
              <p className="max-w-[48ch] text-lg leading-relaxed text-muted md:col-span-5">{s.body}</p>
              <dl className="mono space-y-1.5 text-muted md:col-span-3 md:pt-2">
                <div>
                  <dt className="sr-only">When it sends</dt>
                  <dd className="text-ink">{s.when}</dd>
                </div>
                <div>
                  <dt className="sr-only">Size</dt>
                  <dd>{s.tag}</dd>
                </div>
              </dl>

              {/* Sample email, desktop hover only. */}
              <span
                className="pointer-events-none absolute right-[22%] top-1/2 z-10 hidden h-48 w-36 -translate-y-1/2 rotate-3 scale-90 overflow-clip rounded-lg border border-line opacity-0 shadow-[0_24px_48px_-20px_rgb(0_0_0/0.5)] transition-[opacity,transform] duration-300 ease-out group-hover:rotate-[-4deg] group-hover:scale-100 group-hover:opacity-100 lg:block"
                aria-hidden="true"
              >
                <Image src={s.image} alt="" width={288} height={384} sizes="144px" loading="lazy" className="h-full w-full object-cover object-top" />
              </span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
