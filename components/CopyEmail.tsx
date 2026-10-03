"use client";

import { useRef, useState } from "react";
import { site } from "@/content/site";
import { CheckIcon, CopyIcon } from "./icons";

/** The email address as a button. Click copies it. */
export default function CopyEmail({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
    } catch {
      // Clipboard blocked: fall back to opening the mail app.
      window.location.href = `mailto:${site.email}`;
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`group inline-flex max-w-full items-center gap-3 rounded-full border-[1.5px] border-ink py-2.5 pl-5 pr-3 text-left font-medium transition-colors hover:bg-ink hover:text-bg ${className}`}
    >
      <span className="truncate">{site.email}</span>
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
          copied ? "bg-lime text-on-lime" : "bg-ink text-bg group-hover:bg-bg group-hover:text-ink"
        }`}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Email address copied" : "Copy email address"}
      </span>
    </button>
  );
}
