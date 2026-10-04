/**
 * A 1.5 second hello on the first page of a visit, in the spirit of the
 * Mac's "hello": नमस्ते (Nepali), Jojolapa (Nepal Bhasa) and Hello, each
 * drawn as an outline that fills in, then the panel lifts away.
 *
 * It is plain HTML and CSS so it plays before any JavaScript loads. The
 * small inline script skips it for the rest of the session and for people
 * who prefer reduced motion, and tells the hero to start after it.
 */

// Shown once per browser tab session.
const SCRIPT = `(function(){var d=document.documentElement;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('intro-seen')){d.classList.add('intro-skip');return}sessionStorage.setItem('intro-seen','1');d.classList.add('intro-on');setTimeout(function(){d.classList.add('intro-done')},3150)}catch(e){d.classList.add('intro-skip')}})();`;

// Ananda Akchyar is a legacy Nepali font: these Latin keys draw नमस्ते.
const NAMASTE_KEYS = "gd:t]";

const WORDS = [
  { text: NAMASTE_KEYS, label: "Nepali", font: "intro-deva", size: 250 },
  { text: "Jojolapa", label: "Nepal Bhasa", font: "intro-latin", size: 190 },
  { text: "Hello", label: "English", font: "intro-latin", size: 230, dot: true },
];

export default function IntroGreeting() {
  return (
    <>
      <link rel="preload" href="/fonts/ananda-akchyar-namaste.woff2" as="font" type="font/woff2" crossOrigin="" />
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
      <div className="intro" aria-hidden="true">
        <div className="intro-chase" />
        <div className="intro-panel">
          <div className="intro-stage">
            {WORDS.map((w, i) => (
              <div key={w.label} className="intro-word" style={{ ["--n" as string]: i }}>
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
