import type { Metadata } from "next";
import Link from "next/link";
import { InfoCard, PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PublicPage
      eyebrow="Privacy · Prototype disclosure"
      title="Your source deserves careful handling."
      lead="This page describes how this prototype is designed to handle record data. The project operator must complete and verify deployment-specific details before inviting public submissions."
    >
      <InfoCard title="What the project stores">
        <p>When a researcher uploads a record, the backend stores the source image in a private Supabase Storage bucket and stores the place name, chosen coordinates, processing status, OCR text, generated translation and suggested catalogue fields in the database. Approved record fields and their map coordinates are returned to public map and search endpoints.</p>
        <p>Map coordinates can reveal the location of archaeological or culturally sensitive material. Do not submit a sensitive location unless it is appropriate to make it public after approval.</p>
      </InfoCard>
      <InfoCard title="Private image access">
        <p>Uploaded images are intended to remain in a private bucket. The review interface requests a signed image URL from the backend; that URL expires after five minutes. This is a short-lived access link, not a replacement for access controls or a deletion policy.</p>
      </InfoCard>
      <InfoCard title="OCR and third-party AI processing">
        <p>OCR is run by Tesseract on the backend. During AI extraction, the configured Gemini service receives the source image, the place name and any OCR text so it can suggest fields. If translation is needed, OCR text is sent to Gemini; the embedding service receives the search document assembled from the record&apos;s text and metadata.</p>
        <p>This prototype is configured for the Gemini Developer API Free tier. Google&apos;s published terms say free-tier content may be used to improve Google products. Do not upload confidential, restricted or personally sensitive material without the appropriate rights and consent. The project must not switch to paid AI calls to bypass this disclosure.</p>
      </InfoCard>
      <InfoCard title="Access, retention and deletion">
        <p>Approved record details are designed for public access; drafts, failed records and source-image objects are not returned by the public map endpoint. The backend service key is server-side and must never be placed in a public frontend variable.</p>
        <p>This prototype does not yet provide an automated retention schedule, account-based deletion request workflow, or public self-service source removal. Records remain in the configured Supabase project until its operator removes them. Before launch, the operator must publish the Supabase region, retention period, backup treatment, deletion contact and incident process.</p>
      </InfoCard>
      <InfoCard title="Services and this contact page">
        <p>The application uses Supabase for configured database and private file storage, Google&apos;s Gemini API for configured AI processing, and OpenStreetMap tiles for the map. Each provider has its own terms and infrastructure. This demonstration&apos;s contact form only validates in the browser; it does not send or store messages.</p>
        <p>There is no project email or named privacy contact configured in this build. See the <Link href="/contact" className="font-semibold text-indigo underline underline-offset-4">contact page</Link> for the current prototype limitation.</p>
      </InfoCard>
      <p className="px-1 text-xs leading-5 text-muted">Last updated: November 2, 2026. This prototype notice is informational, not legal advice or a substitute for a deployment-specific privacy notice.</p>
    </PublicPage>
  );
}
