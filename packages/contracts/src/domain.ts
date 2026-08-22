import { z } from "zod";

/** All wire timestamps are epoch ms integers, matching db columns. */
export const epochMsSchema = z.number().int().nonnegative();

export const idSchema = z.string().min(1);

export const sha256HexSchema = z.string().regex(/^[0-9a-f]{64}$/i);

export const userPlanSchema = z.enum(["free", "paid"]);

export const userSchema = z.object({
  id: idSchema,
  email: z.string(),
  name: z.string(),
  plan: userPlanSchema,
  storageUsedBytes: z.number().int().nonnegative(),
  storageQuotaBytes: z.number().int().nonnegative(),
  bakoCount: z.number().int().nonnegative(),
});

export type User = z.infer<typeof userSchema>;

export const memberSchema = z.object({
  userId: idSchema,
  name: z.string(),
  avatarFillIndex: z.number().int().nonnegative(),
});

export type Member = z.infer<typeof memberSchema>;

export const bakoSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  memberCount: z.number().int().nonnegative(),
  assetCount: z.number().int().nonnegative(),
  newCount: z.number().int().nonnegative(),
  coverThumbKeys: z.array(z.string()).max(4),
  inviteUrl: z.string(),
  createdAt: epochMsSchema,
});

export type BakoSummary = z.infer<typeof bakoSummarySchema>;

export const bakoDetailSchema = bakoSummarySchema.extend({
  members: z.array(memberSchema),
  storageUsedBytes: z.number().int().nonnegative(),
});

export type BakoDetail = z.infer<typeof bakoDetailSchema>;

export const assetStatusSchema = z.enum(["pending", "ready", "over_quota", "failed"]);

export const assetSchema = z.object({
  id: idSchema,
  bakoId: idSchema,
  uploaderId: idSchema,
  uploaderName: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  byteSize: z.number().int().nonnegative(),
  contentHash: sha256HexSchema,
  thumbKey: z.string().nullable(),
  status: assetStatusSchema,
  takenAt: epochMsSchema.nullable(),
  createdAt: epochMsSchema,
});

export type Asset = z.infer<typeof assetSchema>;

export const activityEventTypeSchema = z.enum(["upload", "join"]);

export const activityEventSchema = z.object({
  id: idSchema,
  bakoId: idSchema,
  type: activityEventTypeSchema,
  actorName: z.string(),
  assetId: idSchema.nullable(),
  createdAt: epochMsSchema,
});

export type ActivityEvent = z.infer<typeof activityEventSchema>;
