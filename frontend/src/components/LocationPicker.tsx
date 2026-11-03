"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { Button } from "@/components/Button";
import type { Coordinates } from "@/types/geography";

interface LocationPickerProps {
  value: Coordinates | null;
  onChange: (coordinates: Coordinates) => void;
  error?: string | undefined;
}

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => <div className="grid min-h-[18rem] place-items-center rounded-xl bg-sandstone text-sm text-muted">Loading map…</div>,
});

export function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const [locationError, setLocationError] = useState<string | null>(null);
  const [finding, setFinding] = useState(false);

  const handleMapChange = useCallback((coordinates: Coordinates) => {
    setLocationError(null);
    onChange(coordinates);
  }, [onChange]);

  function useMyLocation(): void {
    if (!navigator.geolocation) {
      setLocationError("This browser does not provide location access. Select a point on the map instead.");
      return;
    }

    setFinding(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleMapChange({ lat: position.coords.latitude, lng: position.coords.longitude });
        setFinding(false);
      },
      () => {
        setLocationError("Location access was unavailable. You can still choose a point directly on the map.");
        setFinding(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  return (
    <section aria-labelledby="location-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="location-heading" className="text-sm font-semibold text-ink">Location pin <span className="text-terracotta-ink" aria-hidden="true">*</span></h2>
          <p id="location-hint" className="mt-1 text-xs leading-5 text-muted">Click the map or use your device location.</p>
        </div>
        <Button type="button" variant="secondary" onClick={useMyLocation} disabled={finding} aria-describedby="location-hint">
          {finding ? "Finding location…" : "Use my location"}
        </Button>
      </div>

      <div role="region" aria-label="Map for choosing the heritage record location" className="overflow-hidden rounded-xl border border-line">
        <LeafletMap value={value} onChange={handleMapChange} />
      </div>

      {value ? (
        <p className="rounded-xl bg-indigo/5 px-3 py-2 text-sm text-indigo" aria-live="polite">
          <span className="font-semibold">Pinned:</span> {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </p>
      ) : (
        <p className="text-sm text-muted" aria-live="polite">No point selected yet.</p>
      )}
      {error ? <p className="text-sm font-medium text-[#8E2924]" role="alert">{error}</p> : null}
      {locationError ? <p className="text-sm font-medium text-[#8E2924]" role="alert">{locationError}</p> : null}
      <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer" className="inline-block text-xs text-indigo underline decoration-indigo/40 underline-offset-4 hover:decoration-indigo">
        Report a map issue
      </a>
    </section>
  );
}
