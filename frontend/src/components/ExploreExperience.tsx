"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExploreDetailPanel } from "@/components/ExploreDetailPanel";
import { ExploreMap } from "@/components/ExploreMap";
import { ApiError, api } from "@/lib/api";
import { MONUMENT_TYPES, type MonumentType, type RecordOut, type SearchResult } from "@/types/api";

const TYPE_LABELS: Record<MonumentType, string> = {
  stepwell: "Stepwells",
  fort: "Forts",
  temple: "Temples",
  mosque: "Mosques",
  craft: "Craft",
  other: "Other",
};
const TYPE_COLORS: Record<MonumentType, string> = {
  stepwell: "#C65D3B",
  fort: "#7A3C2B",
  temple: "#1F2A5A",
  mosque: "#557A57",
  craft: "#9A6B2F",
  other: "#625E58",
};
const EXAMPLE_QUERIES = ["stepwells with carved pillars", "temples dedicated to the sun"] as const;

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "The atlas could not be reached. Check that the API is running.";
}

export function ExploreExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get("id"));
  const [selectedType, setSelectedType] = useState<MonumentType | null>(null);
  const [records, setRecords] = useState<RecordOut[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [searching, setSearching] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const syncUrl = useCallback((nextQuery: string, nextId: string | null) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextId) params.set("id", nextId);
    const suffix = params.size ? `?${params.toString()}` : "";
    router.replace(`${pathname}${suffix}`, { scroll: false });
  }, [pathname, router]);

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
        setRecordsError(null);
        setLoadingRecords(false);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setRecordsError(errorMessage(caught));
        setLoadingRecords(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const cleanedQuery = query.trim();
    if (!cleanedQuery) {
      const clearTimer = window.setTimeout(() => {
        setResults([]);
        setSearchError(null);
        setSearching(false);
      }, 0);
      return () => window.clearTimeout(clearTimer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      api.searchRecords(cleanedQuery, 10, selectedType ?? undefined, controller.signal)
        .then((matches) => {
          if (!controller.signal.aborted) {
            setResults(matches);
            setSearchError(null);
          }
        })
        .catch((caught: unknown) => {
          if (!controller.signal.aborted) {
            setResults([]);
            setSearchError(errorMessage(caught));
          }
        })
        .finally(() => { if (!controller.signal.aborted) setSearching(false); });
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedType]);

  const visibleRecords = useMemo(() => selectedType
    ? records.filter((record) => record.monument_type === selectedType)
    : records, [records, selectedType]);
  const selectedRecord = useMemo(() => {
    if (!selectedId) return null;
    return visibleRecords.find((record) => record.id === selectedId)
      ?? results.find((result) => result.record.id === selectedId)?.record
      ?? null;
  }, [results, selectedId, visibleRecords]);
  const activeIds = query.trim() && !searching ? results.map((result) => result.record.id) : null;
  const selectedSearchResult = results.find((result) => result.record.id === selectedId);

  const selectRecord = useCallback((record: RecordOut) => {
    setSelectedId(record.id);
    syncUrl(query, record.id);
  }, [query, syncUrl]);

  const closePanel = useCallback(() => {
    setSelectedId(null);
    syncUrl(query, null);
  }, [query, syncUrl]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape" && selectedId) closePanel();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closePanel, selectedId]);

  function updateQuery(nextQuery: string): void {
    setQuery(nextQuery);
    setSearchError(null);
    syncUrl(nextQuery, selectedId);
  }

  function chooseType(type: MonumentType | null): void {
    setSelectedType(type);
    setHoveredId(null);
  }

  function clearSearch(): void {
    setQuery("");
    setResults([]);
    setSearchError(null);
    setSearching(false);
    setHoveredId(null);
    syncUrl("", selectedId);
  }

  return (
    <main className="relative h-[calc(100svh-73px)] min-h-[620px] overflow-hidden bg-[#E8E3D9]" aria-label="Explore the Heritage Atlas">
      <div className="absolute inset-0">
        <ExploreMap
          records={visibleRecords}
          selectedId={selectedId}
          activeIds={activeIds}
          hoveredId={hoveredId}
          onSelect={selectRecord}
        />
      </div>

      <section className="absolute left-3 right-3 top-3 z-[450] max-h-[calc(100%-24px)] overflow-y-auto rounded-2xl border border-line bg-paper/95 p-4 shadow-folio backdrop-blur sm:left-5 sm:top-5 sm:w-[23rem] sm:p-5" aria-label="Semantic search and map filters">
        <label htmlFor="atlas-search" className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta-ink">Search by meaning</label>
        <div className="mt-2 flex gap-2">
          <input
            id="atlas-search"
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.currentTarget.value)}
            placeholder="Try “carved stone pillars”…"
            maxLength={200}
            aria-describedby="atlas-search-help"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-muted/75 focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/15"
          />
          {query ? <button type="button" onClick={clearSearch} className="min-h-12 rounded-xl px-3 text-sm font-semibold text-indigo hover:bg-indigo/5" aria-label="Clear search">Clear</button> : null}
        </div>
        <p id="atlas-search-help" className="mt-2 text-xs leading-5 text-muted">Search approved records by description, features or type.</p>

        <div className="mt-3 flex flex-wrap gap-2" aria-label="Example searches">
          {EXAMPLE_QUERIES.map((example) => (
            <button key={example} type="button" onClick={() => updateQuery(example)} className="rounded-full border border-indigo/20 bg-indigo/5 px-3 py-1.5 text-left text-xs font-medium text-indigo hover:bg-indigo/10">{example}</button>
          ))}
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Filter by type</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => chooseType(null)} aria-pressed={selectedType === null} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selectedType === null ? "border-indigo bg-indigo text-white" : "border-line bg-white text-ink hover:border-indigo/35"}`}>All</button>
            {MONUMENT_TYPES.map((type) => (
              <button key={type} type="button" onClick={() => chooseType(type)} aria-pressed={selectedType === type} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selectedType === type ? "border-indigo bg-indigo text-white" : "border-line bg-white text-ink hover:border-indigo/35"}`}>{TYPE_LABELS[type]}</button>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-line pt-3" aria-live="polite">
          {query.trim() ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Ranked results</p>
                {searching ? <span className="text-xs font-medium text-indigo">Searching…</span> : !searchError ? <span className="text-xs text-muted">{results.length} found</span> : null}
              </div>
              {searchError ? <p className="mt-3 rounded-xl border border-[#E8C2BD] bg-[#FCEBE8] p-3 text-xs leading-5 text-[#872E28]" role="alert">{searchError}</p> : null}
              {!searching && !searchError && results.length === 0 ? <p className="mt-3 rounded-xl bg-sandstone/70 p-3 text-sm leading-5 text-muted">No matching approved records yet. Try a broader phrase or clear the search.</p> : null}
              <ol className="mt-2 space-y-2">
                {results.map((result, index) => (
                  <li key={result.record.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredId(result.record.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onFocus={() => setHoveredId(result.record.id)}
                      onBlur={() => setHoveredId(null)}
                      onClick={() => selectRecord(result.record)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedId === result.record.id ? "border-indigo bg-indigo/5" : "border-line bg-white hover:border-indigo/35"}`}
                      aria-label={`Open result ${index + 1}: ${result.record.title || result.record.place_name}, similarity ${(result.similarity * 100).toFixed(0)} percent`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-indigo">{result.record.title || result.record.place_name || "Heritage record"}</span>
                          <span className="mt-1 block text-xs text-muted">{result.record.monument_type ? TYPE_LABELS[result.record.monument_type] : "Unclassified"}{result.record.period ? ` · ${result.record.period}` : ""}</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-indigo/8 px-2 py-1 text-xs font-bold text-indigo">{(result.similarity * 100).toFixed(0)}%</span>
                      </span>
                      <span className="mt-2 line-clamp-2 block text-xs leading-5 text-muted">{result.why_matched}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div>
              <p className="text-xs text-muted">{loadingRecords ? "Loading approved map pins…" : `${visibleRecords.length} approved record${visibleRecords.length === 1 ? "" : "s"} on the map`}</p>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5" aria-label="Map pin legend">
                {MONUMENT_TYPES.map((type) => (
                  <li key={type} className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} aria-hidden="true" />{TYPE_LABELS[type]}</li>
                ))}
              </ul>
            </div>
          )}
          {!query.trim() && recordsError ? <p className="mt-3 rounded-xl border border-[#E8C2BD] bg-[#FCEBE8] p-3 text-xs leading-5 text-[#872E28]" role="alert">{recordsError} <Link href="/upload" className="font-semibold underline">Add a record</Link></p> : null}
          {!query.trim() && !loadingRecords && !recordsError && visibleRecords.length === 0 ? <p className="mt-3 rounded-xl bg-sandstone/70 p-3 text-sm leading-5 text-muted">No approved records in this category yet. Approved records appear here after review.</p> : null}
        </div>
      </section>

      {selectedRecord ? <ExploreDetailPanel record={selectedRecord} searchResult={selectedSearchResult} onClose={closePanel} /> : null}
      <p className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-full bg-paper/90 px-3 py-1.5 text-[10px] font-medium text-muted shadow sm:bottom-4 sm:left-5">Map data © OpenStreetMap contributors</p>
    </main>
  );
}
