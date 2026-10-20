"use client";

import Link from "next/link";
import { useHiddenAnchors, useSite } from "./cms/SiteProvider";
import BackToTop from "./BackToTop";
import LocalTime from "./LocalTime";
import { RollText } from "./RollText";
import { ArrowUpRight } from "./icons";
import Wordmark from "./Wordmark";

export default function Footer() {
  const site = useSite();
  const { footer } = site;
  const hidden = useHiddenAnchors();
  const links = footer.links.filter((l) => l.label.trim() && l.href.trim() && !hidden.some((a) => l.href === `/#${a}`));
  const socials = site.socials.filter((s) => s.href && s.href !== "#");
  const city = site.location.split(",")[0];

  return (
    <footer id="contact" className="relative overflow-clip border-t border-line bg-surface pt-[clamp(3.5rem,7vw,6rem)] gridlines">
      <div className="wrap">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="mono text-muted">{footer.eyebrow}</p>
            <p className="mt-4 max-w-[18ch] font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.015em]">
              {footer.cta}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/contact" className="btn btn-lime">
                <RollText text={footer.button} />
              </Link>
              <a href={`mailto:${site.email}`} className="foot-link text-lg font-medium">
                <RollText text={site.email} />
                <ArrowUpRight width={16} height={16} />
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="lg:col-span-2">
            <p className="mono text-muted">{footer.sitemapLabel}</p>
            <ul className="mt-4 space-y-2.5">
              {links.map((l, i) => (
                <li key={i}>
                  <Link href={l.href} className="text-lg">
                    <RollText text={l.label} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <p className="mono text-muted">{footer.socialsLabel}</p>
            {socials.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer me" className="foot-link text-lg">
                      <RollText text={s.label} />
                      <ArrowUpRight width={16} height={16} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted">{footer.noSocials}</p>
            )}
          </div>

          <div className="lg:col-span-2">
            <p className="mono text-muted">{footer.timeLabel}</p>
            <p className="mt-4 font-display text-3xl font-semibold">
              <LocalTime withSeconds />
            </p>
            <p className="mt-1 text-muted">{city}</p>
            <div className="mt-6">
              <BackToTop />
            </div>
          </div>
        </div>
      </div>

      <div className="wrap mt-[clamp(4rem,8vw,7rem)]">
        <Wordmark text={site.name} />
      </div>

      <div className="border-t border-line">
        <div className="wrap flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pb-32 pt-6 text-[0.95rem] text-muted">
          <p>{footer.joke}</p>
          <p className="mono">
            © {new Date().getFullYear()} {site.name} · {site.title}
          </p>
        </div>
      </div>
    </footer>
  );
}
