import type { RecordStatus } from "@/types/api";

const PIPELINE_STAGES = [
  { id: "preprocess", label: "Preprocess" },
  { id: "ocr", label: "OCR" },
  { id: "extract", label: "Extract" },
  { id: "translate", label: "Translate" },
  { id: "embed", label: "Embed" },
  { id: "save", label: "Save" },
] as const;

interface StepperProps {
  status: RecordStatus;
  stage: string | null;
}

export function Stepper({ status, stage }: StepperProps) {
  const currentIndex = PIPELINE_STAGES.findIndex((item) => item.id === stage);
  const activeIndex = currentIndex < 0 ? 0 : currentIndex;
  const complete = status === "needs_review" || status === "approved";

  return (
    <section aria-label="Processing progress" className="rounded-2xl border border-line bg-paper p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta-ink">Processing path</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-indigo">From scan to review</h2>
        </div>
        <p className="text-sm text-muted">
          {complete ? "All stages complete" : status === "failed" ? "Needs attention" : `Now: ${PIPELINE_STAGES[activeIndex]?.label ?? "Preprocess"}`}
        </p>
      </div>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {PIPELINE_STAGES.map((item, index) => {
          const isDone = complete || index < activeIndex;
          const isFailed = status === "failed" && index === activeIndex;
          const isCurrent = !complete && status !== "failed" && index === activeIndex;
          const stateLabel = isDone ? "Complete" : isFailed ? "Failed" : isCurrent ? "In progress" : "Waiting";
          return (
            <li key={item.id} aria-current={isCurrent ? "step" : undefined} className={`flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 ${isDone ? "border-[#B7D9C1] bg-[#F1F7F1]" : isFailed ? "border-[#E8C2BD] bg-[#FCEBE8]" : isCurrent ? "border-indigo bg-indigo text-white" : "border-line bg-sandstone/55 text-muted"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold ${isDone ? "border-[#287344] bg-[#287344] text-white" : isFailed ? "border-[#9C3931] bg-[#9C3931] text-white" : isCurrent ? "animate-current-stage border-white bg-white text-indigo" : "border-line bg-paper text-muted"}`} aria-hidden="true">
                {isDone ? "✓" : isFailed ? "!" : String(index + 1).padStart(2, "0")}
              </span>
              <span className={`min-w-0 ${isCurrent ? "text-white" : isFailed ? "text-[#872E28]" : isDone ? "text-[#185B35]" : "text-muted"}`}>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block text-[11px] leading-4 opacity-80">{stateLabel}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
