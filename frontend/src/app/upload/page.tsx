"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { LocationPicker } from "@/components/LocationPicker";
import { useToast } from "@/components/Toast";
import { ApiError, api } from "@/lib/api";
import type { Coordinates } from "@/types/geography";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Choose a JPEG, PNG, or WebP image.";
  if (file.size > MAX_IMAGE_BYTES) return "This image is larger than 8 MB. Choose a smaller file.";
  if (file.size === 0) return "This image file is empty. Choose another file.";
  return null;
}

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [placeNameError, setPlaceNameError] = useState<string | undefined>();
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | undefined>();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectFile(candidate: File | undefined): void {
    if (!candidate) return;
    const validationError = validateImage(candidate);
    if (validationError) {
      setFile(null);
      setPreviewUrl(null);
      setFileError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
    setFileError(undefined);
    setRequestError(null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files.item(0) ?? undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setRequestError(null);
    const nextPlaceNameError = placeName.trim() ? undefined : "Enter the place name.";
    const nextLocationError = coordinates ? undefined : "Choose a location on the map or use your device location.";
    setPlaceNameError(nextPlaceNameError);
    setLocationError(nextLocationError);

    const selectedFile = file;
    const selectedCoordinates = coordinates;
    const cleanedPlaceName = placeName.trim();
    if (!selectedFile || !cleanedPlaceName || !selectedCoordinates || nextPlaceNameError || nextLocationError) {
      if (!selectedFile) setFileError("Choose a JPEG, PNG, or WebP image up to 8 MB.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createRecord({
        image: selectedFile,
        placeName: cleanedPlaceName,
        lat: selectedCoordinates.lat,
        lng: selectedCoordinates.lng,
      });
      notify("Scan uploaded. Processing has started.", "success");
      router.push(`/records/${created.id}/review`);
    } catch (caught: unknown) {
      const message = caught instanceof ApiError
        ? caught.message
        : "The image could not be uploaded. Please check your details and try again.";
      setRequestError(message);
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  function removeFile(): void {
    setFile(null);
    setPreviewUrl(null);
    setFileError(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-9 sm:px-8 sm:pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-6">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-terracotta-ink">01 / Field intake</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-indigo sm:text-5xl">Give the scan a place to begin.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">Add one clear image and a location. Heritage Atlas will prepare the record for your review.</p>
        </div>
        <div className="hidden items-center gap-3 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted md:flex">
          <span className="h-px w-12 bg-terracotta" />
          Field notes · Record 01
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)] lg:gap-8">
        <section className="rounded-3xl border border-line bg-paper p-5 shadow-folio sm:p-7" aria-labelledby="image-section-title">
          <div className="mb-5 flex items-start gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo text-xs font-bold text-white" aria-hidden="true">01</span>
            <div>
              <h2 id="image-section-title" className="font-display text-2xl font-semibold text-indigo">The source image</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Use a photograph or a legible scan of a heritage source.</p>
            </div>
          </div>

          <Field id="image-file" label="Scanned image" hint="JPEG, PNG, or WebP · maximum 8 MB." error={fileError} required>
            <div
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }}
              onDrop={handleDrop}
              className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors focus-within:ring-2 focus-within:ring-indigo/25 ${isDragging ? "border-terracotta bg-terracotta/5" : file ? "border-line bg-sandstone/50" : "border-[#CFC4B4] bg-sandstone/45 hover:border-indigo/45"}`}
            >
              {previewUrl ? (
                <div className="relative aspect-[16/9] w-full">
                  <Image src={previewUrl} alt={`Preview of ${file?.name ?? "selected image"}`} fill unoptimized className="object-contain" sizes="(max-width: 1024px) 100vw, 60vw" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-medium text-white">{file?.name} · {file ? formatFileSize(file.size) : ""}</span>
                </div>
              ) : (
                <div className="grid min-h-64 place-items-center p-6 text-center sm:min-h-72">
                  <div>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo/8 text-indigo" aria-hidden="true">
                      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
                        <path d="M16 21V8m0 0l-5 5m5-5l5 5M7 20v5a2 2 0 002 2h14a2 2 0 002-2v-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <p className="mt-4 font-semibold text-ink">Drop the scan here, or browse files</p>
                    <p className="mt-1 text-sm text-muted">A single image · up to 8 MB</p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                id="image-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => selectFile(event.currentTarget.files?.[0])}
                aria-describedby={fileError ? "image-file-hint image-file-error" : "image-file-hint"}
                aria-invalid={Boolean(fileError)}
                aria-label="Choose JPEG, PNG, or WebP image"
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              />
              {file ? (
                <button type="button" onClick={removeFile} className="absolute right-3 top-3 z-20 rounded-full bg-paper px-3 py-2 text-xs font-semibold text-indigo shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo" aria-label="Remove selected image">
                  Remove image
                </button>
              ) : null}
            </div>
          </Field>

          <div className="mt-6">
            <Field id="place-name" label="Place name" hint="Use the name a local researcher would recognize." error={placeNameError} required>
              <input
                id="place-name"
                type="text"
                value={placeName}
                onChange={(event) => { setPlaceName(event.target.value); if (event.target.value.trim()) setPlaceNameError(undefined); }}
                maxLength={300}
                placeholder="e.g. Adalaj Stepwell"
                autoComplete="off"
                aria-describedby={placeNameError ? "place-name-hint place-name-error" : "place-name-hint"}
                aria-invalid={Boolean(placeNameError)}
                className={`min-h-12 w-full rounded-xl border bg-paper px-4 text-base text-ink placeholder:text-muted/75 focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15 ${placeNameError ? "border-[#9C3931]" : "border-line"}`}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-paper p-5 shadow-folio sm:p-7" aria-labelledby="location-section-title">
          <div className="mb-5 flex items-start gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo text-xs font-bold text-white" aria-hidden="true">02</span>
            <div>
              <h2 id="location-section-title" className="font-display text-2xl font-semibold text-indigo">Place the pin</h2>
              <p className="mt-1 text-sm leading-6 text-muted">A location helps the record find its place in the atlas.</p>
            </div>
          </div>
          <LocationPicker value={coordinates} onChange={(point) => { setCoordinates(point); setLocationError(undefined); }} error={locationError} />
        </section>

        <div className="lg:col-span-2">
          {requestError ? (
            <div className="mb-4 rounded-2xl border border-[#E8C2BD] bg-[#FCEBE8] px-4 py-3 text-sm leading-6 text-[#872E28]" role="alert">
              <span className="font-semibold">Upload not sent.</span> {requestError}
            </div>
          ) : null}
          <div className="flex flex-col-reverse gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-xs leading-5 text-muted">Images are uploaded to private storage. Processing runs in the background; this page will open the record review when the upload is accepted.</p>
            <Button type="submit" disabled={submitting} className="min-w-52">
              {submitting ? "Sending scan…" : "Send to review"}
              {!submitting ? <span aria-hidden="true">→</span> : null}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
