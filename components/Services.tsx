import { site } from "@/content/site";
import { Reveal, SplitHeading } from "./Reveal";

const byId = Object.fromEntries(site.services.items.map((s) => [s.id, s]));

function Tag({ children, className = "" }: { children: string; className?: string }) {
  return <p className={`mono inline-block rounded-full border px-3 py-1 ${className}`}>{children}</p>;
}

export default function Services() {
  const { welcome, campaigns, cart, post, templates } = byId;
  return (
    <section className="section" aria-labelledby="services-h">
      <div className="wrap">
        <div className="grid gap-6 lg:grid-cols-12">
          <SplitHeading id="services-h" className="display-lg lg:col-span-7">
            {site.services.heading}
          </SplitHeading>
          <Reveal className="self-end text-lg text-muted lg:col-span-5">
            <p>{site.services.sub}</p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          {/* Welcome flows: the big one, with the flow drawn out. */}
          <Reveal variant="scale" className="flex flex-col justify-between gap-12 rounded-[1.75rem] bg-surface p-7 md:p-10 lg:col-span-7 lg:row-span-2">
            <div>
              <Tag className="border-line">{welcome.tag}</Tag>
              <h3 className="mt-5 text-[clamp(2.25rem,4.6vw,4.25rem)]">{welcome.title}</h3>
              <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-muted">{welcome.body}</p>
            </div>
            <ol className="grid grid-cols-3 gap-3" aria-label="Example welcome flow timing">
              {[
                ["Day 0", "Hello and the offer"],
                ["Day 2", "Why we exist"],
                ["Day 5", "What to buy first"],
              ].map(([day, what], i) => (
                <li key={day} className="relative border-t-2 border-ink pt-3">
                  <span className={`absolute -top-[7px] left-0 h-3 w-3 rounded-full ${i === 0 ? "bg-lime ring-2 ring-ink" : "bg-ink"}`} />
                  <span className="mono block text-muted">{day}</span>
                  <span className="mt-1 block text-[0.95rem] leading-snug">{what}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          {/* Campaigns: the lime block. */}
          <Reveal variant="scale" delay={0.08} className="rounded-[1.75rem] bg-lime p-7 text-on-lime md:p-9 lg:col-span-5">
            <Tag className="border-on-lime/40">{campaigns.tag}</Tag>
            <h3 className="mt-5 text-[clamp(2rem,3.4vw,3rem)]">{campaigns.title}</h3>
            <p className="mt-3 max-w-[40ch] text-lg leading-relaxed">{campaigns.body}</p>
          </Reveal>

          {/* Abandoned cart: outlined, with the forgotten item. */}
          <Reveal variant="scale" delay={0.14} className="flex items-start justify-between gap-6 rounded-[1.75rem] border border-line p-7 md:p-9 lg:col-span-5">
            <div>
              <Tag className="border-line">{cart.tag}</Tag>
              <h3 className="mt-5 text-[clamp(1.75rem,2.6vw,2.5rem)]">{cart.title}</h3>
              <p className="mt-3 max-w-[36ch] leading-relaxed text-muted">{cart.body}</p>
            </div>
            <svg viewBox="0 0 64 64" className="mt-1 hidden w-16 shrink-0 text-ink sm:block" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 10h8l6 30h28l6-22H18" />
              <circle cx="24" cy="50" r="4" />
              <circle cx="44" cy="50" r="4" />
              <rect x="27" y="22" width="14" height="12" rx="2" className="fill-lime" />
            </svg>
          </Reveal>

          {/* Post-purchase and templates share the last row, unevenly. */}
          <Reveal variant="scale" className="rounded-[1.75rem] border border-line p-7 md:p-9 lg:col-span-4">
            <Tag className="border-line">{post.tag}</Tag>
            <h3 className="mt-5 text-[clamp(1.75rem,2.6vw,2.5rem)]">{post.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{post.body}</p>
          </Reveal>

          <Reveal variant="scale" delay={0.08} className="grid gap-8 rounded-[1.75rem] bg-ink p-7 text-bg md:grid-cols-[1.2fr_1fr] md:p-9 lg:col-span-8">
            <div>
              <Tag className="border-bg/30">{templates.tag}</Tag>
              <h3 className="mt-5 text-[clamp(1.75rem,2.6vw,2.5rem)]">{templates.title}</h3>
              <p className="mt-3 max-w-[40ch] leading-relaxed opacity-80">{templates.body}</p>
            </div>
            <div className="grid grid-cols-3 grid-rows-3 gap-2 self-center" aria-hidden="true">
              <span className="col-span-3 h-7 rounded-md bg-bg/15" />
              <span className="col-span-2 h-12 rounded-md bg-lime" />
              <span className="h-12 rounded-md bg-bg/15" />
              <span className="h-7 rounded-md bg-bg/15" />
              <span className="h-7 rounded-md bg-bg/15" />
              <span className="h-7 rounded-md bg-bg/30" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
