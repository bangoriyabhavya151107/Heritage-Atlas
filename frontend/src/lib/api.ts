import {
  apiErrorEnvelopeSchema,
  geoJSONFeatureCollectionSchema,
  recordCreateResponseSchema,
  recordOutSchema,
  recordPatchSchema,
  retryResponseSchema,
  searchResultSchema,
  signedImageSchema,
  type GeoJSONFeatureCollection,
  type RecordCreateResponse,
  type RecordOut,
  type RecordPatch,
  type RetryResponse,
  type SearchResult,
  type SignedImage,
} from "@/types/api";
import { z } from "zod";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export interface UploadInput {
  image: File;
  placeName: string;
  lat: number;
  lng: number;
}

function getApiBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!rawUrl) {
    throw new ApiError(0, "api_not_configured", "The API address is not configured. Add NEXT_PUBLIC_API_URL to frontend/.env.local.");
  }
  return rawUrl.replace(/\/+$/, "");
}

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;

  try {
    response = await fetch(url, { ...init, cache: "no-store" });
  } catch {
    if (init.signal?.aborted) {
      throw new ApiError(0, "request_aborted", "The request was cancelled.");
    }
    throw new ApiError(0, "network_error", "Could not reach the Heritage Atlas API. Check that the backend is running.");
  }

  const responseText = await response.text();
  let payload: unknown = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      if (!response.ok) {
        throw new ApiError(response.status, "request_failed", "The request could not be completed. Please try again.");
      }
      throw new ApiError(response.status, "invalid_response", "The server returned an unreadable response.");
    }
  }

  if (!response.ok) {
    const errorEnvelope = apiErrorEnvelopeSchema.safeParse(payload);
    if (errorEnvelope.success) {
      throw new ApiError(response.status, errorEnvelope.data.error.code, errorEnvelope.data.error.message);
    }
    throw new ApiError(response.status, "request_failed", "The request could not be completed. Please try again.");
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ApiError(response.status, "invalid_response", "The server returned data this version of the app does not recognize.");
  }
  return result.data;
}

function recordPath(id: string): string {
  return `/records/${encodeURIComponent(id)}`;
}

export const api = {
  createRecord(input: UploadInput): Promise<RecordCreateResponse> {
    const form = new FormData();
    form.append("image", input.image);
    form.append("place_name", input.placeName);
    form.append("lat", String(input.lat));
    form.append("lng", String(input.lng));
    return request("/records", recordCreateResponseSchema, { method: "POST", body: form });
  },

  getRecord(id: string, signal?: AbortSignal): Promise<RecordOut> {
    return request(recordPath(id), recordOutSchema, signal ? { signal } : {});
  },

  getRecordImage(id: string, signal?: AbortSignal): Promise<SignedImage> {
    return request(`${recordPath(id)}/image`, signedImageSchema, signal ? { signal } : {});
  },

  getApprovedRecords(type?: string, signal?: AbortSignal): Promise<GeoJSONFeatureCollection> {
    const query = new URLSearchParams();
    if (type) query.set("type", type);
    const suffix = query.size ? `?${query.toString()}` : "";
    return request(`/records${suffix}`, geoJSONFeatureCollectionSchema, signal ? { signal } : {});
  },

  searchRecords(queryText: string, limit = 10, type?: string, signal?: AbortSignal): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: queryText, limit: String(limit) });
    if (type) params.set("type", type);
    return request(`/search?${params.toString()}`, z.array(searchResultSchema), signal ? { signal } : {});
  },

  patchRecord(id: string, patch: RecordPatch): Promise<RecordOut> {
    const payload = recordPatchSchema.parse(patch);
    return request(recordPath(id), recordOutSchema, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  approveRecord(id: string): Promise<RecordOut> {
    return request(`${recordPath(id)}/approve`, recordOutSchema, { method: "POST" });
  },

  retryRecord(id: string): Promise<RetryResponse> {
    return request(`${recordPath(id)}/retry`, retryResponseSchema, { method: "POST" });
  },
};
