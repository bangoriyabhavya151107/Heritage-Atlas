import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = { title: "Frequently asked questions" };

const questions = [
  ["What can I upload?", "One JPEG, PNG or WebP image up to 8 MB. Use a legible scan or field photograph that you are authorized to submit."],
  ["Does AI publish my record?", "No. AI suggests text and catalogue fields. A researcher must check and approve the record before it appears in the public map or search."],
  ["What languages can the OCR recognize?", "The backend is configured with Tesseract language packs eng, hin and guj. Recognition varies with script, image quality, handwriting and language; always compare the transcript with the image."],
  ["What if the image has no readable text?", "The processing pipeline can still send the source image to the configured Gemini service for candidate extraction. The result remains a draft and needs human review."],
  ["How does search work?", "Search embeds the query and compares it with approved record embeddings, then returns ranked matches above a configured similarity threshold. Queries should describe a feature or idea; scores are similarity estimates, not proof."],
  ["Are my source images public?", "The storage bucket is designed to be private. The review interface uses a five-minute signed URL. Approved record details, including the chosen coordinates, are public through the map and search API."],
  ["Can I remove a submission?", "This prototype does not include a public self-service deletion flow. Its operator must remove records and storage objects directly. Do not upload material until the operator has explained how retention and removal will work."],
  ["Where do I report an error?", "The contact form validates locally but does not send messages. The project operator needs to configure a monitored contact channel before relying on the site for corrections."],
] as const;

export default function FAQPage() {
  return (
    <PublicPage
      eyebrow="FAQ"
      title="A few things to know before you add a source."
      lead="The atlas is designed to help organize evidence without hiding the limits of extraction, maps or early coverage."
    >
      <div className="space-y-3">
        {questions.map(([question, answer]) => (
          <details key={question} className="group rounded-2xl border border-line bg-paper p-5 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-indigo marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo">
              {question}<span className="text-xl text-terracotta-ink transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{answer}</p>
          </details>
        ))}
      </div>
      <p className="text-sm text-muted">Read the <Link href="/privacy" className="font-semibold text-indigo underline underline-offset-4">privacy notice</Link> and <Link href="/how-it-works" className="font-semibold text-indigo underline underline-offset-4">workflow overview</Link> before uploading.</p>
    </PublicPage>
  );
}
