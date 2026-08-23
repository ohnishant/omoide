import { describe, expect, it } from "vitest";
import * as v from "valibot";

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
    expect(v.parse(userSchema, user)).toEqual(user);
    expect(v.parse(bakoSummarySchema, bakoSummary)).toEqual(bakoSummary);
    expect(v.parse(bakoDetailSchema, bakoDetail)).toEqual(bakoDetail);
    expect(v.parse(assetSchema, asset)).toEqual(asset);
    expect(v.parse(activityEventSchema, activityEvent)).toEqual(activityEvent);
  });

  it("me response", () => {
    expect(v.parse(meResponseSchema, { user })).toEqual({ user });
  });

  it("auth routes", () => {
    expect(v.parse(authorizeQuerySchema, { redirectUri: "omoide://" })).toEqual({
      redirectUri: "omoide://",
    });
    expect(
      v.parse(authorizeResponseSchema, { authorizeUrl: "https://x", state: "s" })
    ).toEqual({ authorizeUrl: "https://x", state: "s" });
    expect(v.parse(tokenRequestSchema, { code: "c", state: "s" })).toEqual({
      code: "c",
      state: "s",
    });
    expect(v.parse(refreshRequestSchema, { refreshToken: "r" })).toEqual({
      refreshToken: "r",
    });
    expect(
      v.parse(tokenPairResponseSchema, { accessToken: "a", refreshToken: "r" })
    ).toEqual({ accessToken: "a", refreshToken: "r" });
  });

  it("resource routes", () => {
    expect(v.parse(createBakoRequestSchema, { name: "Shoebox" })).toEqual({
      name: "Shoebox",
    });
    expect(v.parse(listBakosResponseSchema, { bakos: [bakoSummary] })).toEqual({
      bakos: [bakoSummary],
    });
    expect(
      v.parse(listAssetsQuerySchema, { cursor: "c", memberId: "u_9" })
    ).toEqual({ cursor: "c", memberId: "u_9" });
    expect(v.parse(listAssetsQuerySchema, {})).toEqual({});
    expect(v.parse(listAssetsResponseSchema, { assets: [asset] })).toEqual({
      assets: [asset],
    });
    expect(
      v.parse(listActivityResponseSchema, {
        events: [activityEvent],
        nextCursor: "n",
      })
    ).toEqual({ events: [activityEvent], nextCursor: "n" });
    expect(
      v.parse(joinPreviewResponseSchema, { bakoName: "N", inviterName: "A" })
    ).toEqual({ bakoName: "N", inviterName: "A" });
    expect(v.parse(joinResponseSchema, { bakoId: "b_1" })).toEqual({
      bakoId: "b_1",
    });
    expect(
      v.parse(registerDeviceRequestSchema, {
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
    expect(v.parse(uploadInitRequestSchema, { ...base, thumb: null })).toEqual({
      ...base,
      thumb: null,
    });
    const thumb = { byteSize: 40211, contentHash: HASH };
    expect(v.parse(uploadThumbSpecSchema, thumb)).toEqual(thumb);
    expect(
      v.parse(uploadInitRequestSchema, { ...base, kind: "video", thumb })
    ).toEqual({
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
    expect(v.parse(singleUploadResponseSchema, single)).toEqual(single);
    expect(v.parse(multipartUploadResponseSchema, multi)).toEqual(multi);
    expect(v.parse(uploadInitResponseSchema, single)).toEqual(single);
    expect(v.parse(uploadInitResponseSchema, multi)).toEqual(multi);
  });

  it("upload parts + complete + download url", () => {
    const part = { partNumber: 1, etag: "e" };
    expect(v.parse(completedPartSchema, part)).toEqual(part);
    expect(v.parse(presignedPartSchema, { partNumber: 2, url: "u" })).toEqual({
      partNumber: 2,
      url: "u",
    });
    expect(v.parse(listPartsResponseSchema, { parts: [] })).toEqual({
      parts: [],
    });
    expect(v.parse(uploadCompleteRequestSchema, { parts: [part] })).toEqual({
      parts: [part],
    });
    expect(
      v.parse(uploadCompleteResponseSchema, { status: "ready", asset })
    ).toEqual({ status: "ready", asset });
    expect(
      v.parse(uploadCompleteResponseSchema, { status: "over_quota", asset })
    ).toEqual({ status: "over_quota", asset });
    expect(
      v.parse(assetUrlResponseSchema, { url: "g", expiresAt: 60_000 })
    ).toEqual({
      url: "g",
      expiresAt: 60_000,
    });
  });
});

describe("negative parses", () => {
  it("rejects bad content hash", () => {
    expect(
      v.safeParse(
        uploadInitRequestSchema,
        {
          fileName: "f",
          byteSize: 1,
          contentType: "image/heic",
          contentHash: "nothex",
          kind: "image",
          thumb: null,
        }
      ).success
    ).toBe(false);
  });

  it("rejects unknown discriminator value (mode is the switch)", () => {
    expect(
      v.safeParse(uploadInitResponseSchema, {
        mode: "turbo",
        assetId: "x",
      }).success
    ).toBe(false);
  });

  it("rejects non-integer epoch ms", () => {
    expect(
      v.safeParse(assetUrlResponseSchema, { url: "g", expiresAt: 1.5 }).success
    ).toBe(false);
  });

  it("rejects negative byte sizes", () => {
    expect(
      v.safeParse(
        uploadInitRequestSchema,
        {
          fileName: "f",
          byteSize: -5,
          contentType: "image/heic",
          contentHash: HASH,
          kind: "image",
          thumb: null,
        }
      ).success
    ).toBe(false);
  });
});

describe("parts query transform", () => {
  it("parses comma-separated numbers", () => {
    expect(v.parse(listPartsQuerySchema, { numbers: "1,2,3" })).toEqual({
      numbers: [1, 2, 3],
    });
  });

  it("rejects garbage and missing values", () => {
    expect(
      v.safeParse(listPartsQuerySchema, { numbers: "1,,3" }).success
    ).toBe(false);
    expect(v.safeParse(listPartsQuerySchema, {}).success).toBe(false);
  });
});
