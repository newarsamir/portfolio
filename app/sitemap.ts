import type { MetadataRoute } from "next";
import { getCaseStudies } from "@/lib/case-studies";
import { siteUrl } from "@/lib/url";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const cases = await getCaseStudies();
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/work`, changeFrequency: "monthly", priority: 0.8 },
    ...cases.map((c) => ({ url: `${base}/work/${c.slug}`, changeFrequency: "yearly" as const, priority: 0.7 })),
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.7 },
  ];
}
