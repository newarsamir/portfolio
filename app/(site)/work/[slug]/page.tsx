import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CountUp from "@/components/CountUp";
import EmailScroll from "@/components/EmailScroll";
import FinalCta from "@/components/FinalCta";
import { MaskReveal, Reveal, SplitHeading } from "@/components/Reveal";
import { ArrowSwap } from "@/components/RollText";
import SectionRule from "@/components/SectionRule";
import { site } from "@/content/site";
import { getCaseStudies, getCaseStudy } from "@/lib/case-studies";
import { siteUrl } from "@/lib/url";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const items = await getCaseStudies();
  return items.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCaseStudy(slug);
  if (!c) return { title: "Case study not found" };
  return {
    title: c.title,
    description: c.summary,
    alternates: { canonical: `/work/${c.slug}` },
    openGraph: { title: c.title, description: c.summary, type: "article" },
  };
}

const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const all = await getCaseStudies();
  const index = all.findIndex((c) => c.slug === slug);
  if (index < 0) notFound();
  const c = all[index];
  const next = all.length > 1 ? all[(index + 1) % all.length] : null;
  const words = c.title.split(" ");

  const story = (
    [
      ["The challenge", c.challenge],
      ["The approach", c.approach],
      ["The outcome", c.outcome],
    ] as const
  ).filter(([, body]) => body.trim());

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: c.title,
    description: c.summary,
    url: `${siteUrl()}/work/${c.slug}`,
    creator: { "@type": "Person", name: site.name },
    dateCreated: c.year || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <article aria-labelledby="case-h">
        <header className="wrap pt-[clamp(7rem,13vw,10rem)]">
          <Link href="/work" className="mono load-fade inline-flex items-center gap-2 text-muted hover:text-ink" style={{ ["--d" as string]: "0s" }}>
            <span aria-hidden="true">←</span> All case studies
          </Link>
          <p className="mono load-fade mt-8 text-muted" style={{ ["--d" as string]: "0.05s" }}>
            Case study {String(index + 1).padStart(2, "0")} / {String(all.length).padStart(2, "0")}
          </p>
          <h1 id="case-h" className="display-xl mt-4 max-w-[20ch]" aria-label={c.title}>
            {words.map((w, i) => (
              <span key={i} aria-hidden="true">
                <span className="w">
                  <span style={{ ["--i" as string]: i }}>{w}</span>
                </span>{" "}
              </span>
            ))}
          </h1>
          <p className="load-fade mt-8 max-w-[52ch] text-lg text-muted md:text-2xl md:leading-snug" style={{ ["--d" as string]: "0.7s" }}>
            {c.summary}
          </p>

          <dl className="load-fade mt-12 grid grid-cols-2 border-t border-line md:grid-cols-4" style={{ ["--d" as string]: "0.85s" }}>
            {(
              [
                ["Client", c.client],
                ["Industry", c.industry],
                ["Year", c.year],
                ["Services", c.services.join(", ")],
              ] as const
            ).map(([k, v], i) => (
              <div key={k} className={`border-b border-line py-5 pr-4 ${i % 2 ? "pl-5 max-md:border-l" : ""} ${i > 0 ? "md:border-l md:pl-6" : ""}`}>
                <dt className="mono text-muted">{k}</dt>
                <dd className="mt-1.5 font-medium">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </header>

        {/* Cover: the email on a stage, unmasked by a lime panel. */}
        <div className="wrap mt-14">
          <MaskReveal className="rounded-[2rem] bg-surface">
            <div className="gridlines relative grid min-h-[min(80svh,46rem)] place-items-center overflow-clip px-6 py-14">
              <span className="absolute left-1/2 top-1/2 h-[60%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime opacity-40 blur-3xl" aria-hidden="true" />
              <div className="group relative">
                <EmailScroll
                  src={c.cover}
                  alt={`${c.client}: ${c.title}`}
                  phone
                  height="min(66svh, 38rem)"
                  duration="9s"
                  className="w-[min(20rem,72vw)]"
                />
                <p className="mono mt-5 text-center text-muted">Hover to read it top to bottom</p>
              </div>
            </div>
          </MaskReveal>
        </div>

        {c.metrics.length > 0 && (
          <section className="wrap section pb-0" aria-label="Results">
            <SectionRule label="Results" />
            <Reveal as="ul" variant="stagger" className="grid gap-px overflow-clip rounded-[1.5rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {c.metrics.map((m) => (
                <li key={m.label} className="bg-bg p-8 md:p-10">
                  <p className="font-display text-[clamp(3rem,7vw,6rem)] font-semibold leading-none tracking-[-0.02em] [font-variant-numeric:tabular-nums]">
                    <CountUp value={m.value} />
                  </p>
                  <p className="mt-4 max-w-[24ch] text-muted">{m.label}</p>
                </li>
              ))}
            </Reveal>
          </section>
        )}

        {story.length > 0 && (
          <section className="wrap section" aria-label="The story">
            <div className="grid gap-20">
              {story.map(([label, body], i) => (
                <div key={label} className="grid gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <div className="lg:sticky lg:top-28">
                      <p className="mono text-muted">{String(i + 1).padStart(2, "0")}</p>
                      <SplitHeading className="display-md mt-2">{label}</SplitHeading>
                    </div>
                  </div>
                  <Reveal variant="stagger" className="space-y-5 text-lg leading-relaxed text-muted md:text-xl lg:col-span-8 lg:col-start-5">
                    {paragraphs(body).map((p, j) => (
                      <p key={j} className={j === 0 ? "text-ink" : undefined}>
                        {p}
                      </p>
                    ))}
                  </Reveal>
                </div>
              ))}
            </div>
          </section>
        )}

        {c.gallery.length > 0 && (
          <section className="section pt-0" aria-label="The emails">
            <div className="wrap">
              <SectionRule label="The emails" note={`${c.gallery.length} designs, hover to scroll`} />
            </div>
            <Reveal variant="stagger" className="wrap grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {c.gallery.map((src, i) => (
                <figure key={src + i} className="group">
                  <EmailScroll
                    src={src}
                    alt={`${c.client}, email ${i + 1}`}
                    height="34rem"
                    className="overflow-clip rounded-[1.25rem] border border-line transition-transform duration-500 ease-out group-hover:-translate-y-2"
                  />
                  <figcaption className="mono mt-3 text-muted">
                    {String(i + 1).padStart(2, "0")} / {String(c.gallery.length).padStart(2, "0")}
                  </figcaption>
                </figure>
              ))}
            </Reveal>
          </section>
        )}

        {next && (
          <nav aria-label="Next case study" className="border-y border-line">
            <Link href={`/work/${next.slug}`} className="next-case group block py-[clamp(3rem,8vw,6rem)] transition-colors duration-500">
              <span className="wrap flex items-end justify-between gap-8">
                <span>
                  <span className="mono block opacity-70">Next case study</span>
                  <span className="mt-3 block max-w-[22ch] font-display text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.015em]">
                    {next.title}
                  </span>
                </span>
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-[1.5px] border-current md:h-24 md:w-24">
                  <ArrowSwap size={30} />
                </span>
              </span>
            </Link>
          </nav>
        )}
      </article>
      <FinalCta />
    </>
  );
}
