import About from "@/components/v3/AboutPolaroid";
import Anatomy from "@/components/Anatomy";
import BrandStrip from "@/components/BrandStrip";
import CaseStudies from "@/components/v3/CaseList";
import { SectionList } from "@/components/cms/SiteProvider";
import Counters from "@/components/v3/StatLine";
import AiGallery from "@/components/AiGallery";
import Faq from "@/components/v3/FaqLight";
import HireNudge from "@/components/v3/NoteNudge";
import Hero from "@/components/v3/HeroCard";
import Process from "@/components/v3/ProcessRoute";
import Services from "@/components/v3/ServiceEnvelopes";
import Showcase from "@/components/v3/PostcardDeck";
import Testimonials from "@/components/Testimonials";
import { getCaseStudies } from "@/lib/case-studies";
import { getContent, getLayouts } from "@/lib/content";
import { getGalleryItems } from "@/lib/gallery";
import { getSettings } from "@/lib/settings";
import { getShowcaseItems } from "@/lib/showcase";
import { siteUrl } from "@/lib/url";

export const revalidate = 60;

export default async function HomePage() {
  const settings = await getSettings();
  const site = await getContent();
  const cases = await getCaseStudies();
  const showcase = await getShowcaseItems();
  const gallery = await getGalleryItems();
  const hidden = (await getLayouts()).home.hidden;
  const url = siteUrl();

  const all = {
    hero: <Hero videoUrl={settings.heroVideoUrl} available={settings.availableForWork} cards={showcase.map((s) => s.src)} />,
    brands: <BrandStrip />,
    counters: <Counters />,
    showcase: <Showcase items={showcase} />,
    cases: <CaseStudies items={cases.map(({ id: _id, sortOrder: _sortOrder, ...c }) => c)} />,
    nudge: <HireNudge available={settings.availableForWork} />,
    about: <About />,
    anatomy: <Anatomy />,
    process: <Process />,
    services: <Services />,
    testimonials: <Testimonials />,
    faq: <Faq />,
    gallery: <AiGallery items={gallery} />,
  };
  // Hidden sections aren't rendered at all, so their text never reaches the browser.
  const sections = Object.fromEntries(Object.entries(all).filter(([id]) => !hidden.includes(id)));

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
      {/* Order and visibility are set in /admin (Pages). "Anatomy" starts hidden. */}
      <SectionList page="home" nodes={sections} />
    </>
  );
}
