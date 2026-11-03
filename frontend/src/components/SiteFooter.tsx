import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/credits", label: "Image credits" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper" aria-label="Site footer">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Link href="/" className="font-display text-xl font-semibold tracking-tight text-indigo">Heritage Atlas</Link>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">A field-to-archive workspace for documenting cultural heritage. Human-reviewed records only; AI provides suggestions, not historical authority.</p>
        </div>
        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
            {footerLinks.map(({ href, label }) => <li key={href}><Link href={href} className="text-xs font-semibold text-muted underline decoration-line underline-offset-4 hover:text-indigo">{label}</Link></li>)}
          </ul>
        </nav>
        <p className="border-t border-line pt-4 text-[11px] leading-5 text-muted md:col-span-2">Prototype disclosure: contact, deletion and retention processes must be configured by the project operator before a public production launch.</p>
      </div>
    </footer>
  );
}
