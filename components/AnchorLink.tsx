"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { getLenis } from "./SmoothScroll";

export function scrollToId(id: string) {
  const el = id === "home" ? document.body : document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(id === "home" ? 0 : (el as HTMLElement), { duration: 1.4 });
  else if (id === "home") window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  history.replaceState(null, "", id === "home" ? location.pathname : `#${id}`);
}

/**
 * Link to a section of the home page. On the home page it scrolls smoothly,
 * from any other page it navigates to /#id.
 */
export default function AnchorLink({
  to,
  children,
  onClick,
  ...rest
}: { to: string } & Omit<ComponentProps<typeof Link>, "href">) {
  const pathname = usePathname();
  const href = to === "home" ? "/" : `/#${to}`;

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (pathname !== "/" || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    scrollToId(to);
  };

  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
