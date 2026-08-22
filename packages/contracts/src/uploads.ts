import { assetSchema, epochMsSchema, sha256HexSchema } from "./domain";
import { z } from "zod";

/**
 * POST /bakos/:id/uploads — init.
 * `thumb` is nullable on request; the response carries the thumbnail slot
 * iff the client sent one (encode the link explicitly, T09 relies on it).
 */
export const uploadThumbSpecSchema = z.object({
  byteSize: z.number().int().positive(),
  contentHash: sha256HexSchema,
});

export type UploadThumbSpec = z.infer<typeof uploadThumbSpecSchema>;

export const uploadKindSchema = z.enum(["image", "video"]);

export const uploadInitRequestSchema = z.object({
  fileName: z.string().min(1),
  byteSize: z.number().int().positive(),
  contentType: z.string().min(1),
  contentHash: sha256HexSchema,
  kind: uploadKindSchema,
  thumb: uploadThumbSpecSchema.nullable(),
});

export type UploadInitRequest = z.infer<typeof uploadInitRequestSchema>;

/** Presigned PUT slot; URLs pin Content-Type, expiry 1-6 h. */
export const uploadSlotSchema = z.object({
  url: z.string(),
  key: z.string(),
  expiresAt: epochMsSchema,
});

export type UploadSlot = z.infer<typeof uploadSlotSchema>;

/**
 * Discriminate on `mode`, never on field presence — clients switch on it
 * (CONTRACTS.md §4).
 */
export const singleUploadResponseSchema = z.object({
  mode: z.literal("single"),
  assetId: z.string(),
  original: uploadSlotSchema,
  thumbnail: uploadSlotSchema.nullable(),
});

export type SingleUploadResponse = z.infer<typeof singleUploadResponseSchema>;

export const multipartUploadResponseSchema = z.object({
  mode: z.literal("multipart"),
  assetId: z.string(),
  uploadId: z.string(),
  partSize: z.number().int().positive(),
  partsCount: z.number().int().positive(),
  thumbnail: uploadSlotSchema.nullable(),
});

export type MultipartUploadResponse = z.infer<typeof multipartUploadResponseSchema>;

export const uploadInitResponseSchema = z.discriminatedUnion("mode", [
  singleUploadResponseSchema,
  multipartUploadResponseSchema,
]);

export type UploadInitResponse = z.infer<typeof uploadInitResponseSchema>;

/** GET /uploads/:sessionId/parts?numbers=1,2,3 */
export const listPartsQuerySchema = z.object({
  numbers: z
    .string()
    .regex(/^\d+(,\d+)*$/, "comma-separated part numbers")
    .transform((s) => s.split(",").map((n) => Number.parseInt(n, 10)))
    .pipe(z.array(z.number().int().min(1).max(10_000)).min(1)),
});

export type ListPartsQuery = z.output<typeof listPartsQuerySchema>;

export const presignedPartSchema = z.object({
  partNumber: z.number().int().min(1),
  url: z.string(),
});

export const listPartsResponseSchema = z.object({
  parts: z.array(presignedPartSchema),
});

export type ListPartsResponse = z.infer<typeof listPartsResponseSchema>;

/** POST /uploads/:sessionId/complete */
export const completedPartSchema = z.object({
  partNumber: z.number().int().min(1),
  etag: z.string().min(1),
});

export const uploadCompleteRequestSchema = z.object({
  parts: z.array(completedPartSchema),
});

export type UploadCompleteRequest = z.infer<typeof uploadCompleteRequestSchema>;

/** Atomic quota guard verdict at finalize; empty `parts` finalizes single mode. */
export const uploadCompleteStatusSchema = z.enum(["ready", "over_quota"]);

export const uploadCompleteResponseSchema = z.object({
  status: uploadCompleteStatusSchema,
  asset: assetSchema,
});

export type UploadCompleteResponse = z.infer<typeof uploadCompleteResponseSchema>;
