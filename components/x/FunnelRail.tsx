"use client";

import { useEffect, useRef, useState } from "react";
import { useSite } from "../cms/SiteProvider";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * A slim rail on the right of the home page that tracks the visitor down the
 * funnel (Sent, Opened, Clicked, Ordered, Repeat) and counts the revenue a
 * good email program would have made while they scrolled.
 */
export default function FunnelRail() {
  const { funnel } = useSite();
  const [stage, setStage] = useState(0);
  const fill = useRef<HTMLSpanElement>(null);
  const amount = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sections = () =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-stage]"));
    let raf = 0;
    let earned = 0;
    let lastY = window.scrollY;
    const measure = () => {
      raf = 0;
      const y = window.scrollY;
      // Scrolling either way counts: subscribers browse up and down too.
      earned += Math.abs(y - lastY) * 0.37;
      lastY = y;
      if (amount.current) amount.current.textContent = money.format(earned);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      fill.current?.style.setProperty(
        "transform",
        `scaleY(${max > 0 ? Math.min(1, y / max) : 0})`,
      );

      const mid = window.innerHeight * 0.45;
      let current = 0;
      for (const el of sections())
        if (el.getBoundingClientRect().top <= mid)
          current = Math.max(current, Number(el.dataset.stage) || 0);
      setStage(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const stages = funnel.stages.filter((s) => s.trim());
  return (
    <aside className="frail" aria-label="Where you are in the funnel">
      <div className="relative">
        <ol className="frail-list">
          {stages.map((s, i) => (
            <li
              key={i}
              className="frail-item"
              data-on={i <= stage}
              data-current={i === stage}
            >
              <span className="frail-dot" aria-hidden="true" />
              <span className="frail-label mono">{s}</span>
            </li>
          ))}
        </ol>
        <span className="frail-track" aria-hidden="true">
          <span ref={fill} className="frail-fill" />
        </span>
      </div>
      <p className="frail-money">
        <span className="mono frail-money-label">{funnel.revenueLabel}</span>
        <span ref={amount} className="frail-money-value" aria-live="off">
          $0
        </span>
      </p>
    </aside>
  );
}
