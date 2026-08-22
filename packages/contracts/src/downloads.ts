import { epochMsSchema } from "./domain";
import { z } from "zod";

/**
 * GET /assets/:assetId/url — membership-checked presigned GET,
 * TTL 60 s - 15 min.
 */
export const assetUrlResponseSchema = z.object({
  url: z.string(),
  expiresAt: epochMsSchema,
});

export type AssetUrlResponse = z.infer<typeof assetUrlResponseSchema>;

// GET /assets/:assetId/rendition.jpg is a 302 redirect (no JSON body).
// POST /bakos/:id/zip streams an fflate zip (no JSON body).
