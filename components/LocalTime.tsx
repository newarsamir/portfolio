"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";

/** Live clock in the designer's time zone. Empty until mounted, so no hydration mismatch. */
export default function LocalTime({ withSeconds = false, className }: { withSeconds?: boolean; className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), withSeconds ? 1000 : 15000);
    return () => window.clearInterval(id);
  }, [withSeconds]);

  const text = now
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: withSeconds ? "2-digit" : undefined,
        timeZone: site.footer.timeZone,
      }).format(now)
    : "--:--";

  return (
    <time className={`[font-variant-numeric:tabular-nums] ${className ?? ""}`} suppressHydrationWarning>
      {text}
    </time>
  );
}
