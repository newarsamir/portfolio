import type { ReactNode } from "react";
import About from "@/components/About";
import Anatomy from "@/components/Anatomy";
import BrandStrip from "@/components/BrandStrip";
import CaseStudies from "@/components/CaseStudies";
import { SectionList } from "@/components/cms/SiteProvider";
import Counters from "@/components/Counters";
import AiGallery from "@/components/AiGallery";
import Faq from "@/components/Faq";
import HireNudge from "@/components/HireNudge";
import Hero from "@/components/Hero";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Showcase from "@/components/Showcase";
import Testimonials from "@/components/Testimonials";
import * as Inbox from "@/components/x";
import * as Postcard from "@/components/v3";
import * as Apple from "@/components/apple";
import { getCaseStudies } from "@/lib/case-studies";
import { getContent, getLayouts } from "@/lib/content";
import { getGalleryItems } from "@/lib/gallery";
import { getSettings } from "@/lib/settings";
import { getShowcaseItems } from "@/lib/showcase";
import { siteUrl } from "@/lib/url";
import { isVideoSrc } from "@/lib/media";
import type { VariantId } from "@/lib/variants";

/** The home page in any of the designs. Same content, same section order and visibility. */
export default async function Home({ variant }: { variant: VariantId }) {
  const settings = await getSettings();
  const site = await getContent();
  const cases = (await getCaseStudies()).map(({ id: _id, sortOrder: _sortOrder, ...c }) => c);
  const showcase = await getShowcaseItems();
  const gallery = await getGalleryItems();
  const hidden = (await getLayouts()).home.hidden;
  const url = siteUrl();
  const video = settings.heroVideoUrl;
  const available = settings.availableForWork;

  // Sections every design shares.
  const shared = {
    brands: <BrandStrip />,
    anatomy: <Anatomy />,
    testimonials: <Testimonials />,
    gallery: <AiGallery items={gallery} />,
  };

  const designs: Record<VariantId, Record<string, ReactNode>> = {
    classic: {
      ...shared,
      hero: <Hero videoUrl={video} />,
      counters: <Counters />,
      showcase: <Showcase items={showcase} />,
      cases: <CaseStudies items={cases} />,
      nudge: <HireNudge available={available} />,
      about: <About />,
      process: <Process />,
      services: <Services />,
      faq: <Faq />,
    },
    inbox: {
      ...shared,
      hero: <Inbox.InboxHero videoUrl={video} />,
      counters: <Inbox.CountersX />,
      showcase: <Inbox.ShowcaseX items={showcase} />,
      cases: <Inbox.CaseReceipts items={cases} />,
      nudge: <Inbox.NudgeX available={available} />,
      about: <Inbox.AboutX />,
      process: <Inbox.ProcessFlow />,
      services: <Inbox.ServicesClient />,
      testimonials: <Inbox.RepliesX />,
      faq: <Inbox.FaqThread />,
    },
    postcard: {
      ...shared,
      hero: <Postcard.HeroCard videoUrl={video} available={available} cards={showcase.map((s) => s.src).filter((src) => !isVideoSrc(src))} />,
      counters: <Postcard.StatLine />,
      showcase: <Postcard.PostcardDeck items={showcase} />,
      cases: <Postcard.CaseList items={cases} />,
      nudge: <Postcard.NoteNudge available={available} />,
      about: <Postcard.AboutPolaroid />,
      process: <Postcard.ProcessRoute />,
      services: <Postcard.ServiceEnvelopes />,
      faq: <Postcard.FaqLight />,
    },
    apple: {
      ...shared,
      hero: <Apple.AppleHero videoUrl={video} />,
      counters: <Apple.AppleHighlights />,
      showcase: <Apple.AppleGallery items={showcase} />,
      cases: <Apple.AppleCases items={cases} />,
      nudge: <Apple.AppleNudge available={available} />,
      about: <Apple.AppleAbout />,
      process: <Apple.AppleProcess />,
      services: <Apple.AppleServices />,
      testimonials: <Apple.AppleQuotes />,
      faq: <Apple.AppleFaq />,
    },
  };

  // Hidden sections aren't rendered at all, so their text never reaches the browser.
  const sections = Object.fromEntries(Object.entries(designs[variant]).filter(([id]) => !hidden.includes(id)));

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* Order and visibility are set in /admin (Pages). "Anatomy" starts hidden. */}
      <SectionList page="home" nodes={sections} />
      {variant === "inbox" && <Inbox.FunnelRail />}
    </>
  );
}
