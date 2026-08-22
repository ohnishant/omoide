import { activityEventSchema, assetSchema, bakoDetailSchema, bakoSummarySchema, idSchema } from "./domain";
import { z } from "zod";

/** Opaque cursor string; never a raw row id (CONTRACTS.md §1). */
export const cursorSchema = z.string().min(1);

export const createBakoRequestSchema = z.object({
  name: z.string().trim().min(1),
});

export const createBakoResponseSchema = bakoDetailSchema;

export const listBakosResponseSchema = z.object({
  bakos: z.array(bakoSummarySchema),
});

export const getBakoResponseSchema = bakoDetailSchema;

export const listAssetsQuerySchema = z.object({
  cursor: cursorSchema.optional(),
  memberId: idSchema.optional(),
});

export const listAssetsResponseSchema = z.object({
  assets: z.array(assetSchema),
  nextCursor: cursorSchema.optional(),
});

export type ListAssetsResponse = z.infer<typeof listAssetsResponseSchema>;

export const listActivityQuerySchema = z.object({
  cursor: cursorSchema.optional(),
});

export const listActivityResponseSchema = z.object({
  events: z.array(activityEventSchema),
  nextCursor: cursorSchema.optional(),
});

export type ListActivityResponse = z.infer<typeof listActivityResponseSchema>;

export const joinPreviewResponseSchema = z.object({
  bakoName: z.string(),
  inviterName: z.string(),
});

export const joinResponseSchema = z.object({
  bakoId: idSchema,
});

export const devicePlatformSchema = z.enum(["ios", "android"]);

export const registerDeviceRequestSchema = z.object({
  expoPushToken: z.string().min(1),
  platform: devicePlatformSchema,
});
