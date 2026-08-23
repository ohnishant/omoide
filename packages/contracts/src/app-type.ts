/**
 * Type-level Hono RPC surface (CONTRACTS.md §2-§5).
 *
 * The stub app exists ONLY to derive `AppType` before apps/api lands (T07
 * re-exports/implements the real one). Consumers re-export just
 * `type AppType`, so no Hono server runtime leaks into client bundles
 * (share extension included) — types erase, values do not.
 */
import { Hono } from "hono";
import type { Env, MiddlewareHandler, ValidationTargets } from "hono";
import * as v from "valibot";
import type { GenericSchema, InferInput, InferOutput } from "valibot";

import {
  authorizeQuerySchema,
  refreshRequestSchema,
  tokenRequestSchema,
} from "./auth";
import {
  createBakoRequestSchema,
  listActivityQuerySchema,
  listAssetsQuerySchema,
  registerDeviceRequestSchema,
} from "./bakos";
import {
  listPartsQuerySchema,
  uploadCompleteRequestSchema,
  uploadInitRequestSchema,
} from "./uploads";
import type {
  ListPartsResponse,
  MultipartUploadResponse,
  SingleUploadResponse,
  UploadCompleteResponse,
  UploadInitRequest,
  UploadSlot,
} from "./uploads";
import type { ActivityEvent, Asset, BakoDetail, BakoSummary, User } from "./domain";
import type {
  ListActivityResponse,
  ListAssetsResponse,
} from "./bakos";
import type { AssetUrlResponse } from "./downloads";

import { errorEnvelope } from "./errors";

type Validation<S extends GenericSchema, T extends keyof ValidationTargets> = {
  in: { [K in T]: InferInput<S> };
  out: { [K in T]: InferOutput<S> };
};

function vJson<E extends Env, P extends string, S extends GenericSchema>(
  schema: S
): MiddlewareHandler<E, P, Validation<S, "json">> {
  return validate("json", schema) as never;
}

function vQuery<E extends Env, P extends string, S extends GenericSchema>(
  schema: S
): MiddlewareHandler<E, P, Validation<S, "query">> {
  return validate("query", schema) as never;
}

function validate(
  target: keyof ValidationTargets,
  schema: GenericSchema
): unknown {
  return async (c: any, next: () => Promise<void>) => {
    const raw =
      target === "json"
        ? await c.req.json().catch(() => undefined)
        : c.req.query();
    const parsed = v.safeParse(schema, raw);
    if (!parsed.success) {
      const message = parsed.issues.map((issue) => issue.message).join(", ");
      return c.json(errorEnvelope("invalid_request", message), 400);
    }
    (c.set as (key: string, value: unknown) => void)(target, parsed.output);
    await next();
  };
}

// ---- fixtures (typed against InferOutput so c.json yields exact contract types)

const userFixture: User = {
  id: "u_1",
  email: "a@b.c",
  name: "A",
  plan: "free",
  storageUsedBytes: 0,
  storageQuotaBytes: 5 * 1024 ** 3,
  bakoCount: 1,
};

const assetFixture: Asset = {
  id: "as_1",
  bakoId: "b_1",
  uploaderId: "u_1",
  uploaderName: "A",
  fileName: "IMG_0001.heic",
  contentType: "image/heic",
  byteSize: 2384712,
  contentHash: "aa".repeat(32),
  thumbKey: null,
  status: "pending",
  takenAt: null,
  createdAt: 0,
};

const summaryFixture: BakoSummary = {
  id: "b_1",
  name: "Bako",
  memberCount: 1,
  assetCount: 1,
  newCount: 0,
  coverThumbKeys: [],
  inviteUrl: "https://omoide.app/join/t",
  createdAt: 0,
};

const detailFixture: BakoDetail = {
  ...summaryFixture,
  members: [{ userId: "u_1", name: "A", avatarFillIndex: 0 }],
  storageUsedBytes: 2384712,
};

const eventFixture: ActivityEvent = {
  id: "ev_1",
  bakoId: "b_1",
  type: "upload",
  actorName: "A",
  assetId: "as_1",
  createdAt: 0,
};

const slotFixture: UploadSlot = {
  url: "https://r2.example/put",
  key: "bakos/b_1/hash.webp",
  expiresAt: 3_600_000,
};

const singleFixture: SingleUploadResponse = {
  mode: "single",
  assetId: assetFixture.id,
  original: slotFixture,
  thumbnail: slotFixture,
};

const multipartFixture: MultipartUploadResponse = {
  mode: "multipart",
  assetId: assetFixture.id,
  uploadId: "mp_1",
  partSize: 16 * 1024 ** 2,
  partsCount: 7,
  thumbnail: slotFixture,
};

const completeFixture: UploadCompleteResponse = {
  status: "ready",
  asset: assetFixture,
};

const assetUrlFixture: AssetUrlResponse = {
  url: "https://r2.example/get",
  expiresAt: 900_000,
};

const listAssetsFixture: ListAssetsResponse = { assets: [assetFixture] };
const listActivityFixture: ListActivityResponse = { events: [eventFixture] };
const listPartsFixture: ListPartsResponse = { parts: [] };

// ---- stub app

export const app = new Hono()
  // §2 auth
  .get(
    "/auth/authorize",
    vQuery(authorizeQuerySchema),
    (c) => c.json({ authorizeUrl: "", state: "" })
  )
  .post(
    "/auth/token",
    vJson(tokenRequestSchema),
    (c) => c.json({ accessToken: "", refreshToken: "" })
  )
  .post(
    "/auth/refresh",
    vJson(refreshRequestSchema),
    (c) => c.json({ accessToken: "", refreshToken: "" })
  )
  .get("/auth/me", (c) => c.json({ user: userFixture }))
  // §3 resources
  .post(
    "/bakos",
    vJson(createBakoRequestSchema),
    async (c) => {
      const { name } = c.req.valid("json");
      if (!name) {
        return c.json(
          errorEnvelope("bako_limit_reached", "free tier already has 3 bakos"),
          403
        );
      }
      return c.json(detailFixture);
    }
  )
  .get("/bakos", (c) => c.json({ bakos: [summaryFixture] }))
  .get("/bakos/:id", (c) => c.json(detailFixture))
  .get("/bakos/:id/assets", vQuery(listAssetsQuerySchema), (c) =>
    c.json(listAssetsFixture)
  )
  .get("/bakos/:id/activity", vQuery(listActivityQuerySchema), (c) =>
    c.json(listActivityFixture)
  )
  .get("/join/:token/preview", (c) =>
    c.json({ bakoName: summaryFixture.name, inviterName: userFixture.name })
  )
  .post("/join/:token", (c) => c.json({ bakoId: detailFixture.id }))
  .post("/devices", vJson(registerDeviceRequestSchema), (c) => c.body(null, 204))
  // §4 uploads
  .post(
    "/bakos/:id/uploads",
    vJson(uploadInitRequestSchema),
    async (c) => {
      const init: UploadInitRequest = c.req.valid("json");
      if (init.kind === "video") {
        return c.json(multipartFixture);
      }
      return c.json(singleFixture);
    }
  )
  .get(
    "/uploads/:sessionId/parts",
    vQuery(listPartsQuerySchema),
    (c): Response => c.json(listPartsFixture)
  )
  .post(
    "/uploads/:sessionId/complete",
    vJson(uploadCompleteRequestSchema),
    (c) => c.json(completeFixture)
  )
  // §5 downloads
  .get("/assets/:assetId/url", (c) => c.json(assetUrlFixture))
  .get("/assets/:assetId/rendition.jpg", (c) => c.body(null, 302))
  .post("/bakos/:id/zip", (c) => c.body(null, 200));

export type AppType = typeof app;
