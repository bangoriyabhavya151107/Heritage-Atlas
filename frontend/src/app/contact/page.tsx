import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { InfoCard, PublicPage } from "@/components/PublicPage";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PublicPage
      eyebrow="Contact"
      title="Share a correction, question or collaboration idea."
      lead="The project is designed for local researchers, collection stewards and people who can help improve a record's context."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <ContactForm />
        <InfoCard title="Before you send a note">
          <p>This demonstration does not transmit contact messages. The form checks required fields and displays a success confirmation in your browser, but it does not send an email or save a copy.</p>
          <p>Please do not include sensitive personal information or confidential source material here. For a real launch, the project operator must configure and publish a monitored contact channel and state how messages are handled.</p>
        </InfoCard>
      </div>
    </PublicPage>
  );
}
