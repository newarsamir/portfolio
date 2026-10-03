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
  className,
}: {
  src: string;
  alt?: string;
  height?: string;
  duration?: string;
  phone?: boolean;
  className?: string;
}) {
  const vars = { ["--frame-h" as string]: height, ["--scroll-dur" as string]: duration, height };
  const inner = (
    <div className="email-scroll" style={vars}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" />
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
