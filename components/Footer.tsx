import Link from "next/link";
import { site } from "@/content/site";

export default function Footer() {
  const socials = site.socials.filter((s) => s.href && s.href !== "#");
  return (
    <footer className="border-t border-line pb-32 pt-12">
      <div className="wrap grid gap-10 md:grid-cols-12">
        <div className="md:col-span-6">
          <p className="font-display text-3xl font-semibold">{site.name}</p>
          <p className="mt-1 text-muted">
            {site.title}, {site.location}
          </p>
          <a href={`mailto:${site.email}`} className="link mt-5 inline-block text-lg">
            {site.email}
          </a>
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <ul className="space-y-2">
            <li>
              <Link href="/" className="link">
                Home
              </Link>
            </li>
            <li>
              <Link href="/#work" className="link">
                Work
              </Link>
            </li>
            <li>
              <Link href="/contact" className="link">
                Start a project
              </Link>
            </li>
          </ul>
        </nav>

        {socials.length > 0 && (
          <ul className="space-y-2 md:col-span-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer me" className="link">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="wrap mt-12 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t border-line pt-6 text-[0.95rem] text-muted">
        <p>{site.footer.joke}</p>
        <p className="mono">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
