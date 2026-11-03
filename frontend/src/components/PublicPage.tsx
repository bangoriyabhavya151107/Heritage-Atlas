import type { ReactNode } from "react";

interface PublicPageProps {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}

export function PublicPage({ eyebrow, title, lead, children }: PublicPageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
      <header className="border-b border-line pb-7 sm:pb-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-terracotta-ink">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-tight tracking-tight text-indigo sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{lead}</p>
      </header>
      <div className="mt-8 space-y-6">{children}</div>
    </main>
  );
}

export function InfoCard({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="rounded-2xl border border-line bg-paper p-5 sm:p-7" aria-label={title}>
      <h2 className="font-display text-2xl font-semibold text-indigo">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted">{children}</div>
    </section>
  );
}
