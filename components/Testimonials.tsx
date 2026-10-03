import { site } from "@/content/site";
import { Reveal, SplitHeading } from "./Reveal";

/** Renders nothing until real testimonials exist in /content/site.ts. */
export default function Testimonials() {
  const items = site.testimonials;
  if (items.length === 0) return null;
  const [first, ...rest] = items;

  return (
    <section className="section" aria-labelledby="testimonials-h">
      <div className="wrap">
        <SplitHeading id="testimonials-h" className="display-md">
          What clients said, unprompted
        </SplitHeading>
        <Reveal as="figure" variant="slide" className="mt-12 border-l-4 border-lime pl-6 md:pl-10">
          <blockquote className="font-display text-[clamp(1.6rem,3.4vw,3rem)] font-medium leading-[1.12] tracking-tight">
            {first.quote}
          </blockquote>
          <figcaption className="mt-6 text-muted">
            {first.name}, {first.role}
          </figcaption>
        </Reveal>
        {rest.length > 0 && (
          <Reveal variant="stagger" className="mt-14 grid gap-x-12 gap-y-10 border-t border-line pt-10 md:grid-cols-2">
            {rest.map((t) => (
              <figure key={t.name}>
                <blockquote className="text-xl leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-4 text-muted">
                  {t.name}, {t.role}
                </figcaption>
              </figure>
            ))}
          </Reveal>
        )}
      </div>
    </section>
  );
}
