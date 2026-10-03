"use client";

import { scrollToId } from "./AnchorLink";
import { ArrowUpIcon } from "./icons";

/** The arrow leaves through the top and a new one arrives from below. */
export default function BackToTop() {
  return (
    <button type="button" onClick={() => scrollToId("home")} className="group inline-flex items-center gap-3 font-medium">
      <span className="grid h-11 w-11 place-items-center overflow-clip rounded-full border-[1.5px] border-ink transition-colors group-hover:border-transparent group-hover:bg-lime group-hover:text-on-lime">
        <span className="grid">
          <ArrowUpIcon width={18} height={18} className="[grid-area:1/1] transition-transform duration-500 ease-out group-hover:-translate-y-[180%]" />
          <ArrowUpIcon width={18} height={18} className="[grid-area:1/1] translate-y-[180%] transition-transform duration-500 ease-out group-hover:translate-y-0" />
        </span>
      </span>
      Back to top
    </button>
  );
}
