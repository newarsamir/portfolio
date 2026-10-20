import type { Metadata } from "next";
import { Editable } from "@/components/cms/SiteProvider";
import { WorkEmpty, WorkHeader } from "@/components/PageIntro";
import WorkIndex from "@/components/WorkIndex";
import { getCaseStudies } from "@/lib/case-studies";
import { getContent } from "@/lib/content";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getContent();
  return {
    title: site.workPage.heading,
    description: `Email design case studies by ${site.name}: the brief, the decisions and what changed after.`,
    alternates: { canonical: "/work" },
  };
}

export default async function WorkPage() {
  const items = await getCaseStudies();
  return (
    <Editable id="workHeader">
      <WorkHeader count={items.length} />

      <section className="wrap load-fade" style={{ ["--d" as string]: "0.65s" }} aria-label="All case studies">
        {items.length > 0 ? <WorkIndex items={items.map(({ id: _id, sortOrder: _sortOrder, ...c }) => c)} /> : <WorkEmpty />}
      </section>
    </Editable>
  );
}
