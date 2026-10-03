import type { Metadata } from "next";
import FinalCta from "@/components/FinalCta";
import WorkIndex from "@/components/WorkIndex";
import { site } from "@/content/site";
import { getCaseStudies } from "@/lib/case-studies";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Case studies",
  description: `Email design case studies by ${site.name}: the brief, the decisions and what changed after.`,
  alternates: { canonical: "/work" },
};

export default async function WorkPage() {
  const items = await getCaseStudies();
  const words = "Case studies".split(" ");
  return (
    <>
      <section className="wrap pb-16 pt-[clamp(7rem,14vw,11rem)]" aria-labelledby="work-h">
        <p className="mono load-fade text-muted" style={{ ["--d" as string]: "0.05s" }}>
          {String(items.length).padStart(2, "0")} projects, brief to send
        </p>
        <h1 id="work-h" className="mt-4 font-display text-[clamp(3.5rem,13vw,12rem)] font-semibold leading-[0.95] tracking-[-0.03em]" aria-label="Case studies">
          {words.map((w, i) => (
            <span key={i} aria-hidden="true">
              <span className="w">
                <span style={{ ["--i" as string]: i }}>{w}</span>
              </span>{" "}
            </span>
          ))}
        </h1>
        <p className="load-fade mt-6 max-w-[46ch] text-lg text-muted md:text-xl" style={{ ["--d" as string]: "0.5s" }}>
          {site.caseStudies.sub}
        </p>
      </section>

      <section className="wrap load-fade" style={{ ["--d" as string]: "0.65s" }} aria-label="All case studies">
        {items.length > 0 ? (
          <WorkIndex items={items.map(({ id: _id, sortOrder: _sortOrder, ...c }) => c)} />
        ) : (
          <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
            Case studies are on their way. The work section on the home page has the emails in the meantime.
          </p>
        )}
      </section>

      <FinalCta />
    </>
  );
}
