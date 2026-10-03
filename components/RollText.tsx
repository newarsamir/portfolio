import { ArrowUpRight } from "./icons";

/**
 * A label whose letters roll up and are replaced by their twins when the
 * nearest link or button is hovered. Screen readers get the plain text.
 */
export function RollText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span className="roll" aria-hidden="true">
        {Array.from(text).map((c, i) => (
          <span key={i} className="roll-c" style={{ ["--i" as string]: i }}>
            <span>{c}</span>
            <span>{c}</span>
          </span>
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
