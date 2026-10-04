import { ArrowUpRight } from "./icons";

/**
 * A label whose letters roll up and are replaced by their twins when the
 * nearest link or button is hovered. The letters are drawn by CSS from
 * data-c, so the page text (copy and paste, search engines, screen
 * readers) contains the label exactly once.
 */
export function RollText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span className="roll" aria-hidden="true">
        {Array.from(text).map((c, i) => (
          <span key={i} className="roll-c" data-c={c} style={{ ["--i" as string]: i }} />
        ))}
      </span>
    </span>
  );
}

/** Arrow that flies out to the top right and returns from the bottom left. */
export function ArrowSwap({ size = 18 }: { size?: number }) {
  return (
    <span className="arrow-swap" aria-hidden="true">
      <ArrowUpRight width={size} height={size} />
      <ArrowUpRight width={size} height={size} />
    </span>
  );
}
