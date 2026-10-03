import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import CopyEmail from "@/components/CopyEmail";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Start a project",
  description: `Tell ${site.name} about your brand and the emails you need. Replies within two working days.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const words = site.contact.headline.split(" ");
  return (
    <section className="wrap pb-24 pt-[clamp(7rem,14vw,11rem)]" aria-labelledby="contact-h">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h1 id="contact-h" className="display-lg" aria-label={site.contact.headline}>
            {words.map((w, i) => (
              <span key={i} aria-hidden="true">
                <span className="w">
                  <span style={{ ["--i" as string]: i }}>{w}</span>
                </span>{" "}
              </span>
            ))}
          </h1>
          <p className="load-fade mt-6 max-w-[42ch] text-lg text-muted md:text-xl" style={{ ["--d" as string]: "0.7s" }}>
            {site.contact.sub}
          </p>
          <div className="load-fade mt-9" style={{ ["--d" as string]: "0.85s" }}>
            <p className="mono mb-3 text-muted">Prefer your own inbox? Click to copy.</p>
            <CopyEmail className="text-lg" />
          </div>
        </div>
        <div className="load-fade lg:col-span-7" style={{ ["--d" as string]: "0.5s" }}>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
