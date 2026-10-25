"use client";

import { fill } from "@/lib/cms";
import CopyEmail from "./CopyEmail";
import { useSite } from "./cms/SiteProvider";

/** A headline whose words rise in one after another (the .w animation). */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden="true">
          <span className="w">
            <span style={{ ["--i" as string]: i }}>{w}</span>
          </span>{" "}
        </span>
      ))}
    </>
  );
}

/** Header of the /work page. */
export function WorkHeader({ count }: { count: number }) {
  const page = useSite().workPage;
  return (
    <section className="wrap pb-16 pt-[clamp(7rem,14vw,11rem)]" aria-labelledby="work-h">
      <p className="mono load-fade text-muted" style={{ ["--d" as string]: "0.05s" }}>
        {fill(page.note, count).replace(/^(\d)\b/, "0$1")}
      </p>
      <h1
        id="work-h"
        className="mt-4 font-display text-[clamp(3.5rem,13vw,12rem)] font-semibold leading-[0.95] tracking-[-0.03em]"
        aria-label={page.heading}
      >
        <Words text={page.heading} />
      </h1>
      <p className="load-fade mt-6 max-w-[46ch] text-lg text-muted md:text-xl" style={{ ["--d" as string]: "0.5s" }}>
        {page.sub}
      </p>
    </section>
  );
}

export function WorkEmpty() {
  return (
    <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">{useSite().workPage.empty}</p>
  );
}

/** Left column of the /contact page. */
/** The contact form inside a "new message" window. */
export function ComposeWindow({ children }: { children: React.ReactNode }) {
  const site = useSite();
  const c = site.contact;
  return (
    <div className="cw">
      <div className="cw-bar">
        <span className="vx-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="mono">{c.composeTitle}</span>
        <span />
      </div>
      <dl className="cw-rows">
        <div className="cw-row">
          <dt className="mono">{c.toLabel}</dt>
          <dd>
            <span className="cw-chip">
              <span className="cw-chip-avatar" aria-hidden="true">
                {site.name.slice(0, 1).toUpperCase()}
              </span>
              {site.email}
            </span>
          </dd>
        </div>
        <div className="cw-row">
          <dt className="mono">{c.fromLabel}</dt>
          <dd className="text-muted">{c.fromValue}</dd>
        </div>
      </dl>
      <div className="cw-body">{children}</div>
    </div>
  );
}

export function ContactIntro() {
  const contact = useSite().contact;
  return (
    <>
      <h1 id="contact-h" className="x-display cw-h1" aria-label={contact.headline}>
        <Words text={contact.headline} />
      </h1>
      <p className="load-fade mt-6 max-w-[42ch] text-lg text-muted md:text-xl" style={{ ["--d" as string]: "0.7s" }}>
        {contact.sub}
      </p>
      <div className="load-fade mt-9" style={{ ["--d" as string]: "0.85s" }}>
        <p className="mono mb-3 text-muted">{contact.copyHint}</p>
        <CopyEmail className="text-lg" />
      </div>
    </>
  );
}
