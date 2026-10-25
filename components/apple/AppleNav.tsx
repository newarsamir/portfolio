"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnchorLink from "../AnchorLink";
import { useHiddenAnchors, useSite } from "../cms/SiteProvider";

/** A thin translucent bar, like apple.com: name, small links, one button. A full-screen sheet on phones. */
export default function AppleNav() {
  const site = useSite();
  const hidden = useHiddenAnchors();
  const items = site.nav.filter((n) => n.id !== "home" && !hidden.includes(n.id));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const link = (item: (typeof items)[number], className: string) =>
    item.id === "cases" ? (
      <Link href="/work" className={className} onClick={() => setOpen(false)}>
        {item.label}
      </Link>
    ) : (
      <AnchorLink to={item.id} className={className} onClick={() => setOpen(false)}>
        {item.label}
      </AnchorLink>
    );

  return (
    <header className="apl-nav" data-open={open}>
      <div className="apl-nav-inner">
        <AnchorLink to="home" className="apl-nav-name">
          {site.name}
        </AnchorLink>
        <nav aria-label="Main" className="apl-nav-links">
          <ul>
            {items.map((item) => (
              <li key={item.id}>{link(item, "apl-nav-link")}</li>
            ))}
          </ul>
        </nav>
        <Link href="/contact" className="apl-pill apl-pill-sm">
          {site.navBar.hire}
        </Link>
        <button
          type="button"
          className="apl-nav-menu"
          aria-expanded={open}
          aria-controls="apl-sheet"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </div>
      <nav id="apl-sheet" aria-label="Menu" className="apl-sheet" hidden={!open}>
        <ul>
          {items.map((item, i) => (
            <li key={item.id} style={{ ["--i" as string]: i }}>
              {link(item, "apl-sheet-link")}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
