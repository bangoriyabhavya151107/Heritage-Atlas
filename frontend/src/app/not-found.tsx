import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-terracotta-ink">Page not found</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-indigo">This page is not in the atlas.</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Check the address, or return to Upload to start a new heritage record.</p>
      <Link href="/upload" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-indigo px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo/90">Go to Upload</Link>
    </main>
  );
}
