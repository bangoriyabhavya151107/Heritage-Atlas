"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/explore", label: "Explore" },
  { href: "/upload", label: "Upload" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-sandstone/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="group inline-flex items-center gap-3 rounded-lg" aria-label="Heritage Atlas, go to home">
          <svg viewBox="0 0 44 44" className="h-10 w-10 shrink-0" role="img" aria-label="Heritage Atlas pin and folio mark">
            <rect x="3" y="3" width="38" height="38" rx="12" fill="#1F2A5A" />
            <path d="M12 29.5h20M15 25.5v-9l7-5 7 5v9M18.5 25.5v-6h7v6" fill="none" stroke="#F4EBDD" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
            <circle cx="22" cy="17" r="2.3" fill="#C65D3B" />
          </svg>
          <span className="font-display text-xl font-semibold tracking-tight text-indigo sm:text-2xl">Heritage Atlas</span>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-1 rounded-full border border-line bg-paper/80 p-1">
          {navigation.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`min-h-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-ink focus-visible:ring-offset-2 ${active ? "bg-indigo text-white" : "text-muted hover:bg-indigo/5 hover:text-indigo"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
