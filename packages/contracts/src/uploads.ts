import * as v from "valibot";

import { assetSchema, epochMsSchema, sha256HexSchema } from "./domain";

/**
 * POST /bakos/:id/uploads — init.
 * `thumb` is nullable on request; the response carries the thumbnail slot
 * iff the client sent one (encode the link explicitly, T09 relies on it).
 */
export const uploadThumbSpecSchema = v.object({
  byteSize: v.pipe(v.number(), v.integer(), v.minValue(1)),
  contentHash: sha256HexSchema,
});

export type UploadThumbSpec = v.InferOutput<typeof uploadThumbSpecSchema>;

export const uploadKindSchema = v.picklist(["image", "video"]);

export const uploadInitRequestSchema = v.object({
  fileName: v.pipe(v.string(), v.minLength(1)),
  byteSize: v.pipe(v.number(), v.integer(), v.minValue(1)),
  contentType: v.pipe(v.string(), v.minLength(1)),
  contentHash: sha256HexSchema,
  kind: uploadKindSchema,
  thumb: v.nullable(uploadThumbSpecSchema),
});

export type UploadInitRequest = v.InferOutput<typeof uploadInitRequestSchema>;

/** Presigned PUT slot; URLs pin Content-Type, expiry 1-6 h. */
export const uploadSlotSchema = v.object({
  url: v.string(),
  key: v.string(),
  expiresAt: epochMsSchema,
});

export type UploadSlot = v.InferOutput<typeof uploadSlotSchema>;

/**
 * Discriminate on `mode`, never on field presence — clients switch on it
 * (CONTRACTS.md §4).
 */
export const singleUploadResponseSchema = v.object({
  mode: v.literal("single"),
  assetId: v.string(),
  original: uploadSlotSchema,
  thumbnail: v.nullable(uploadSlotSchema),
});

export type SingleUploadResponse = v.InferOutput<
  typeof singleUploadResponseSchema
>;

export const multipartUploadResponseSchema = v.object({
  mode: v.literal("multipart"),
  assetId: v.string(),
  uploadId: v.string(),
  partSize: v.pipe(v.number(), v.integer(), v.minValue(1)),
  partsCount: v.pipe(v.number(), v.integer(), v.minValue(1)),
  thumbnail: v.nullable(uploadSlotSchema),
});

export type MultipartUploadResponse = v.InferOutput<
  typeof multipartUploadResponseSchema
>;

export const uploadInitResponseSchema = v.variant("mode", [
  singleUploadResponseSchema,
  multipartUploadResponseSchema,
]);

export type UploadInitResponse = v.InferOutput<
  typeof uploadInitResponseSchema
>;

/** GET /uploads/:sessionId/parts?numbers=1,2,3 */
export const listPartsQuerySchema = v.object({
  numbers: v.pipe(
    v.string(),
    v.regex(/^\d+(,\d+)*$/, "comma-separated part numbers"),
    v.transform((s) => s.split(",").map((n) => Number.parseInt(n, 10))),
    v.pipe(
      v.array(
        v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10_000))
      ),
      v.minLength(1)
    )
  ),
});

export type ListPartsQuery = v.InferOutput<typeof listPartsQuerySchema>;

export const presignedPartSchema = v.object({
  partNumber: v.pipe(v.number(), v.integer(), v.minValue(1)),
  url: v.string(),
});

export const listPartsResponseSchema = v.object({
  parts: v.array(presignedPartSchema),
});

export type ListPartsResponse = v.InferOutput<
  typeof listPartsResponseSchema
>;

/** POST /uploads/:sessionId/complete */
export const completedPartSchema = v.object({
  partNumber: v.pipe(v.number(), v.integer(), v.minValue(1)),
  etag: v.pipe(v.string(), v.minLength(1)),
});

export const uploadCompleteRequestSchema = v.object({
  parts: v.array(completedPartSchema),
});

export type UploadCompleteRequest = v.InferOutput<
  typeof uploadCompleteRequestSchema
>;

/** Atomic quota guard verdict at finalize; empty `parts` finalizes single mode. */
export const uploadCompleteStatusSchema = v.picklist([
  "ready",
  "over_quota",
]);

export const uploadCompleteResponseSchema = v.object({
  status: uploadCompleteStatusSchema,
  asset: assetSchema,
});

export type UploadCompleteResponse = v.InferOutput<
  typeof uploadCompleteResponseSchema
>;
