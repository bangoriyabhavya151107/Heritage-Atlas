import type { Metadata } from "next";
import Link from "next/link";
import { InfoCard, PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = { title: "About Heritage Atlas" };

export default function AboutPage() {
  return (
    <PublicPage
      eyebrow="About the atlas"
      title="Local knowledge deserves a usable record."
      lead="Heritage Atlas is a field-to-archive workspace for turning photographs and scanned material into searchable, place-aware records—without separating a catalogue entry from the evidence that informed it."
    >
      <InfoCard title="What we are building">
        <p>Small heritage collections often begin as images, notebooks and local-language documents. Those sources can be hard to find, compare and connect with a place. Heritage Atlas is designed to bring those materials into one careful workflow: record the source, suggest structure, let a person review it, and share only the approved record.</p>
      </InfoCard>
      <InfoCard title="People remain responsible">
        <p>Optical character recognition and AI may propose a transcription, translation or set of catalogue fields. They can be wrong, incomplete or overconfident. A reviewer can edit the draft, return it to processing, or leave it unpublished. A model output is not a historical source or an approval decision.</p>
      </InfoCard>
      <InfoCard title="A focused prototype">
        <p>This build demonstrates the record workflow, map and semantic search for heritage in Gujarat. Its sample site records are conservative summaries tied to cited public listings, not a substitute for local scholarship. Coverage is incomplete and coordinates are approximate map pins unless a record explicitly establishes otherwise.</p>
        <p>Before public production, the project operator must set verified contact details, retention and deletion processes, backup policies, service availability and a staffed review workflow.</p>
      </InfoCard>
      <div className="rounded-2xl bg-indigo p-6 text-white sm:p-8">
        <p className="max-w-2xl font-display text-2xl font-semibold">Start with the source, not the guess.</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Add a scan and location, follow its processing status, then check the resulting draft against the original image.</p>
        <Link href="/upload" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-indigo hover:bg-white">Add a record</Link>
      </div>
    </PublicPage>
  );
}
