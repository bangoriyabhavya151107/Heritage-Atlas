import type { Metadata } from "next";
import { InfoCard, PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <PublicPage
      eyebrow="Terms · Prototype disclosure"
      title="Use the atlas with care for its sources and places."
      lead="These prototype terms explain the intended use of Heritage Atlas. The project operator must review and adapt them before a public production launch."
    >
      <InfoCard title="Respect source rights">
        <p>Upload only images and text you are authorized to use for this purpose. You remain responsible for ensuring that submission, processing and display do not violate copyright, privacy, cultural protocol or other rights. Do not upload personal records or restricted collection material without permission.</p>
      </InfoCard>
      <InfoCard title="Drafts and publication">
        <p>AI-generated transcriptions, translations, summaries and catalogue suggestions can be wrong. They must be checked against the source and relevant scholarship. A record is intended to become visible on the map and in search only after a reviewer approves it.</p>
        <p>Do not treat this prototype, its records or its search results as professional advice, an official register, or an authoritative statement of historical fact.</p>
      </InfoCard>
      <InfoCard title="Sensitive locations and responsible use">
        <p>Approved records may reveal public map coordinates. Do not submit precise coordinates of a vulnerable or restricted site unless publication has been considered and authorized. Do not use the service to misrepresent a source, harass a community, or disrupt a heritage site.</p>
      </InfoCard>
      <InfoCard title="Availability and changes">
        <p>This build is a demonstration. It may be incomplete, unavailable or changed without notice. The project has no configured public contact or message-delivery service in this prototype; do not rely on its contact form for urgent requests or corrections.</p>
      </InfoCard>
      <p className="px-1 text-xs leading-5 text-muted">Last updated: November 2, 2026. This page is informational and is not legal advice. Obtain appropriate legal and community review before deployment.</p>
    </PublicPage>
  );
}
