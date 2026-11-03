import type { Metadata } from "next";
import Link from "next/link";
import { InfoCard, PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = { title: "How the atlas works" };

const stages = [
  ["01 · Intake", "A researcher uploads one JPEG, PNG or WebP image (up to 8 MB), adds a recognizable place name and chooses a map point."],
  ["02 · Prepare", "The source image is preprocessed and sent through OCR. The application records detected text and language where available."],
  ["03 · Suggest", "The configured Gemini model may propose a translation, short summary and structured heritage fields. A separate embedding step supports semantic search."],
  ["04 · Review", "A reviewer can inspect the signed private source image, edit suggested fields, and correct the location before approval."],
  ["05 · Publish", "Only approved records appear on the public map and in search. Uploaded and in-review records are not public atlas results."],
] as const;

export default function HowItWorksPage() {
  return (
    <PublicPage
      eyebrow="The workflow"
      title="A traceable path from source to shared record."
      lead="Each step separates a source image from machine-generated suggestions and from the review decision that makes a record public."
    >
      <ol className="space-y-4">
        {stages.map(([label, description]) => (
          <li key={label} className="grid gap-4 rounded-2xl border border-line bg-paper p-5 sm:grid-cols-[10rem_1fr] sm:p-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-terracotta-ink">{label}</h2>
            <p className="text-sm leading-6 text-muted">{description}</p>
          </li>
        ))}
      </ol>
      <InfoCard title="Status and recovery">
        <p>The review page shows the current pipeline stage. Completed stages are checkpointed, so a failed process can be retried from its last saved stage instead of repeating every earlier step. A reviewer can always edit or leave the draft unpublished.</p>
      </InfoCard>
      <InfoCard title="AI is an assistant, not a source">
        <p>Language detection, OCR and generated fields may contain errors, especially with damaged scans, scripts or place names. Check every claim against the original and authoritative references. This prototype uses Google&apos;s Gemini API; the free-tier terms say requests may be used to improve Google&apos;s products. Do not send restricted material without the rights and permission to do so. See the <Link href="/privacy" className="font-semibold text-indigo underline underline-offset-4">privacy page</Link>.</p>
      </InfoCard>
      <div className="flex flex-wrap gap-3">
        <Link href="/upload" className="inline-flex min-h-11 items-center rounded-full bg-indigo px-5 py-2.5 text-sm font-semibold text-white">Start with a source image</Link>
        <Link href="/explore" className="inline-flex min-h-11 items-center rounded-full border border-indigo/25 px-5 py-2.5 text-sm font-semibold text-indigo">Explore approved records</Link>
      </div>
    </PublicPage>
  );
}
