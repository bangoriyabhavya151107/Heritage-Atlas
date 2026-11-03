"use client";

import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    setSubmitted(true);
    event.currentTarget.reset();
  }

  return (
    <section className="rounded-2xl border border-line bg-paper p-5 shadow-folio sm:p-7" aria-labelledby="contact-form-title">
      <h2 id="contact-form-title" className="font-display text-2xl font-semibold text-indigo">Send a note</h2>
      <p className="mt-2 text-sm leading-6 text-muted">This prototype validates your message in the browser only. It does not send or store it.</p>
      {submitted ? <p className="mt-4 rounded-xl border border-[#B8CFB9] bg-[#EEF6EF] p-4 text-sm leading-6 text-[#285A38]" role="status">Thanks—your message passed the form checks. No email was sent; this prototype has no contact backend yet.</p> : null}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold text-ink">Name</label>
          <input id="contact-name" name="name" type="text" autoComplete="name" maxLength={120} required className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15" />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold text-ink">Email</label>
          <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15" />
        </div>
        <div>
          <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold text-ink">Message</label>
          <textarea id="contact-message" name="message" rows={5} minLength={10} maxLength={4000} required className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm leading-6 text-ink focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15" />
          <p className="mt-1 text-xs text-muted">10–4,000 characters. Validated in this browser only; the message is cleared on submit.</p>
        </div>
        <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-indigo px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo/90">Check message</button>
      </form>
    </section>
  );
}
