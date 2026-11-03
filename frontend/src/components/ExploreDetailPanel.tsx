"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { RecordOut, SearchResult } from "@/types/api";

interface ExploreDetailPanelProps {
  record: RecordOut;
  searchResult?: SearchResult | undefined;
  onClose: () => void;
}

function displayType(type: RecordOut["monument_type"]): string {
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : "Unclassified";
}

function RecordImage({ record }: Readonly<{ record: RecordOut }>) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api.getRecordImage(record.id, controller.signal)
      .then((image) => { if (!controller.signal.aborted) setUrl(image.signed_url); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [record.id]);

  if (url) {
    return <div className="relative aspect-[16/9] w-full overflow-hidden bg-sandstone"><Image src={url} alt={`Source image for ${record.title || record.place_name || "heritage record"}`} fill unoptimized sizes="(max-width: 768px) 100vw, 26rem" className="object-cover" /></div>;
  }
  return (
    <div className="grid aspect-[16/9] place-items-center bg-indigo/5 px-6 text-center" aria-label="Private record image">
      <p className="text-sm text-muted">{failed ? "Source image is unavailable." : "Loading source image…"}</p>
    </div>
  );
}

export function ExploreDetailPanel({ record, searchResult, onClose }: ExploreDetailPanelProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const mainText = showOriginal ? record.original_text : record.english_text || record.summary;

  return (
    <section className="absolute inset-x-0 bottom-0 z-[500] max-h-[78%] overflow-y-auto rounded-t-3xl border border-line bg-paper shadow-folio transition-transform duration-300 md:inset-y-4 md:right-4 md:left-auto md:max-h-none md:w-[26rem] md:rounded-3xl" aria-labelledby="explore-record-title" aria-label="Heritage record details">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-5 py-3 backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta-ink">Atlas record</p>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-line text-lg font-semibold text-indigo hover:bg-indigo/5" aria-label="Close record details">×</button>
      </div>
      <RecordImage record={record} />
      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-terracotta-ink">
            <span>{displayType(record.monument_type)}</span>
            {record.period ? <span aria-hidden="true">·</span> : null}
            {record.period ? <span>{record.period}</span> : null}
          </div>
          <h2 id="explore-record-title" className="mt-2 font-display text-3xl font-semibold leading-tight text-indigo">{record.title || record.place_name || "Untitled heritage record"}</h2>
          {record.place_name ? <p className="mt-2 text-sm text-muted">{record.place_name}{record.region ? ` · ${record.region}` : ""}</p> : null}
        </div>

        {searchResult ? (
          <div className="rounded-xl border border-indigo/15 bg-indigo/5 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo">Semantic match · {(searchResult.similarity * 100).toFixed(0)}%</p>
            <p className="mt-1 text-sm leading-5 text-muted">{searchResult.why_matched}</p>
          </div>
        ) : null}

        {record.summary ? <p className="text-sm leading-6 text-ink">{record.summary}</p> : null}

        {record.features.length > 0 ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Features</h3>
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="Record features">
              {record.features.map((feature) => <li key={feature} className="rounded-full border border-line bg-sandstone/50 px-3 py-1.5 text-xs font-medium text-ink">{feature}</li>)}
            </ul>
          </div>
        ) : null}

        {record.english_text || record.original_text ? (
          <div className="border-t border-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-muted">{showOriginal ? `Original${record.language ? ` · ${record.language}` : ""}` : "English text"}</h3>
              {record.original_text ? (
                <button type="button" onClick={() => setShowOriginal((current) => !current)} className="text-xs font-semibold text-indigo underline decoration-indigo/40 underline-offset-4">
                  {showOriginal ? "Show English" : "Show original"}
                </button>
              ) : null}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink" lang={showOriginal ? undefined : "en"}>{mainText || "No transcription is available."}</p>
          </div>
        ) : null}

        {record.materials.length > 0 ? <p className="text-xs leading-5 text-muted">Materials: {record.materials.join(", ")}</p> : null}
        {record.lat !== null && record.lng !== null ? <p className="font-mono text-xs text-muted">{record.lat.toFixed(5)}, {record.lng.toFixed(5)}</p> : null}
        {record.source_url ? (
          <section className="border-t border-line pt-4" aria-label="Source citation">
            <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Source</h3>
            <a href={record.source_url} target="_blank" rel="noreferrer" className="mt-2 block break-words text-sm font-semibold text-indigo underline decoration-indigo/35 underline-offset-4">
              {record.source_title || "Open cited source"} ↗
            </a>
          </section>
        ) : null}
        {record.verification_notes.length > 0 ? (
          <section className="rounded-xl border border-[#E7D5B5] bg-[#FBF4E7] p-4" aria-label="Unresolved verification notes">
            <h3 className="text-xs font-bold uppercase tracking-[0.13em] text-[#755323]">What remains uncertain</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-[#665A48]">
              {record.verification_notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </section>
        ) : null}
        <p className="border-t border-line pt-4 text-xs leading-5 text-muted">Human-reviewed before publication. Details may be revised as new evidence is added.</p>
      </div>
    </section>
  );
}
