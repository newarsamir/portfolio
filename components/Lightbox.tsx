"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { ShowcaseItem } from "@/content/site";
import { isRemote } from "@/lib/images";
import { ChevronIcon, CloseIcon } from "./icons";
import { getLenis } from "./SmoothScroll";

/** Full email in a scrollable column, with the brand, type and design note. */
export default function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: readonly ShowcaseItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const open = index !== null;
  const item = open ? items[index] : null;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      getLenis()?.stop();
      // Start on the close button rather than the scroll area.
      requestAnimationFrame(() => closeBtn.current?.focus());
    } else if (!open && d.open) {
      d.close();
    }
    if (!open) getLenis()?.start();
  }, [open]);

  useEffect(() => () => void getLenis()?.start(), []);

  // New email: back to the top of the scroll area.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [index]);

  const go = (dir: 1 | -1) => {
    if (index === null) return;
    onNavigate((index + dir + items.length) % items.length);
  };

  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label={item ? `${item.brand}, ${item.type}` : "Email preview"}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      {item && (
        <div
          className="lightbox-panel pointer-events-none mx-auto flex h-full w-full max-w-[72rem] flex-col gap-3 p-3 md:flex-row md:items-stretch md:gap-6 md:p-8"
        >
          <div
            ref={scroller}
            data-lenis-prevent
            tabIndex={0}
            aria-label="Full email, scrollable"
            className="pointer-events-auto order-2 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl bg-surface md:order-1 md:max-w-[40rem]"
          >
            <Image
              key={item.src}
              src={item.src}
              alt={`${item.brand}: ${item.type}`}
              width={item.width}
              height={item.height}
              sizes="(min-width: 768px) 640px, 100vw"
              unoptimized={isRemote(item.src)}
              className="h-auto w-full"
              priority
            />
          </div>

          <div className="pointer-events-auto order-1 flex shrink-0 flex-col justify-between gap-4 rounded-2xl bg-bg p-5 md:order-2 md:w-[22rem] md:p-7">
            <div>
              <div className="flex items-start justify-between gap-4">
                <p className="mono text-muted">
                  {String(index! + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </p>
                <button
                  type="button"
                  ref={closeBtn}
                  onClick={onClose}
                  aria-label="Close preview"
                  className="-mr-2 -mt-2 grid h-11 w-11 place-items-center rounded-full border border-line hover:bg-ink hover:text-bg"
                >
                  <CloseIcon width={18} height={18} />
                </button>
              </div>
              <h3 className="mt-2 text-3xl md:mt-6 md:text-4xl">{item.brand}</h3>
              <p className="mt-2 text-lg text-muted">{item.type}</p>
              <p className="mt-4 hidden border-t border-line pt-4 leading-relaxed md:block">
                <span className="mono mb-1.5 block text-muted">Design decision</span>
                {item.note}
              </p>
              <p className="mt-2 text-[0.95rem] leading-snug md:hidden">{item.note}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                className="grid h-11 flex-1 place-items-center rounded-full border border-line hover:bg-ink hover:text-bg"
                aria-label="Previous email"
              >
                <ChevronIcon className="rotate-180" width={18} height={18} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="grid h-11 flex-1 place-items-center rounded-full border border-line hover:bg-ink hover:text-bg"
                aria-label="Next email"
              >
                <ChevronIcon width={18} height={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
