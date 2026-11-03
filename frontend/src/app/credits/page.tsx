import type { Metadata } from "next";
import { PublicPage, InfoCard } from "@/components/PublicPage";

export const metadata: Metadata = { title: "Credits and attributions" };

export default function CreditsPage() {
  return (
    <PublicPage
      eyebrow="Credits"
      title="The atlas is built on shared knowledge."
      lead="This prototype identifies the visual and mapping sources used in its interface. Record-level historical claims cite their sources in the seed manifest and record documentation."
    >
      <InfoCard title="Adalaj Stepwell photograph">
        <p><strong className="text-ink">Author:</strong> AnupGandhe. <strong className="text-ink">Source:</strong> <a href="https://commons.wikimedia.org/wiki/File:Adalaj_ki_Vav_Gujarat_240A1370_72.jpg" target="_blank" rel="noreferrer" className="font-semibold text-indigo underline underline-offset-4">File: Adalaj ki Vav Gujarat 240A1370 72.jpg on Wikimedia Commons</a>.</p>
        <p>Licensed under the <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="font-semibold text-indigo underline underline-offset-4">Creative Commons Attribution-ShareAlike 4.0 International license (CC BY-SA 4.0)</a>. The source file is included in the project as supplied; the page uses a CSS crop for its responsive display.</p>
        <p>Attribution: “Adalaj ki Vav Gujarat 240A1370 72.jpg” by AnupGandhe, via Wikimedia Commons, CC BY-SA 4.0.</p>
      </InfoCard>
      <InfoCard title="Map tiles">
        <p>Map tiles are provided by OpenStreetMap contributors. Attribution is displayed on the map in accordance with <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="font-semibold text-indigo underline underline-offset-4">OpenStreetMap copyright and attribution guidance</a>. OpenStreetMap data are available under the Open Database License (ODbL).</p>
      </InfoCard>
      <InfoCard title="Research records">
        <p>The five example records identify Gujarat Tourism or UNESCO source listings in <code className="rounded bg-sandstone px-1.5 py-0.5 text-xs text-ink">seed/records.json</code>. Each entry includes a source URL and notes for claims or coordinates that remain uncertain.</p>
      </InfoCard>
    </PublicPage>
  );
}
