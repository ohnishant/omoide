import { describe, expect, it } from "vitest";

import {
  activityEventSchema,
  assetSchema,
  bakoDetailSchema,
  bakoSummarySchema,
  userSchema,
} from "./domain";
import {
  authorizeQuerySchema,
  authorizeResponseSchema,
  refreshRequestSchema,
  tokenRequestSchema,
  tokenPairResponseSchema,
  meResponseSchema,
} from "./auth";
import {
  createBakoRequestSchema,
  joinPreviewResponseSchema,
  joinResponseSchema,
  listActivityResponseSchema,
  listAssetsQuerySchema,
  listAssetsResponseSchema,
  listBakosResponseSchema,
  registerDeviceRequestSchema,
} from "./bakos";
import {
  completedPartSchema,
  listPartsQuerySchema,
  listPartsResponseSchema,
  multipartUploadResponseSchema,
  presignedPartSchema,
  singleUploadResponseSchema,
  uploadCompleteRequestSchema,
  uploadCompleteResponseSchema,
  uploadInitRequestSchema,
  uploadInitResponseSchema,
  uploadThumbSpecSchema,
} from "./uploads";
import { assetUrlResponseSchema } from "./downloads";

const HASH = "aa".repeat(32);

const user = {
  id: "u_1",
  email: "a@b.c",
  name: "A",
  plan: "free",
  storageUsedBytes: 0,
  storageQuotaBytes: 5 * 1024 ** 3,
  bakoCount: 1,
};

const bakoSummary = {
  id: "b_1",
  name: "N",
  memberCount: 2,
  assetCount: 0,
  newCount: 0,
  coverThumbKeys: ["bakos/b_1/thumbs/h.webp"],
  inviteUrl: "https://omoide.app/join/t",
  createdAt: 0,
};

const bakoDetail = {
  ...bakoSummary,
  members: [{ userId: "u_1", name: "A", avatarFillIndex: 0 }],
  storageUsedBytes: 0,
};

const asset = {
  id: "as_1",
  bakoId: "b_1",
  uploaderId: "u_1",
  uploaderName: "A",
  fileName: "IMG_0001.heic",
  contentType: "image/heic",
  byteSize: 2384712,
  contentHash: HASH,
  thumbKey: null,
  status: "pending",
  takenAt: null,
  createdAt: 0,
};

const activityEvent = {
  id: "e_1",
  bakoId: "b_1",
  type: "upload",
  actorName: "A",
  assetId: "as_1",
  createdAt: 0,
};

describe("round-trip parses", () => {
  it("domain types", () => {
    expect(userSchema.parse(user)).toEqual(user);
    expect(bakoSummarySchema.parse(bakoSummary)).toEqual(bakoSummary);
    expect(bakoDetailSchema.parse(bakoDetail)).toEqual(bakoDetail);
    expect(assetSchema.parse(asset)).toEqual(asset);
    expect(activityEventSchema.parse(activityEvent)).toEqual(activityEvent);
  });

  it("me response", () => {
    expect(meResponseSchema.parse({ user })).toEqual({ user });
  });

  it("auth routes", () => {
    expect(authorizeQuerySchema.parse({ redirectUri: "omoide://" })).toEqual({
      redirectUri: "omoide://",
    });
    expect(
      authorizeResponseSchema.parse({ authorizeUrl: "https://x", state: "s" })
    ).toEqual({ authorizeUrl: "https://x", state: "s" });
    expect(tokenRequestSchema.parse({ code: "c", state: "s" })).toEqual({
      code: "c",
      state: "s",
    });
    expect(refreshRequestSchema.parse({ refreshToken: "r" })).toEqual({
      refreshToken: "r",
    });
    expect(
      tokenPairResponseSchema.parse({ accessToken: "a", refreshToken: "r" })
    ).toEqual({ accessToken: "a", refreshToken: "r" });
  });

  it("resource routes", () => {
    expect(createBakoRequestSchema.parse({ name: "Shoebox" })).toEqual({
      name: "Shoebox",
    });
    expect(listBakosResponseSchema.parse({ bakos: [bakoSummary] })).toEqual({
      bakos: [bakoSummary],
    });
    expect(listAssetsQuerySchema.parse({ cursor: "c", memberId: "u_9" })).toEqual(
      { cursor: "c", memberId: "u_9" }
    );
    expect(listAssetsQuerySchema.parse({})).toEqual({});
    expect(listAssetsResponseSchema.parse({ assets: [asset] })).toEqual({
      assets: [asset],
    });
    expect(
      listActivityResponseSchema.parse({ events: [activityEvent], nextCursor: "n" })
    ).toEqual({ events: [activityEvent], nextCursor: "n" });
    expect(
      joinPreviewResponseSchema.parse({ bakoName: "N", inviterName: "A" })
    ).toEqual({ bakoName: "N", inviterName: "A" });
    expect(joinResponseSchema.parse({ bakoId: "b_1" })).toEqual({ bakoId: "b_1" });
    expect(
      registerDeviceRequestSchema.parse({
        expoPushToken: "ExponentPushToken[x]",
        platform: "ios",
      })
    ).toEqual({ expoPushToken: "ExponentPushToken[x]", platform: "ios" });
  });

  it("upload init request, with thumb and without", () => {
    const base = {
      fileName: "IMG_0001.heic",
      byteSize: 2384712,
      contentType: "image/heic",
      contentHash: HASH,
      kind: "image",
    };
    expect(uploadInitRequestSchema.parse({ ...base, thumb: null })).toEqual({
      ...base,
      thumb: null,
    });
    const thumb = { byteSize: 40211, contentHash: HASH };
    expect(uploadThumbSpecSchema.parse(thumb)).toEqual(thumb);
    expect(uploadInitRequestSchema.parse({ ...base, kind: "video", thumb })).toEqual({
      ...base,
      kind: "video",
      thumb,
    });
  });

  it("upload init response discriminated union on mode", () => {
    const slot = { url: "https://put", key: "k", expiresAt: 3_600_000 };
    const single = {
      mode: "single" as const,
      assetId: "as_1",
      original: slot,
      thumbnail: slot,
    };
    const multi = {
      mode: "multipart" as const,
      assetId: "as_1",
      uploadId: "mp_1",
      partSize: 16 * 1024 ** 2,
      partsCount: 7,
      thumbnail: null,
    };
    expect(singleUploadResponseSchema.parse(single)).toEqual(single);
    expect(multipartUploadResponseSchema.parse(multi)).toEqual(multi);
    expect(uploadInitResponseSchema.parse(single)).toEqual(single);
    expect(uploadInitResponseSchema.parse(multi)).toEqual(multi);
  });

  it("upload parts + complete + download url", () => {
    const part = { partNumber: 1, etag: "e" };
    expect(completedPartSchema.parse(part)).toEqual(part);
    expect(presignedPartSchema.parse({ partNumber: 2, url: "u" })).toEqual({
      partNumber: 2,
      url: "u",
    });
    expect(listPartsResponseSchema.parse({ parts: [] })).toEqual({ parts: [] });
    expect(uploadCompleteRequestSchema.parse({ parts: [part] })).toEqual({
      parts: [part],
    });
    expect(
      uploadCompleteResponseSchema.parse({ status: "ready", asset })
    ).toEqual({ status: "ready", asset });
    expect(
      uploadCompleteResponseSchema.parse({ status: "over_quota", asset })
    ).toEqual({ status: "over_quota", asset });
    expect(assetUrlResponseSchema.parse({ url: "g", expiresAt: 60_000 })).toEqual({
      url: "g",
      expiresAt: 60_000,
    });
  });
});

describe("negative parses", () => {
  it("rejects bad content hash", () => {
    expect(
      uploadInitRequestSchema.safeParse({
        fileName: "f",
        byteSize: 1,
        contentType: "image/heic",
        contentHash: "nothex",
        kind: "image",
        thumb: null,
      }).success
    ).toBe(false);
  });

  it("rejects unknown discriminator value (mode is the switch)", () => {
    expect(
      uploadInitResponseSchema.safeParse({ mode: "turbo", assetId: "x" }).success
    ).toBe(false);
  });

  it("rejects non-integer epoch ms", () => {
    expect(
      assetUrlResponseSchema.safeParse({ url: "g", expiresAt: 1.5 }).success
    ).toBe(false);
  });

  it("rejects negative byte sizes", () => {
    expect(
      uploadInitRequestSchema.safeParse({
        fileName: "f",
        byteSize: -5,
        contentType: "image/heic",
        contentHash: HASH,
        kind: "image",
        thumb: null,
      }).success
    ).toBe(false);
  });
});

describe("parts query transform", () => {
  it("parses comma-separated numbers", () => {
    expect(listPartsQuerySchema.parse({ numbers: "1,2,3" })).toEqual({
      numbers: [1, 2, 3],
    });
  });

  it("rejects garbage and missing values", () => {
    expect(listPartsQuerySchema.safeParse({ numbers: "1,,3" }).success).toBe(false);
    expect(listPartsQuerySchema.safeParse({}).success).toBe(false);
  });
});
