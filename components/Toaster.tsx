"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TOAST_EVENT, type ToastInput } from "@/lib/toast";
import { CheckIcon, CloseIcon } from "./icons";

type Item = ToastInput & { id: number; leaving?: boolean };

const ICON = {
  error: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 7.5v5.5M12 16.6v.1" />
    </svg>
  ),
  success: <CheckIcon />,
  info: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 11v6M12 7.4v.1" />
    </svg>
  ),
};

/**
 * Pop-ups that slide in from the corner with a blur, count down along a
 * thin bar, pause while hovered and stack. Errors are announced assertively.
 */
export default function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((all) => all.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => setItems((all) => all.filter((t) => t.id !== id)), 380);
  }, []);

  useEffect(() => {
    const on = (e: Event) => {
      const detail = (e as CustomEvent<ToastInput>).detail;
      const id = ++seq.current;
      setItems((all) => {
        // The same message twice in a row just restarts the existing one.
        const dupe = all.find((t) => !t.leaving && t.message === detail.message && t.kind === detail.kind);
        const rest = dupe ? all.filter((t) => t !== dupe) : all;
        return [...rest, { ...detail, id }].slice(-4);
      });
    };
    window.addEventListener(TOAST_EVENT, on);
    return () => window.removeEventListener(TOAST_EVENT, on);
  }, []);

  return (
    <div className="toaster" aria-live="off">
      {items.map((t) => (
        <Toast key={t.id} item={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function Toast({ item, onClose }: { item: Item; onClose: () => void }) {
  const duration = item.duration ?? 4500;
  const [paused, setPaused] = useState(false);
  const left = useRef(duration);
  const started = useRef(0);

  useEffect(() => {
    if (paused || item.leaving) return;
    started.current = performance.now();
    const id = window.setTimeout(onClose, left.current);
    return () => {
      window.clearTimeout(id);
      left.current -= performance.now() - started.current;
    };
  }, [paused, item.leaving, onClose]);

  return (
    <div
      role={item.kind === "error" ? "alert" : "status"}
      aria-live={item.kind === "error" ? "assertive" : "polite"}
      className="toast"
      data-kind={item.kind}
      data-leaving={item.leaving || undefined}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="toast-icon">{ICON[item.kind]}</span>
      <div className="min-w-0 flex-1">
        {item.title && <p className="font-semibold leading-snug">{item.title}</p>}
        <p className="text-[0.95rem] leading-snug opacity-85">{item.message}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="toast-close">
        <CloseIcon width={14} height={14} />
      </button>
      <span
        className="toast-bar"
        aria-hidden="true"
        style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? "paused" : "running" }}
      />
    </div>
  );
}
