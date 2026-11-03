"use client";

import { useState, type ChangeEvent, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { InlineAlert } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { SourceImage } from "@/components/SourceImage";
import { TagInput } from "@/components/TagInput";
import { ApiError, api } from "@/lib/api";
import { MONUMENT_TYPES, monumentTypeSchema, type MonumentType, type RecordOut, type RecordPatch } from "@/types/api";

type ToastTone = "success" | "error" | "info";

type ReviewDraft = {
  title: string;
  monument_type: MonumentType | null;
  period: string;
  materials: string[];
  features: string[];
  language: string;
  original_text: string;
  english_text: string;
  summary: string;
};

interface RecordEditorProps {
  record: RecordOut;
  recordId: string;
  setRecord: Dispatch<SetStateAction<RecordOut | null>>;
  notify: (message: string, tone?: ToastTone) => void;
}

type BusyAction = "save" | "approve" | null;

function toDraft(record: RecordOut): ReviewDraft {
  return {
    title: record.title ?? "",
    monument_type: record.monument_type,
    period: record.period ?? "",
    materials: record.materials,
    features: record.features,
    language: record.language ?? "",
    original_text: record.original_text ?? "",
    english_text: record.english_text ?? "",
    summary: record.summary ?? "",
  };
}

function toPatch(draft: ReviewDraft): RecordPatch {
  const cleanTags = (tags: string[]) => tags.map((tag) => tag.trim()).filter(Boolean);
  return {
    title: draft.title.trim() || null,
    monument_type: draft.monument_type,
    period: draft.period.trim() || null,
    materials: cleanTags(draft.materials),
    features: cleanTags(draft.features),
    language: draft.language.trim() || null,
    original_text: draft.original_text.trim() || null,
    english_text: draft.english_text.trim() || null,
    summary: draft.summary.trim() || null,
  };
}

function readableType(type: MonumentType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function confidenceTone(confidence: number | null): "good" | "caution" | "low" | "neutral" {
  if (confidence === null) return "neutral";
  if (confidence >= 80) return "good";
  if (confidence >= 55) return "caution";
  return "low";
}

function friendlyMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function RecordEditor({ record, recordId, setRecord, notify }: RecordEditorProps) {
  const [draft, setDraft] = useState<ReviewDraft>(() => toDraft(record));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(toDraft(record)));
  const [busy, setBusy] = useState<BusyAction>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const readOnly = record.status === "approved";
  const confidence = record.ocr_confidence;
  const confidenceLabel = confidence === null ? "OCR confidence unavailable" : `OCR confidence ${Math.round(confidence)}%`;
  const confidenceColor = confidenceTone(confidence);
  const warning = record.warning || (confidence !== null && confidence < 55
    ? "OCR confidence is low. Check names, dates, and place details against the original source before approving."
    : null);
  const hasUnsavedChanges = JSON.stringify(draft) !== savedSnapshot;

  function updateDraft<Key extends keyof ReviewDraft>(key: Key, value: ReviewDraft[Key]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function persistDraft(): Promise<RecordOut> {
    const patch = toPatch(draft);
    const previous = record;
    // Reflect only safe, local text edits optimistically; restore the previous record if PATCH fails.
    setRecord({
      ...record,
      title: draft.title.trim() || null,
      monument_type: draft.monument_type,
      period: draft.period.trim() || null,
      materials: draft.materials.map((tag) => tag.trim()).filter(Boolean),
      features: draft.features.map((tag) => tag.trim()).filter(Boolean),
      language: draft.language.trim() || null,
      original_text: draft.original_text.trim() || null,
      english_text: draft.english_text.trim() || null,
      summary: draft.summary.trim() || null,
    });
    try {
      const saved = await api.patchRecord(recordId, patch);
      setRecord(saved);
      const savedDraft = toDraft(saved);
      setDraft(savedDraft);
      setSavedSnapshot(JSON.stringify(savedDraft));
      return saved;
    } catch (error: unknown) {
      setRecord(previous);
      throw error;
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy("save");
    setActionError(null);
    try {
      await persistDraft();
      notify("Review changes saved.", "success");
    } catch (error: unknown) {
      const message = friendlyMessage(error, "Changes could not be saved. Please try again.");
      setActionError(message);
      notify(message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove(): Promise<void> {
    setBusy("approve");
    setActionError(null);
    try {
      await persistDraft();
      const approved = await api.approveRecord(recordId);
      setRecord(approved);
      const approvedDraft = toDraft(approved);
      setDraft(approvedDraft);
      setSavedSnapshot(JSON.stringify(approvedDraft));
      notify("Record approved and published.", "success");
    } catch (error: unknown) {
      const message = friendlyMessage(error, "The record could not be approved. Your review edits are still here.");
      setActionError(message);
      notify(message, "error");
    } finally {
      setBusy(null);
    }
  }

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>): void {
    const parsed = monumentTypeSchema.safeParse(event.currentTarget.value);
    updateDraft("monument_type", parsed.success ? parsed.data : null);
  }

  return (
    <>
      {warning ? <InlineAlert title="Please review the extracted text" message={warning} tone="warning" /> : null}
      {actionError ? <InlineAlert title="Your action needs attention" message={actionError} /> : null}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] xl:gap-8">
        <aside className="space-y-5">
          <SourceImage recordId={recordId} title={record.title || record.place_name || "heritage record"} />
          <section className="rounded-2xl border border-line bg-paper p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta-ink">Site context</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-indigo">{record.place_name || "Place name not provided"}</h2>
            {record.region ? <p className="mt-1 text-sm text-muted">{record.region}</p> : null}
            {record.lat !== null && record.lng !== null ? (
              <p className="mt-3 font-mono text-xs leading-5 text-muted">{record.lat.toFixed(5)}, {record.lng.toFixed(5)}</p>
            ) : null}
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">OCR confidence</p>
              <div className="mt-2"><Badge tone={confidenceColor}>{confidenceLabel}</Badge></div>
            </div>
          </section>
        </aside>

        <section className="rounded-3xl border border-line bg-paper p-5 shadow-folio sm:p-7" aria-labelledby="metadata-heading">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta-ink">Catalogue record</p>
              <h2 id="metadata-heading" className="mt-2 font-display text-2xl font-semibold text-indigo">Check the details</h2>
            </div>
            <Badge tone={confidenceColor}>{confidenceLabel}</Badge>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="record-title" label="Title">
                <input id="record-title" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} disabled={readOnly || busy !== null} className="min-h-12 w-full rounded-xl border border-line bg-paper px-4 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15 disabled:bg-sandstone/50" />
              </Field>
              <Field id="record-type" label="Monument type">
                <select id="record-type" value={draft.monument_type ?? ""} onChange={handleTypeChange} disabled={readOnly || busy !== null} className="min-h-12 w-full rounded-xl border border-line bg-paper px-4 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15 disabled:bg-sandstone/50">
                  <option value="">Not classified</option>
                  {MONUMENT_TYPES.map((type) => <option key={type} value={type}>{readableType(type)}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="record-period" label="Period">
                <input id="record-period" value={draft.period} onChange={(event) => updateDraft("period", event.target.value)} disabled={readOnly || busy !== null} placeholder="e.g. 15th century" className="min-h-12 w-full rounded-xl border border-line bg-paper px-4 text-sm text-ink placeholder:text-muted/75 focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15 disabled:bg-sandstone/50" />
              </Field>
              <Field id="record-language" label="Language">
                <input id="record-language" value={draft.language} onChange={(event) => updateDraft("language", event.target.value)} disabled={readOnly || busy !== null} placeholder="e.g. Gujarati" className="min-h-12 w-full rounded-xl border border-line bg-paper px-4 text-sm text-ink placeholder:text-muted/75 focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15 disabled:bg-sandstone/50" />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TagInput id="record-materials" label="Materials" tags={draft.materials} onChange={(tags) => updateDraft("materials", tags)} placeholder="Add a material" disabled={readOnly || busy !== null} />
              <TagInput id="record-features" label="Features" tags={draft.features} onChange={(tags) => updateDraft("features", tags)} placeholder="Add a feature" disabled={readOnly || busy !== null} />
            </div>

            <Field id="record-original-text" label="Original text">
              <textarea id="record-original-text" rows={5} value={draft.original_text} onChange={(event) => updateDraft("original_text", event.target.value)} disabled={readOnly || busy !== null} className="w-full resize-y rounded-xl border border-line bg-paper px-4 py-3 text-sm leading-6 text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15 disabled:bg-sandstone/50" />
            </Field>
            <Field id="record-english-text" label="English text">
              <textarea id="record-english-text" rows={5} value={draft.english_text} onChange={(event) => updateDraft("english_text", event.target.value)} disabled={readOnly || busy !== null} className="w-full resize-y rounded-xl border border-line bg-paper px-4 py-3 text-sm leading-6 text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15 disabled:bg-sandstone/50" />
            </Field>
            <Field id="record-summary" label="Summary">
              <textarea id="record-summary" rows={4} value={draft.summary} onChange={(event) => updateDraft("summary", event.target.value)} disabled={readOnly || busy !== null} className="w-full resize-y rounded-xl border border-line bg-paper px-4 py-3 text-sm leading-6 text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15 disabled:bg-sandstone/50" />
            </Field>

            {!readOnly ? (
              <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted">Review extracted facts against the source before approving.</p>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="secondary" disabled={busy !== null || !hasUnsavedChanges}>
                    {busy === "save" ? "Saving…" : "Save changes"}
                  </Button>
                  <Button type="button" onClick={() => void handleApprove()} disabled={busy !== null}>
                    {busy === "approve" ? "Approving…" : "Approve & publish"}
                  </Button>
                </div>
              </div>
            ) : null}
          </form>
        </section>
      </div>
    </>
  );
}
