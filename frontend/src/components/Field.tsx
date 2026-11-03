import type { ReactNode } from "react";

interface FieldProps {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ id, label, hint, error, required = false, children, className = "" }: FieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
        {required ? <span className="ml-1 text-terracotta-ink" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {hint ? <p id={`${id}-hint`} className="text-xs leading-5 text-muted">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-[#8E2924]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
