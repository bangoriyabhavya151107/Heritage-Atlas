"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";

export function SourceImage({ recordId, title }: Readonly<{ recordId: string; title: string }>) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState(false);

  const loadUrl = useCallback(async (signal?: AbortSignal): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const image = await api.getRecordImage(recordId, signal);
      setSignedUrl(image.signed_url);
      return image.signed_url;
    } catch (caught: unknown) {
      if (signal?.aborted) return null;
      const message = caught instanceof ApiError ? caught.message : "The source image could not be loaded.";
      setError(message);
      return null;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    const controller = new AbortController();
    api.getRecordImage(recordId, controller.signal)
      .then((image) => {
        if (!controller.signal.aborted) {
          setSignedUrl(image.signed_url);
          setLoading(false);
        }
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        const message = caught instanceof ApiError ? caught.message : "The source image could not be loaded.";
        setError(message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [recordId]);

  useEffect(() => {
    if (!zoomed) return;
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") setZoomed(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [zoomed]);

  async function openZoom(): Promise<void> {
    const freshUrl = await loadUrl();
    if (freshUrl) setZoomed(true);
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-line bg-paper" aria-label="Source image">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta-ink">Original source</h2>
        </div>
        {signedUrl ? (
          <button type="button" onClick={() => void openZoom()} className="group relative block aspect-[4/3] w-full bg-sandstone/70 text-left" aria-label="Open source image zoom view">
            <Image src={signedUrl} alt={`Uploaded source for ${title}`} fill unoptimized sizes="(max-width: 1280px) 100vw, 32vw" className="object-contain p-2 transition-transform group-hover:scale-[1.02]" />
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-semibold text-white">Open zoom</span>
          </button>
        ) : (
          <div className="grid aspect-[4/3] place-items-center bg-sandstone/60 px-6 text-center">
            <div>
              <p className="font-display text-xl font-semibold text-indigo">{loading ? "Loading source image…" : "Source image unavailable"}</p>
              {error ? <p className="mt-2 max-w-xs text-sm leading-6 text-muted">{error}</p> : null}
              {!loading ? <button type="button" onClick={() => void loadUrl()} className="mt-3 text-sm font-semibold text-indigo underline underline-offset-4">Try again</button> : null}
            </div>
          </div>
        )}
      </section>

      {zoomed && signedUrl ? (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-ink/90 p-4" role="dialog" aria-modal="true" aria-label={`Zoomed source image: ${title}`} onClick={() => setZoomed(false)}>
          <button type="button" onClick={() => setZoomed(false)} className="absolute right-4 top-4 rounded-full bg-paper px-4 py-2 text-sm font-semibold text-indigo" aria-label="Close image zoom">Close</button>
          <Image src={signedUrl} alt={`Zoomed source for ${title}`} width={1600} height={1200} unoptimized className="max-h-[88vh] max-w-[94vw] object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </>
  );
}
