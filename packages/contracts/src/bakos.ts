import * as v from "valibot";

import {
  activityEventSchema,
  assetSchema,
  bakoDetailSchema,
  bakoSummarySchema,
  idSchema,
} from "./domain";

/** Opaque cursor string; never a raw row id (CONTRACTS.md §1). */
export const cursorSchema = v.pipe(v.string(), v.minLength(1));

export const createBakoRequestSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export const createBakoResponseSchema = bakoDetailSchema;

export const listBakosResponseSchema = v.object({
  bakos: v.array(bakoSummarySchema),
});

export const getBakoResponseSchema = bakoDetailSchema;

export const listAssetsQuerySchema = v.object({
  cursor: v.optional(cursorSchema),
  memberId: v.optional(idSchema),
});

export const listAssetsResponseSchema = v.object({
  assets: v.array(assetSchema),
  nextCursor: v.optional(cursorSchema),
});

export type ListAssetsResponse = v.InferOutput<
  typeof listAssetsResponseSchema
>;

export const listActivityQuerySchema = v.object({
  cursor: v.optional(cursorSchema),
});

export const listActivityResponseSchema = v.object({
  events: v.array(activityEventSchema),
  nextCursor: v.optional(cursorSchema),
});

export type ListActivityResponse = v.InferOutput<
  typeof listActivityResponseSchema
>;

export const joinPreviewResponseSchema = v.object({
  bakoName: v.string(),
  inviterName: v.string(),
});

export const joinResponseSchema = v.object({
  bakoId: idSchema,
});

export const devicePlatformSchema = v.picklist(["ios", "android"]);

export const registerDeviceRequestSchema = v.object({
  expoPushToken: v.pipe(v.string(), v.minLength(1)),
  platform: devicePlatformSchema,
});
