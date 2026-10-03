import type { SVGProps } from "react";

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

type P = SVGProps<SVGSVGElement>;

export const HomeIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M5.5 9.8V20h13V9.8" />
    <path d="M10 20v-5h4v5" />
  </svg>
);
/** An email: the work. */
export const WorkIcon = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 7 8.5 6.5L20.5 7" />
  </svg>
);
export const AboutIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.8 20c.9-3.6 3.8-5.4 7.2-5.4s6.3 1.8 7.2 5.4" />
  </svg>
);
/** Layers: wireframe to design to handoff. */
export const ProcessIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m12 3.5 8.5 4.6L12 12.7 3.5 8.1 12 3.5Z" />
    <path d="m3.5 12 8.5 4.6 8.5-4.6" />
    <path d="m3.5 15.9 8.5 4.6 8.5-4.6" />
  </svg>
);
export const ContactIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20.5 3.5 10.6 13.4" />
    <path d="M20.5 3.5 14 20.5l-3.4-7.1L3.5 10l17-6.5Z" />
  </svg>
);
export const HireIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}>
    <path d="M12 3.2l2.3 5.6 6 .5-4.6 4 1.4 5.9L12 16l-5.1 3.2 1.4-5.9-4.6-4 6-.5L12 3.2Z" />
  </svg>
);
export const ArrowUpRight = (p: P) => (
  <svg {...base} width={18} height={18} strokeWidth={2} {...p}>
    <path d="M7 17 17 7" />
    <path d="M8.5 7H17v8.5" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
export const ChevronIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const CopyIcon = (p: P) => (
  <svg {...base} width={18} height={18} {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.2" />
    <path d="M15.5 8.5V6.7a2.2 2.2 0 0 0-2.2-2.2H6.7a2.2 2.2 0 0 0-2.2 2.2v6.6a2.2 2.2 0 0 0 2.2 2.2h1.8" />
  </svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base} width={18} height={18} strokeWidth={2.2} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
/** An open book: the case studies. */
export const CasesIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 6.5c-2-1.6-4.8-2-8.5-1.5v13c3.7-.5 6.5-.1 8.5 1.5 2-1.6 4.8-2 8.5-1.5V5c-3.7-.5-6.5-.1-8.5 1.5Z" />
    <path d="M12 6.5v13" />
  </svg>
);
export const ArrowUpIcon = (p: P) => (
  <svg {...base} strokeWidth={2} {...p}>
    <path d="M12 19V5" />
    <path d="m5.5 11.5 6.5-6.5 6.5 6.5" />
  </svg>
);
