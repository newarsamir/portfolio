"use client";

import { useEffect, useRef, useState } from "react";

const DIGITS = "0123456789";

/**
 * Digits that roll into place like a slot machine the first time they're
 * seen. Plain text for screen readers; the rolling strips are decorative.
 */
export default function Odometer({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setOn(true);
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const chars = value.split("");
  return (
    <span ref={ref} className={`odo ${className ?? ""}`} data-on={on}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="odo-row">
        {chars.map((c, i) => {
          const d = DIGITS.indexOf(c);
          if (d < 0) return <span key={i}>{c}</span>;
          return (
            <span key={i} className="odo-col">
              <span className="odo-strip" style={{ ["--d" as string]: d, ["--i" as string]: chars.length - i }}>
                {DIGITS.split("").map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
