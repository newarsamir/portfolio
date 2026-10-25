"use client";

import Link from "next/link";
import { useHiddenAnchors, useSite } from "../cms/SiteProvider";
import LocalTime from "../LocalTime";

/** A closing invitation, then the small grey footer apple.com is known for. */
export default function AppleFooter() {
  const site = useSite();
  const f = site.footer;
  const hidden = useHiddenAnchors();
  const links = f.links.filter((l) => l.label.trim() && l.href.trim() && !hidden.some((a) => l.href === `/#${a}`));
  const socials = site.socials.filter((s) => s.href && s.href !== "#");
  return (
    <footer id="contact" className="apl-footer">
      <div className="apl-wrap apl-center apl-footer-cta">
        <h2 className="apl-h2 apl-measure-h mx-auto">{f.cta}</h2>
        <div className="apl-actions">
          <Link href="/contact" className="apl-pill">
            {f.button}
          </Link>
          <a href={`mailto:${site.email}`} className="apl-more">
            {site.email}
          </a>
        </div>
      </div>
      <div className="apl-footer-small">
        <div className="apl-wrap">
          <p className="apl-footer-note">{f.joke}</p>
          <div className="apl-footer-cols">
            <nav aria-label="Footer">
              <h3>{f.sitemapLabel}</h3>
              <ul>
                {links.map((l, i) => (
                  <li key={i}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <h3>{f.socialsLabel}</h3>
              {socials.length ? (
                <ul>
                  {socials.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer me">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{f.noSocials}</p>
              )}
            </div>
            <div>
              <h3>{f.timeLabel}</h3>
              <p>
                <LocalTime /> · {site.location}
              </p>
            </div>
          </div>
          <p className="apl-footer-legal">
            Copyright © {new Date().getFullYear()} {site.name}. {site.title}.
          </p>
        </div>
      </div>
    </footer>
  );
}
