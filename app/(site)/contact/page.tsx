import type { Metadata } from "next";
import { Editable } from "@/components/cms/SiteProvider";
import ContactForm from "@/components/ContactForm";
import { ComposeWindow, ContactIntro } from "@/components/PageIntro";
import { getContent } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getContent();
  return {
    title: "Start a project",
    description: `Tell ${site.name} about your brand and the emails you need. Replies within two working days.`,
    alternates: { canonical: "/contact" },
  };
}

export default function ContactPage() {
  return (
    <Editable id="contact">
      <section className="wrap pb-24 pt-[clamp(7rem,14vw,11rem)]" aria-labelledby="contact-h">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <ContactIntro />
          </div>
          <div className="load-fade lg:col-span-7" style={{ ["--d" as string]: "0.5s" }}>
            <ComposeWindow>
              <ContactForm />
            </ComposeWindow>
          </div>
        </div>
      </section>
    </Editable>
  );
}
