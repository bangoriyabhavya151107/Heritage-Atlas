import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/Button";

export function LoadingSkeleton({ lines = 3 }: Readonly<{ lines?: number }>) {
  return (
    <div className="animate-pulse space-y-4 rounded-2xl border border-line bg-paper p-6" aria-label="Loading" role="status">
      <span className="sr-only">Loading record details</span>
      <div className="h-6 w-1/3 rounded bg-line/70" />
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className={`h-12 rounded-xl bg-line/55 ${index % 2 === 0 ? "w-full" : "w-4/5"}`} />
      ))}
    </div>
  );
}

export function InlineAlert({ title, message, tone = "error", children }: Readonly<{
  title: string;
  message: string;
  tone?: "error" | "warning" | "info";
  children?: ReactNode;
}>) {
  const palette = tone === "error"
    ? "border-[#E8C2BD] bg-[#FCEBE8] text-[#872E28]"
    : tone === "warning"
      ? "border-[#E8D199] bg-[#FFF4D8] text-[#754B05]"
      : "border-indigo/20 bg-indigo/5 text-indigo";
  return (
    <div className={`rounded-2xl border p-4 ${palette}`} role={tone === "error" ? "alert" : "status"}>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-6">{message}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export function EmptyState({ title, message, action }: Readonly<{
  title: string;
  message: string;
  action?: Readonly<{ href: string; label: string }>;
}>) {
  return (
    <section className="rounded-3xl border border-dashed border-line bg-paper/70 px-6 py-12 text-center sm:px-10">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo/8 text-indigo" aria-hidden="true">⌖</span>
      <h2 className="mt-4 font-display text-2xl font-semibold text-indigo">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">{message}</p>
      {action ? <Link href={action.href} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-indigo px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo/90">{action.label}</Link> : null}
    </section>
  );
}

export function ErrorRetryButton({ onClick, disabled = false }: Readonly<{ onClick: () => void; disabled?: boolean }>) {
  return <Button type="button" variant="secondary" onClick={onClick} disabled={disabled}>Try again</Button>;
}
