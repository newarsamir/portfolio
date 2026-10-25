"use client";

import Link from "next/link";
import { useHiddenAnchors, useSite } from "../cms/SiteProvider";
import LocalTime from "../LocalTime";
import Magnetic from "../Magnetic";
import { ArrowSwap, RollText } from "../RollText";

/** The sign-off: a dark slab, the email address as big as it gets, and an unsubscribe link that goes back to the top. */
export default function FooterX() {
  const site = useSite();
  const f = site.footer;
  const hidden = useHiddenAnchors();
  const links = f.links.filter((l) => l.label.trim() && l.href.trim() && !hidden.some((a) => l.href === `/#${a}`));
  const socials = site.socials.filter((s) => s.href && s.href !== "#");
  const city = site.location.split(",")[0];

  return (
    <footer id="contact" className="fx">
      <div className="wrap">
        <p className="x-label fx-label">{f.eyebrow}</p>
        <p className="x-display fx-cta">{f.cta}</p>
        <div className="fx-actions">
          <Magnetic>
            <Link href="/contact" className="btn btn-lime">
              <RollText text={f.button} />
              <ArrowSwap />
            </Link>
          </Magnetic>
          <a href={`mailto:${site.email}`} className="fx-mail">
            <RollText text={site.email} />
          </a>
        </div>

        <div className="fx-cols">
          <nav aria-label="Footer">
            <p className="x-label fx-label">{f.sitemapLabel}</p>
            <ul className="fx-list">
              {links.map((l, i) => (
                <li key={i}>
                  <Link href={l.href} className="fx-link">
                    <RollText text={l.label} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="x-label fx-label">{f.socialsLabel}</p>
            {socials.length > 0 ? (
              <ul className="fx-list">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer me" className="fx-link">
                      <RollText text={s.label} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fx-muted mt-4 max-w-[26ch]">{f.noSocials}</p>
            )}
          </div>
          <div>
            <p className="x-label fx-label">{f.timeLabel}</p>
            <p className="x-display fx-time">
              <LocalTime withSeconds />
            </p>
            <p className="fx-muted">{city}</p>
          </div>
        </div>
      </div>

      <p className="fx-word x-display" aria-hidden="true">
        {site.name}
      </p>

      <div className="wrap fx-bottom">
        <p>{f.joke}</p>
        <button type="button" className="fx-unsub" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {f.unsubscribe}
        </button>
        <p className="mono">
          © {new Date().getFullYear()} {site.name} · {site.title}
        </p>
      </div>
    </footer>
  );
}
