"use client";

import Image from "next/image";
import { useState } from "react";
import { isRemote } from "@/lib/images";
import { useSite } from "../cms/SiteProvider";

/** A feature picker: the list on the left opens one service at a time; its email shows on the right. */
export default function AppleServices() {
  const { services } = useSite();
  const [active, setActive] = useState(0);
  const items = services.items;
  const current = items[Math.min(active, items.length - 1)];
  if (!current) return null;
  return (
    <section className="apl-band" aria-labelledby="apl-svc-h">
      <div className="apl-wrap">
        <h2 id="apl-svc-h" className="apl-h2">
          {services.heading}
        </h2>
        <p className="apl-body apl-measure">{services.sub}</p>
        <div className="apl-picker">
          <ul className="apl-picker-list">
            {items.map((s, i) => (
              <li key={s.id || i} data-on={i === active}>
                <button type="button" className="apl-picker-btn" aria-expanded={i === active} onClick={() => setActive(i)}>
                  {s.title}
                </button>
                <div className="apl-picker-body">
                  <div className="apl-picker-clip">
                    <p className="apl-body">{s.body}</p>
                    <p className="apl-note">
                      {s.when} · {s.tag}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="apl-picker-media">
            {current.image && (
              <Image
                key={current.image}
                src={current.image}
                alt=""
                width={600}
                height={1600}
                sizes="(min-width: 900px) 30rem, 90vw"
                unoptimized={isRemote(current.image)}
                className="apl-picker-img"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
