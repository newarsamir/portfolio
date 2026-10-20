/**
 * A 1.5 second hello on the first page of a visit, in the spirit of the
 * Mac's "hello": नमस्ते (Nepali), Jojolapa (Nepal Bhasa) and Hello, each
 * drawn as an outline that fills in, then the panel lifts away.
 *
 * It is plain HTML and CSS so it plays before any JavaScript loads. The
 * small inline script skips it for the rest of the session and for people
 * who prefer reduced motion, and tells the hero to start after it.
 */

import type { Site } from "@/content/site";

// Shown once per browser tab session (and never in the admin preview).
const SCRIPT = `(function(){var d=document.documentElement;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches||location.search.indexOf('cms=1')>-1||sessionStorage.getItem('intro-seen')){d.classList.add('intro-skip');return}sessionStorage.setItem('intro-seen','1');d.classList.add('intro-on');setTimeout(function(){d.classList.add('intro-done')},3150)}catch(e){d.classList.add('intro-skip')}})();`;

// Ananda Akchyar is a legacy Nepali font: these Latin keys draw नमस्ते.
const NAMASTE_KEYS = "gd:t]";

/** Long words get smaller so they still fit the stage. */
const fit = (word: string, max: number) => Math.round(Math.min(max, 1900 / Math.max(word.length, 1)));

export default function IntroGreeting({ copy }: { copy: Site["intro"] }) {
  const WORDS = [
    { text: NAMASTE_KEYS, label: copy.nepaliLabel, font: "intro-deva", size: 250 },
    { text: copy.second, label: copy.secondLabel, font: "intro-latin", size: fit(copy.second, 190) },
    { text: copy.third, label: copy.thirdLabel, font: "intro-latin", size: fit(copy.third, 230), dot: true },
  ];
  return (
    <>
      <link rel="preload" href="/fonts/ananda-akchyar-namaste.woff2" as="font" type="font/woff2" crossOrigin="" />
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
      <div className="intro" aria-hidden="true">
        <div className="intro-chase" />
        <div className="intro-panel">
          <div className="intro-stage">
            {WORDS.map((w, i) => (
              <div key={i} className="intro-word" style={{ ["--n" as string]: i }}>
                <svg viewBox="0 0 1200 380" className="intro-svg">
                  <text x="600" y="255" textAnchor="middle" className={w.font} style={{ fontSize: w.size }}>
                    {w.text}
                    {w.dot && <tspan className="intro-dot">.</tspan>}
                  </text>
                </svg>
                <span className="intro-label">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
