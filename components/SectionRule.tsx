/** Hairline divider with registration marks and the section's name. */
export default function SectionRule({ label, note }: { label: string; note?: string }) {
  return (
    <div className="rule mono mb-10 md:mb-14">
      <span>{label}</span>
      {note && <span className="hidden sm:inline">{note}</span>}
    </div>
  );
}
