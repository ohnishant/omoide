import * as v from "valibot";

import { epochMsSchema } from "./domain";

/**
 * GET /assets/:assetId/url — membership-checked presigned GET,
 * TTL 60 s - 15 min.
 */
export const assetUrlResponseSchema = v.object({
  url: v.string(),
  expiresAt: epochMsSchema,
});

export type AssetUrlResponse = v.InferOutput<
  typeof assetUrlResponseSchema
>;

// GET /assets/:assetId/rendition.jpg is a 302 redirect (no JSON body).
// POST /bakos/:id/zip streams an fflate zip (no JSON body).
