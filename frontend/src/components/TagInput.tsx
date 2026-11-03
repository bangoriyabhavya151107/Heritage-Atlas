"use client";

import { useState, type KeyboardEvent } from "react";
import { Field } from "@/components/Field";

interface TagInputProps {
  id: string;
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagInput({ id, label, tags, onChange, placeholder, disabled = false }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addDraft(): void {
    const value = draft.trim().replace(/,+$/, "").trim();
    if (!value) return;
    if (!tags.some((tag) => tag.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      onChange([...tags, value]);
    }
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addDraft();
    } else if (event.key === "Backspace" && draft.length === 0 && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <Field id={id} label={label} hint="Press Enter or comma to add a tag.">
      <div className={`flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 focus-within:border-indigo ${disabled ? "opacity-60" : ""}`}>
        {tags.map((tag, index) => (
          <span key={`${tag}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-indigo/8 px-3 py-1 text-sm font-medium text-indigo">
            {tag}
            {!disabled ? (
              <button
                type="button"
                onClick={() => onChange(tags.filter((_, itemIndex) => itemIndex !== index))}
                aria-label={`Remove ${tag}`}
                className="grid h-6 w-6 place-items-center rounded-full text-indigo hover:bg-indigo/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addDraft}
          disabled={disabled}
          placeholder={tags.length === 0 ? placeholder : undefined}
          aria-label={`${label}, add a tag`}
          aria-describedby={`${id}-hint`}
          className="min-w-32 flex-1 border-0 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-muted/80 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
        />
      </div>
    </Field>
  );
}
