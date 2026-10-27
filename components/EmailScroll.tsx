import { resized, srcSet } from "@/lib/images";

/**
 * A tall email in a fixed-height window. Hovering it (or its card, via
 * the .group class) scrolls the email from the header down to the footer.
 */
export default function EmailScroll({
  src,
  alt = "",
  height = "26rem",
  duration = "7s",
  phone = false,
  sizes = "(min-width: 768px) 26rem, 90vw",
  className,
}: {
  src: string;
  alt?: string;
  height?: string;
  duration?: string;
  phone?: boolean;
  /** How wide the email shows, so a resized copy is sent instead of the original. */
  sizes?: string;
  className?: string;
}) {
  const vars = { ["--frame-h" as string]: height, ["--scroll-dur" as string]: duration, height };
  const inner = (
    <div className="email-scroll" style={vars}>
      {src ? (
        <img src={resized(src, 828)} srcSet={srcSet(src)} sizes={sizes} alt={alt} loading="lazy" decoding="async" />
      ) : (
        <p className="grid h-full place-items-center text-muted">No image</p>
      )}
    </div>
  );
  if (!phone) return <div className={className}>{inner}</div>;
  return (
    <div className={`phone relative ${className ?? ""}`}>
      <span className="phone-notch" aria-hidden="true" />
      {inner}
    </div>
  );
}
