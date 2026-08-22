# Omoide contracts

Frozen integration surface. Every ticket resolves against this file. To change
anything here, edit this document and append to the changelog at the bottom
before writing code. Downstream tickets re-read this file at pickup, so no
other coordination is needed.

Package scope names: `@omoide/contracts`, `@omoide/core`, `@omoide/db`.
Apps: `apps/mobile`, `apps/api`. Turbo tasks: `build`, `typecheck`, `lint`,
`test`. Root `.npmrc` sets `node-linker=hoisted`.

## 1. Wire protocol

All bodies JSON unless noted. Errors always:

```jsonc
{ "error": { "code": "...", "message": "..." } }
```

Error codes and HTTP status:

| code | status | meaning |
|---|---|---|
| unauthorized | 401 | missing or invalid bearer token |
| forbidden | 403 | not a member / action not allowed |
| not_found | 404 | |
| invalid_request | 400 | zod validation or bad input |
| conflict | 409 | duplicate hash already ready in bako |
| quota_exceeded | 413 | storage guard rejected at pre-check or finalize |
| bako_limit_reached | 402-style 403 | free tier already has 3 bakos |

Free-tier constants live in `contracts`: `FREE_BAKO_LIMIT = 3`,
`FREE_BYTE_QUOTA = 5 * 1024^3`, `PAYWALL_WARN_RATIO = 0.9`.

Cursor pagination: opaque cursor string, response carries optional
`nextCursor`. Empty page means end.

## 2. Auth

Scheme: `Authorization: Bearer <accessToken>` on every route except `/auth/*`
and `/.well-known/*`.

| Route | Body / query | Response |
|---|---|---|
| `GET /auth/authorize` | `?redirectUri=<scheme>` | `{ authorizeUrl, state }` |
| `POST /auth/token` | `{ code, state }` | `{ accessToken, refreshToken }` |
| `POST /auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `GET /auth/me` | - | `{ user }` |

```ts
User = {
  id: string            // our users.id (uuid), not the WorkOS id
  email: string
  name: string
  plan: 'free' | 'paid'
  storageUsedBytes: number
  storageQuotaBytes: number
  bakoCount: number
}
```

PKCE verifier is held server-side keyed by `state`, short TTL (PRD §7).

## 3. Resource routes

```ts
BakoSummary = {
  id: string
  name: string
  memberCount: number
  assetCount: number
  newCount: number                 // assets uploaded after member's lastReadAt
  coverThumbKeys: string[]         // 0..4 most-recent ready thumbs
  inviteUrl: string
  createdAt: number                // epoch ms
}

BakoDetail = BakoSummary & {
  members: { userId: string, name: string, avatarFillIndex: number }[]
  storageUsedBytes: number
}

Asset = {
  id: string
  bakoId: string
  uploaderId: string
  uploaderName: string
  fileName: string
  contentType: string
  byteSize: number
  contentHash: string              // sha-256 hex
  thumbKey: string | null          // null while pending or failed
  status: 'pending' | 'ready' | 'over_quota' | 'failed'
  takenAt: number | null           // exif capture time, falls back to createdAt
  createdAt: number
}

ActivityEvent = {
  id: string
  bakoId: string
  type: 'upload' | 'join'
  actorName: string
  assetId: string | null
  createdAt: number
}
```

| Route | Notes |
|---|---|
| `POST /bakos` | `{ name }` → `BakoDetail`. Enforces 3-bako cap. Creator auto-membership. |
| `GET /bakos` | `{ bakos: BakoSummary[] }`, shelf order newest first |
| `GET /bakos/:id` | `BakoDetail`, membership required |
| `GET /bakos/:id/assets` | `?cursor&memberId` → `{ assets: Asset[], nextCursor? }`, chronological desc |
| `GET /bakos/:id/activity` | `?cursor` → `{ events: ActivityEvent[], nextCursor? }` |
| `GET /join/:token/preview` | `{ bakoName, inviterName }`, valid membership token |
| `POST /join/:token` | joins caller → `{ bakoId }`; validates cap/quota first |
| `POST /devices` | `{ expoPushToken, platform }` → `204` |

## 4. Upload routes

Content-addressed keys, dedupe on hash. Client computes sha-256 while reading
the file.

`POST /bakos/:id/uploads`

Request:

```jsonc
{ "fileName": "IMG_0001.heic", "byteSize": 2384712,
  "contentType": "image/heic", "contentHash": "<sha256hex>",
  "kind": "image" | "video",
  "thumb": { "byteSize": 40211, "contentHash": "<sha256hex>" } | null }
```

Response, single mode (images < 100 MB):

```jsonc
{
  "mode": "single",
  "assetId": "...",
  "original":  { "url": "<presigned PUT>", "key": "...", "expiresAt": 0 },
  "thumbnail": { "url": "<presigned PUT>", "key": "...", "expiresAt": 0 }
}
```

Multipart mode (videos / >= 100 MB):

```jsonc
{ "mode": "multipart", "assetId": "...", "uploadId": "...",
  "partSize": 16777216, "partsCount": 7,
  "thumbnail": { "url": "...", "key": "...", "expiresAt": 0 } }
```

Then:

| Route | Notes |
|---|---|
| `GET /uploads/:sessionId/parts` | `?numbers=1,2,3` → `{ parts: [{ partNumber, url }] }` |
| `POST /uploads/:sessionId/complete` | `{ parts: [{ partNumber, etag }] }` → runs atomic quota guard, flips asset `ready`, returns `{ status: 'ready' \| 'over_quota', asset: Asset }` |

Rules baked into these routes: membership check, quota pre-check at mint,
authoritative guarded increment at finalize, presigned PUTs pin Content-Type,
expiry 1-6 h, single-mode finalize happens via a `HEAD` verify the server does
on first download request OR a `POST /uploads/:sessionId/complete` with empty
parts. Choose one in T07 and log it; clients treat both identically.

## 5. Download routes

| Route | Notes |
|---|---|
| `GET /assets/:assetId/url` | membership check → `{ url, expiresAt }`, presigned GET TTL 60 s-15 min |
| `GET /assets/:assetId/rendition.jpg` | 302 to Cloudflare Image Transformation URL backed by `renditions/{hash}.jpg` cache |
| `POST /bakos/:id/zip` | streamed fflate zip (STORE), originals only, batched per-N photos |

## 6. Database (packages/db)

Drizzle, SQLite-pure dialect. Tables and columns (epoch ms integers for time):

```ts
users:        id (text pk), workosUserId (text unique), email, name,
              plan ('free'|'paid'), storageUsedBytes (int), createdAt
bakos:        id (text pk), name, createdBy -> users.id, createdAt
memberships:  userId, bakoId, role ('owner'|'member'), lastReadAt (int),
              pk (userId, bakoId)
assets:       id (text pk), bakoId, uploaderId, fileName, contentType,
              byteSize (int), contentHash, thumbKey (nullable),
              status ('pending'|'ready'|'over_quota'|'failed'),
              takenAt (nullable int), createdAt,
              index (bakoId, createdAt)
activity:     id (text pk), bakoId, type ('upload'|'join'), actorId,
              assetId (nullable), createdAt, index (bakoId, createdAt)
uploadSessions: id (text pk), bakoId, uploaderId, fileName, contentType,
              byteSize (int), contentHash, kind ('image'|'video'),
              mode ('single'|'multipart'), r2UploadId (nullable),
              thumbHash (nullable), status ('pending'|'completed'|'aborted'),
              assetId (nullable), createdAt
```

Migration SQL generated by drizzle-kit is committed; applied via
`wrangler d1 migrations apply` in CI post-deploy. Schema stays SQLite-pure so
the Postgres escape hatch stays mechanical (PRD §7, risk 3).

## 7. Core ports (packages/core)

Domain functions take ports, never platform objects.

```ts
export interface StoragePort {
  presignPut(key: string, contentType: string, ttlSeconds: number): Promise<string>
  presignGet(key: string, ttlSeconds: number): Promise<string>
  createMultipart(key: string, contentType: string): Promise<{ uploadId: string }>
  presignPart(key: string, uploadId: string, partNumber: number, ttlSeconds: number): Promise<string>
  completeMultipart(key: string, uploadId: string, parts: { partNumber: number, etag: string }[]): Promise<void>
  abortMultipart(key: string, uploadId: string): Promise<void>
  headObject(key: string): Promise<{ size: number } | null>
}

export interface NotifierPort {
  pushToUsers(userIds: string[], payload: { title: string, body: string, data?: Record<string, string> }): Promise<void>
}

// DbPort is typed against the drizzle schema from @omoide/db. Domain modules
// receive it (or narrower repository interfaces built on it). Exact shape is
// T06's call within dependency law; queries stay in core, adapters in apps/api.
```

Domain responsibilities in core: bako CRUD with cap enforcement, membership
checks, quota math including the atomic guarded increment
(`UPDATE users SET storage_used_bytes = storage_used_bytes + ? WHERE id = ? AND
storage_used_bytes + ? <= quota`, check changes count, wrap in D1 `batch()`),
invite token mint/verify (HMAC, see §9), activity writes.

## 8. Storage keys and bindings

```
originals:   bakos/{bakoId}/{contentHash}.{ext}
thumbnails:  bakos/{bakoId}/thumbs/{contentHash}.webp
renditions:  renditions/{contentHash}.jpg
```

Worker env bindings (fixed names, wired in infra and consumed in apps/api):

```
env.BUCKET   R2 bucket
env.DB       D1 database
secrets:     WORKOS_CLIENT_ID, WORKOS_API_KEY, INVITE_HMAC_SECRET
vars:        APP_URL (https://omoide.app), APP_SCHEME (omoide://)
```

Bucket config in IaC: CORS allow-listed origins/methods for PUT/GET, lifecycle
rule aborting incomplete multipart uploads after 7 days. Mandatory from day
one (risk 6).

## 9. Invite tokens

Format: `base64url(json payload) + "." + base64url(hmac-sha256(payload))`.
Payload: `{ b: bakoId, i: inviterUserId, e: expiryEpochMs }`. Default expiry
30 days. Link: `${APP_URL}/join/<token>`; custom scheme `omoide://join/<token>`
is the dev fallback. Mint and verify helpers live in core; the join routes in
T07 call them.

## 10. Mobile theme tokens (apps/mobile)

Frozen object in `src/theme/theme.ts`, consumed via `useTheme()`. Zero hex
literals anywhere else (PRD §4).

```ts
color:    cream #F5F0E8, parchment #EDE5D4, terracotta #C26B54,
          dustyRose #D4857A, forest #4A7C59, espresso #3A2F2A,
          warmMuted #A08070, warmWhite #FEFCF8
space:    xs 4, sm 8, md 16, lg 24, xl 32, xxl 48
radius:   sm 6, md 10, lg 16, pill 999
font:     weight regular 400, medium 500 (only these two)
shadow:   card (subtle), float (action bar)
avatarFills: [dustyRose, terracotta, forest, warmMuted]  // member bar cycling
```

Light mode only for v1; `userInterfaceStyle: 'light'` locked in app config.

## 11. Mobile module surfaces

`src/lib/api.ts` exports `createApiClient({ getToken })` wrapping Hono RPC
`hc<AppType>`, plus typed query hook factories. Query keys exactly:
`['auth','me']`, `['bakos']`, `['bako', id]`, `['bako', id, 'activity']`,
`['bako', id, 'assets', memberId]`. Stale times 60/30/15 s per PRD §9.5.

MMKV instance(s) persist query cache, upload queue, download queue. Tokens in
expo-secure-store only. Route tree exactly as PRD §9.6. Root `_layout.tsx` is
owned by T05; later tickets add screens by creating route files only, Expo
Router picks them up, no layout edits needed.

Share intake boundary (T10): everything behind `useIncomingShare()` +
config plugin. Product code never imports plugin internals.

Upload engine boundary (T09): `enqueueUpload(item)` /
queue state observable. Screens never touch fetch/presign logic directly.

Download engine boundary (T13): `enqueueDownload(asset, mode)` where mode is
`'original' | 'jpeg'`.

## Changelog

- Initial freeze, derived from PRD §3, §5, §6, §7, §9.
