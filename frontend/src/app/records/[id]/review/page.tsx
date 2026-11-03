"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState, ErrorRetryButton, InlineAlert, LoadingSkeleton } from "@/components/Feedback";
import { RecordEditor } from "@/components/RecordEditor";
import { Stepper } from "@/components/Stepper";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";
import { usePolling } from "@/lib/usePolling";
import type { RecordOut } from "@/types/api";

const RETRY_START_GRACE_MS = 30_000;

function isTerminal(record: RecordOut): boolean {
  return record.status === "needs_review" || record.status === "failed" || record.status === "approved";
}

function statusLabel(status: RecordOut["status"]): string {
  const label = status.replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function statusTone(status: RecordOut["status"]): "good" | "caution" | "low" | "neutral" {
  if (status === "approved") return "good";
  if (status === "needs_review") return "caution";
  if (status === "failed") return "low";
  return "neutral";
}

function ReviewScreen({ recordId }: Readonly<{ recordId: string }>) {
  const { notify } = useToast();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retryPending, setRetryPending] = useState(false);
  const [retryBaselineUpdatedAt, setRetryBaselineUpdatedAt] = useState<string | null>(null);
  useEffect(() => {
    if (!retryPending) return;
    const timeout = window.setTimeout(() => setRetryPending(false), RETRY_START_GRACE_MS);
    return () => window.clearTimeout(timeout);
  }, [retryPending]);
  const isPollingTerminal = useCallback((value: RecordOut): boolean => {
    const isUnchangedFailedRow = retryPending
      && retryBaselineUpdatedAt !== null
      && value.status === "failed"
      && value.updated_at === retryBaselineUpdatedAt;
    return isUnchangedFailedRow ? false : isTerminal(value);
  }, [retryBaselineUpdatedAt, retryPending]);
  const fetchRecord = useCallback((signal: AbortSignal) => api.getRecord(recordId, signal), [recordId]);
  const { data: record, setData: setRecord, error: pollError, loading, refresh } = usePolling(
    fetchRecord,
    true,
    isPollingTerminal,
    1500,
  );
  const createdDate = record ? new Date(record.created_at) : null;
  const createdLabel = createdDate && !Number.isNaN(createdDate.valueOf()) ? createdDate.toISOString().slice(0, 10) : null;
  const retryQueued = retryPending
    && retryBaselineUpdatedAt !== null
    && record?.status === "failed"
    && record.updated_at === retryBaselineUpdatedAt;
  const shownStatus = retryQueued ? "processing" : record?.status ?? "uploaded";

  async function handleRetry(): Promise<void> {
    if (!record) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await api.retryRecord(recordId);
      setRetryBaselineUpdatedAt(record.updated_at);
      setRetryPending(true);
      setRecord((current) => current ? { ...current, status: "processing", error: null } : current);
      refresh();
      notify("Retry queued. This page will follow processing from the saved stage.", "success");
    } catch (caught: unknown) {
      const message = caught instanceof ApiError
        ? caught.message
        : "The record could not be retried. Please try again.";
      setRetryError(message);
      notify(message, "error");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <div>
          <Link href="/upload" className="text-sm font-semibold text-indigo underline decoration-indigo/35 underline-offset-4 hover:decoration-indigo">← Upload another record</Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-terracotta-ink">02 / Review desk</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-indigo sm:text-4xl">{record?.title || record?.place_name || "Record review"}</h1>
        </div>
        {record ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(shownStatus)}>{statusLabel(shownStatus)}</Badge>
            {createdLabel ? <span className="text-xs text-muted">Created {createdLabel}</span> : null}
          </div>
        ) : null}
      </div>

      {!record && loading ? <LoadingSkeleton lines={5} /> : null}
      {!record && !loading && pollError ? (
        <InlineAlert title="This record could not be loaded" message={pollError.message}>
          <ErrorRetryButton onClick={refresh} />
        </InlineAlert>
      ) : null}
      {!record && !loading && !pollError ? (
        <EmptyState title="No record is available" message="The record may have been removed or the link may be incomplete." action={{ href: "/upload", label: "Return to upload" }} />
      ) : null}

      {record ? (
        <div className="space-y-6">
          <Stepper status={shownStatus} stage={record.pipeline_stage} />
          {pollError ? <InlineAlert title="Could not refresh this record" message={pollError.message} tone="warning" /> : null}
          {shownStatus === "uploaded" || shownStatus === "processing" ? (
            <div className="space-y-5">
              <InlineAlert
                title={retryQueued ? "Your retry is queued" : "Your record is being prepared"}
                message={retryQueued
                  ? "The retry has been accepted. Waiting for the worker to start from the saved stage."
                  : "Processing runs in the background. This page checks for updates every 1.5 seconds, so it is safe to refresh or return later."}
                tone="info"
              />
              <LoadingSkeleton lines={2} />
            </div>
          ) : null}
          {record.status === "failed" && !retryQueued ? (
            <div className="space-y-5">
              <InlineAlert
                title="Processing needs another try"
                message={`Processing stopped at ${record.pipeline_stage?.replaceAll("_", " ") || "the last saved stage"}. Retry will resume from that checkpoint.`}
              />
              {retryError ? <InlineAlert title="Retry not queued" message={retryError} /> : null}
              <Button type="button" onClick={() => void handleRetry()} disabled={retrying}>
                {retrying ? "Queueing retry…" : "Retry processing"}
              </Button>
            </div>
          ) : null}
          {record.status === "needs_review" || record.status === "approved" ? (
            <>
              {record.status === "approved" ? <InlineAlert title="Approved and published" message="This record is read-only now and is ready for the Explore destination." tone="info" /> : null}
              <RecordEditor key={record.id} record={record} recordId={recordId} setRecord={setRecord} notify={notify} />
            </>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  return <ReviewScreen key={params.id} recordId={params.id} />;
}
