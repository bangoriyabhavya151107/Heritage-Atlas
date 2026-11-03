import Image from "next/image";
import Link from "next/link";
import { LandingMapPreview } from "@/components/LandingMapPreview";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-9 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-terracotta-ink">A field-to-archive workspace</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-indigo sm:text-6xl lg:text-7xl">From a stray page to a place on the map.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">Heritage Atlas turns a photograph or scan into a structured heritage record—then puts a researcher in charge of checking it before it is shared.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/upload" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-indigo px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo/90">Start with a scan <span aria-hidden="true">→</span></Link>
            <Link href="/explore" className="inline-flex min-h-12 items-center justify-center rounded-full border border-indigo/25 bg-paper px-6 py-3 text-sm font-semibold text-indigo hover:bg-indigo/5">Explore the atlas</Link>
          </div>
          <p className="mt-5 text-xs leading-5 text-muted">No record is published automatically. Every extracted fact is open to human review.</p>
        </div>

        <figure className="relative overflow-hidden rounded-[2rem] border border-line bg-paper p-3 shadow-folio">
          <div className="relative aspect-[4/4.4] overflow-hidden rounded-[1.5rem] bg-sandstone sm:aspect-[4/3.7]">
            <Image src="/adalaj-stepwell-anupgandhe.jpg" alt="Interior view through the carved levels of Adalaj Stepwell in Gujarat" fill priority sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent px-5 pb-5 pt-20 text-white sm:px-7 sm:pb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Adalaj · Gujarat</p>
              <figcaption className="mt-1 font-display text-2xl font-medium">A place, held in context.</figcaption>
              <p className="mt-2 text-[11px] leading-4 text-white/80">Photo: AnupGandhe · <a className="underline underline-offset-2" href="https://commons.wikimedia.org/wiki/File:Adalaj_ki_Vav_Gujarat_240A1370_72.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a> · <a className="underline underline-offset-2" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a></p>
            </div>
          </div>
          <div className="absolute right-6 top-6 rounded-full border border-white/70 bg-paper/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo">Field note 01</div>
        </figure>
      </section>

      <section className="border-y border-line bg-paper/70" aria-labelledby="problem-title">
        <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-11">
          <h2 id="problem-title" className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta-ink">The material is already there. The structure is not.</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3 sm:gap-8">
            {[
              ["01", "Photos stuck in decks", "Field images are hard to trace back to a site or source."],
              ["02", "Text trapped in scans", "Local-language notes rarely become searchable records."],
              ["03", "No search by meaning", "A name-only catalogue misses features people remember."],
            ].map(([number, title, body]) => (
              <article key={number} className="border-t border-line pt-4">
                <p className="text-xs font-bold tracking-[0.14em] text-terracotta-ink">{number} / FIELD GAP</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-indigo">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20" aria-labelledby="how-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta-ink">A careful path from source to record</p>
            <h2 id="how-title" className="mt-3 font-display text-3xl font-semibold text-indigo sm:text-4xl">Four steps, one human decision.</h2>
          </div>
          <Link href="/how-it-works" className="text-sm font-semibold text-indigo underline decoration-indigo/35 underline-offset-4">See the full process</Link>
        </div>
        <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["01", "Add the evidence", "Upload a photo or scanned page and name the place."],
            ["02", "Give it a location", "Place a pin so the record has geographic context."],
            ["03", "Prepare a draft", "OCR and AI suggest text and catalogue fields."],
            ["04", "Review, then publish", "A person checks the source and decides what becomes public."],
          ].map(([number, title, body]) => (
            <li key={number} className="rounded-2xl border border-line bg-paper p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo text-xs font-bold text-white">{number}</span>
              <h3 className="mt-5 font-display text-xl font-semibold text-indigo">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-[#EEE4D5]" aria-labelledby="meaning-title">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta-ink">Meaning over exact titles</p>
            <h2 id="meaning-title" className="mt-3 font-display text-3xl font-semibold leading-tight text-indigo">Ask for what you remember.</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">Semantic search can surface approved records by descriptions and features, not only by the name written on a label.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {["stepwells with carved pillars", "temples dedicated to the sun"].map((query) => (
              <Link key={query} href={`/explore?q=${encodeURIComponent(query)}`} className="rounded-full border border-indigo/20 bg-paper px-5 py-3 text-sm font-semibold text-indigo shadow-sm transition-colors hover:bg-white">“{query}” <span aria-hidden="true">↗</span></Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta-ink">A growing, reviewed atlas</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-indigo sm:text-4xl">Every record stays attached to its place.</h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted">Approved records appear on an open map with the details that help people discover them. Early map coverage depends on the records researchers have reviewed and published.</p>
          <Link href="/explore" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-indigo/25 bg-paper px-5 py-2.5 text-sm font-semibold text-indigo hover:bg-indigo/5">Open the map <span aria-hidden="true">→</span></Link>
        </div>
        <div className="overflow-hidden rounded-3xl border border-line bg-paper p-3 shadow-folio">
          <LandingMapPreview />
          <p className="px-2 pb-2 pt-3 text-xs text-muted">OpenStreetMap tiles · Map pins show approved records only.</p>
        </div>
      </section>

      <section className="bg-indigo px-5 py-14 text-center text-white sm:px-8 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">Start with one source</p>
        <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl">Help a local record find its place in the atlas.</h2>
        <Link href="/upload" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-paper px-6 py-3 text-sm font-semibold text-indigo hover:bg-white">Upload a scan or photograph</Link>
      </section>
    </main>
  );
}
