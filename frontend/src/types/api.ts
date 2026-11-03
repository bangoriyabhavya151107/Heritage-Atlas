import { z } from "zod";

export const RECORD_STATUSES = [
  "uploaded",
  "processing",
  "needs_review",
  "approved",
  "failed",
] as const;
export const MONUMENT_TYPES = ["stepwell", "fort", "temple", "mosque", "craft", "other"] as const;

export const recordStatusSchema = z.enum(RECORD_STATUSES);
export const monumentTypeSchema = z.enum(MONUMENT_TYPES);

export const recordOutSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  title: z.string().nullable(),
  monument_type: monumentTypeSchema.nullable(),
  period: z.string().nullable(),
  materials: z.array(z.string()),
  features: z.array(z.string()),
  language: z.string().nullable(),
  original_text: z.string().nullable(),
  english_text: z.string().nullable(),
  summary: z.string().nullable(),
  image_path: z.string().nullable(),
  source_url: z.string().nullable().default(null),
  source_title: z.string().nullable().default(null),
  verification_notes: z.array(z.string()).default([]),
  place_name: z.string().nullable(),
  region: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  ocr_confidence: z.number().nullable(),
  status: recordStatusSchema,
  pipeline_stage: z.string().nullable(),
  warning: z.string().nullable(),
  error: z.string().nullable(),
});

export const searchResultSchema = z.object({
  record: recordOutSchema,
  similarity: z.number(),
  why_matched: z.string(),
});

export const signedImageSchema = z.object({
  signed_url: z.string().url(),
  expires_in: z.number().int().positive(),
});

export const geoJSONFeatureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(z.object({
    type: z.literal("Feature"),
    id: z.string().uuid(),
    geometry: z.object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    }).nullable(),
    properties: recordOutSchema,
  })),
});

export const recordCreateResponseSchema = z.object({
  id: z.string().uuid(),
  status: recordStatusSchema,
});

export const retryResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("retry_queued"),
});

export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const recordPatchSchema = z.object({
  title: z.string().nullable().optional(),
  monument_type: monumentTypeSchema.nullable().optional(),
  period: z.string().nullable().optional(),
  materials: z.array(z.string()).nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
  language: z.string().nullable().optional(),
  original_text: z.string().nullable().optional(),
  english_text: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  place_name: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
});

export type RecordStatus = z.infer<typeof recordStatusSchema>;
export type MonumentType = z.infer<typeof monumentTypeSchema>;
export type RecordOut = z.infer<typeof recordOutSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type SignedImage = z.infer<typeof signedImageSchema>;
export type GeoJSONFeatureCollection = z.infer<typeof geoJSONFeatureCollectionSchema>;
export type RecordCreateResponse = z.infer<typeof recordCreateResponseSchema>;
export type RetryResponse = z.infer<typeof retryResponseSchema>;
export type RecordPatch = z.infer<typeof recordPatchSchema>;
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;
