import About from "@/components/About";
// Hidden for now, kept for later. Re-enable here and in the JSX below.
// import Anatomy from "@/components/Anatomy";
import BrandStrip from "@/components/BrandStrip";
import CaseStudies from "@/components/CaseStudies";
import Counters from "@/components/Counters";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import HireNudge from "@/components/HireNudge";
import Hero from "@/components/Hero";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Showcase from "@/components/Showcase";
import Testimonials from "@/components/Testimonials";
import { site } from "@/content/site";
import { getCaseStudies } from "@/lib/case-studies";
import { getSettings } from "@/lib/settings";
import { getShowcaseItems } from "@/lib/showcase";
import { siteUrl } from "@/lib/url";

export const revalidate = 60;

export default async function HomePage() {
  const settings = await getSettings();
  const cases = await getCaseStudies();
  const showcase = await getShowcaseItems();
  const url = siteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.title,
    description: site.seo.description,
    url,
    email: site.email.includes("your@") ? undefined : `mailto:${site.email}`,
    address: { "@type": "PostalAddress", addressLocality: site.location },
    knowsAbout: ["Email design", "Email marketing", "Figma", "Klaviyo", "Mailchimp", "Ecommerce"],
    sameAs: site.socials.map((s) => s.href).filter((h) => h && h !== "#"),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero videoUrl={settings.heroVideoUrl} />
      <BrandStrip items={settings.brands} />
      <Counters items={settings.counters} placeholder={settings.countersArePlaceholder} />
      <Showcase items={showcase} heading={settings.showcaseHeading} sub={settings.showcaseSub} />
      <CaseStudies items={cases.map(({ id: _id, sortOrder: _sortOrder, ...c }) => c)} />
      <HireNudge available={settings.availableForWork} />
      <About />
      {/* "Anatomy of an email" is hidden for now. Uncomment to bring it back. */}
      {/* <Anatomy /> */}
      <Process />
      <Services />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
