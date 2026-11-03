"use client";

import { useEffect, useState } from "react";
import { ExploreMap } from "@/components/ExploreMap";
import { api } from "@/lib/api";
import type { RecordOut } from "@/types/api";

export function LandingMapPreview() {
  const [records, setRecords] = useState<RecordOut[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    api.getApprovedRecords(undefined, controller.signal)
      .then((collection) => {
        if (controller.signal.aborted) return;
        const mapped = collection.features
          .filter((feature) => feature.geometry !== null)
          .map((feature) => ({
            ...feature.properties,
            lng: feature.geometry?.coordinates[0] ?? feature.properties.lng,
            lat: feature.geometry?.coordinates[1] ?? feature.properties.lat,
          }));
        setRecords(mapped);
      })
      .catch(() => { if (!controller.signal.aborted) setRecords([]); });
    return () => controller.abort();
  }, []);

  return (
    <div className="h-[19rem] overflow-hidden rounded-2xl border border-line bg-[#E8E3D9] sm:h-[23rem]">
      <ExploreMap records={records} selectedId={null} activeIds={null} hoveredId={null} onSelect={() => undefined} />
    </div>
  );
}
