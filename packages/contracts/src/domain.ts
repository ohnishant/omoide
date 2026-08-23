import * as v from "valibot";

/** All wire timestamps are epoch ms integers, matching db columns. */
export const epochMsSchema = v.pipe(v.number(), v.integer(), v.minValue(0));

export const idSchema = v.pipe(v.string(), v.minLength(1));

export const sha256HexSchema = v.pipe(
  v.string(),
  v.regex(/^[0-9a-f]{64}$/i)
);

export const userPlanSchema = v.picklist(["free", "paid"]);

export const userSchema = v.object({
  id: idSchema,
  email: v.string(),
  name: v.string(),
  plan: userPlanSchema,
  storageUsedBytes: v.pipe(v.number(), v.integer(), v.minValue(0)),
  storageQuotaBytes: v.pipe(v.number(), v.integer(), v.minValue(0)),
  bakoCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export type User = v.InferOutput<typeof userSchema>;

export const memberSchema = v.object({
  userId: idSchema,
  name: v.string(),
  avatarFillIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export type Member = v.InferOutput<typeof memberSchema>;

export const bakoSummarySchema = v.object({
  id: idSchema,
  name: v.string(),
  memberCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  assetCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  newCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  coverThumbKeys: v.pipe(v.array(v.string()), v.maxLength(4)),
  inviteUrl: v.string(),
  createdAt: epochMsSchema,
});

export type BakoSummary = v.InferOutput<typeof bakoSummarySchema>;

// valibot has no `.extend`; spread the entries to keep the same shape.
export const bakoDetailSchema = v.object({
  ...bakoSummarySchema.entries,
  members: v.array(memberSchema),
  storageUsedBytes: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export type BakoDetail = v.InferOutput<typeof bakoDetailSchema>;

export const assetStatusSchema = v.picklist([
  "pending",
  "ready",
  "over_quota",
  "failed",
]);

export const assetSchema = v.object({
  id: idSchema,
  bakoId: idSchema,
  uploaderId: idSchema,
  uploaderName: v.string(),
  fileName: v.string(),
  contentType: v.string(),
  byteSize: v.pipe(v.number(), v.integer(), v.minValue(0)),
  contentHash: sha256HexSchema,
  thumbKey: v.nullable(v.string()),
  status: assetStatusSchema,
  takenAt: v.nullable(epochMsSchema),
  createdAt: epochMsSchema,
});

export type Asset = v.InferOutput<typeof assetSchema>;

export const activityEventTypeSchema = v.picklist(["upload", "join"]);

export const activityEventSchema = v.object({
  id: idSchema,
  bakoId: idSchema,
  type: activityEventTypeSchema,
  actorName: v.string(),
  assetId: v.nullable(idSchema),
  createdAt: epochMsSchema,
});

export type ActivityEvent = v.InferOutput<typeof activityEventSchema>;
