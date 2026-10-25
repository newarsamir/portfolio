"use client";

import Link from "next/link";
import { useHiddenAnchors, useSite } from "../cms/SiteProvider";
import LocalTime from "../LocalTime";
import { ArrowSwap, RollText } from "../RollText";

/** A light sign-off: the invitation, the address, and the small print. */
export default function FooterLight() {
  const site = useSite();
  const f = site.footer;
  const hidden = useHiddenAnchors();
  const links = f.links.filter((l) => l.label.trim() && l.href.trim() && !hidden.some((a) => l.href === `/#${a}`));
  const socials = site.socials.filter((s) => s.href && s.href !== "#");
  return (
    <footer id="contact" className="fl">
      <div className="wrap">
        <div className="fl-top">
          <p className="v3-label">{f.eyebrow}</p>
          <p className="fl-cta">{f.cta}</p>
          <div className="fl-actions">
            <Link href="/contact" className="btn btn-lime">
              <RollText text={f.button} />
              <ArrowSwap />
            </Link>
            <a href={`mailto:${site.email}`} className="fl-mail">
              {site.email}
            </a>
          </div>
        </div>

        <div className="fl-cols">
          <nav aria-label="Footer">
            <p className="v3-label">{f.sitemapLabel}</p>
            <ul className="fl-list">
              {links.map((l, i) => (
                <li key={i}>
                  <Link href={l.href}>
                    <RollText text={l.label} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="v3-label">{f.socialsLabel}</p>
            {socials.length ? (
              <ul className="fl-list">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer me">
                      <RollText text={s.label} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 max-w-[26ch] text-muted">{f.noSocials}</p>
            )}
          </div>
          <div>
            <p className="v3-label">{f.timeLabel}</p>
            <p className="fl-time">
              <LocalTime withSeconds />
            </p>
            <p className="text-muted">{site.location}</p>
          </div>
        </div>

        <div className="fl-bottom">
          <p>{f.joke}</p>
          <p className="mono">
            © {new Date().getFullYear()} {site.name} · {site.title}
          </p>
        </div>
      </div>
    </footer>
  );
}
