"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

export function usePolling<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  enabled: boolean,
  isTerminal: (value: T) => boolean,
  intervalMs = 1500,
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    const schedule = (): void => {
      if (!stopped) timer = setTimeout(() => void poll(), intervalMs);
    };

    const poll = async (): Promise<void> => {
      if (stopped || inFlight) return;
      inFlight = true;
      controller = new AbortController();

      try {
        const result = await fetcher(controller.signal);
        if (stopped) return;
        setData(result);
        setError(null);
        if (!isTerminal(result)) schedule();
      } catch (caught: unknown) {
        if (!stopped && !controller.signal.aborted) {
          const nextError = caught instanceof ApiError
            ? caught
            : new ApiError(0, "poll_error", "Could not refresh this record. Please try again.");
          setError(nextError);
          if (nextError.status === 0 || nextError.status >= 500) schedule();
        }
      } finally {
        inFlight = false;
        if (!stopped) setLoading(false);
      }
    };

    void poll();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      controller?.abort();
    };
  }, [enabled, fetcher, intervalMs, isTerminal, refreshKey]);

  const refresh = useCallback(() => {
    setError(null);
    setLoading(true);
    setRefreshKey((current) => current + 1);
  }, []);

  return { data, setData, error, loading, refresh };
}
