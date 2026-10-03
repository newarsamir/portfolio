"use client";

import { useState } from "react";
import { site } from "@/content/site";
import { PlusIcon } from "./icons";
import { Reveal, SplitHeading } from "./Reveal";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section" aria-labelledby="faq-h">
      <div className="wrap grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SplitHeading id="faq-h" className="display-md lg:sticky lg:top-28">
            {site.faq.heading}
          </SplitHeading>
        </div>
        <Reveal variant="stagger" className="border-t border-line lg:col-span-8">
          {site.faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-b border-line">
                <h3 className="[font:inherit] [letter-spacing:inherit]">
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left text-xl font-medium leading-snug md:text-2xl"
                  >
                    {item.q}
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line transition-[transform,background-color,color] duration-300 ${
                        isOpen ? "rotate-45 bg-lime text-on-lime" : ""
                      }`}
                    >
                      <PlusIcon width={18} height={18} />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  className="faq-body"
                  data-open={isOpen}
                  inert={!isOpen}
                >
                  <div>
                    <p className="max-w-[62ch] pb-7 text-lg leading-relaxed text-muted">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
