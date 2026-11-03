export function ImagePlaceholder() {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-[#EAE0D0]" aria-label="Original image preview">
      <div className="grid aspect-[4/3] place-items-center p-6 text-center">
        <div className="max-w-xs">
          <svg viewBox="0 0 64 64" className="mx-auto h-14 w-14 text-indigo/65" fill="none" aria-hidden="true">
            <rect x="8" y="11" width="48" height="42" rx="5" stroke="currentColor" strokeWidth="2" />
            <path d="M15 45l12-12 8 8 6-6 9 10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <circle cx="23" cy="24" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M18 57h28" stroke="#C65D3B" strokeLinecap="round" strokeWidth="3" />
          </svg>
          <h2 className="mt-4 font-display text-xl font-semibold text-indigo">Original image preview</h2>
          <p className="mt-2 text-sm leading-6 text-muted">The image is stored privately and is not available to this browser yet. Your uploaded file remains protected.</p>
        </div>
      </div>
      <div className="border-t border-line bg-paper/70 px-4 py-3 text-xs leading-5 text-muted">
        Private storage · preview not enabled in this phase
      </div>
    </section>
  );
}
