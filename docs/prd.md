# Omoide — PRD & Technical Design

Status: **Approved for build** · Owner decisions logged in §13 · Generated from handoff doc + two adversarial grill sessions (backend/infra/auth, mobile app)

---

## 1. Overview

Omoide (思い出, "memories") is a backup-first, share-later photo app for groups. After a trip, people pool everyone's photos **at full resolution** inside a shared box — a **Bako** (箱) — without clogging iCloud, Google Photos, or WhatsApp.

The hook: Omoide lives inside the native OS share sheet. Select photos → Share → Omoide → pick Bako → background upload. Three taps after gallery selection. Not a social feed: no likes, comments, or discovery. A private shelf of memory boxes, shared only by invitation link.

**Product north star:** frictionless share-trigger upload of pristine originals into a warm, tactile, non-digital-feeling app.

## 2. Vocabulary

| Term | Meaning |
|---|---|
| **Omoide** | The app. Pronounced oh-moy-deh. Sub-tagline: `思い出 · memories`. |
| **Bako** | One shared album. One trip, one Bako. Noun and verb ("drop it in the Bako"). |

Use these terms consistently in code, API, schema, and UI.

## 3. Core flows (priority order)

1. **Share trigger** — gallery → Share sheet → Omoide → recent-Bakos bottom sheet → pick/create Bako → background upload. Any added step here costs real adoption. Works even if the user isn't signed in yet: payload parks until auth completes, then resumes.
2. **Home shelf** — scrollable Bako cards (4-photo mosaic cover from most recent uploads, trip name, member count, "N new" badge), activity feed below, dashed "New Bako" card at shelf end.
3. **Inside a Bako** — chronological grid, member avatar filter bar, long-press multi-select → floating action bar (download selected / deselect), one-tap "Download all", full-screen viewer with contributor name + date on tap.
4. **Create Bako** — three steps: name → optional cover from gallery → invite link. Link-only invites; pasted into any existing group chat; opens app (or store) directly into the join flow.
5. **Onboarding** — wordmark welcome, email/Google/Apple sign-in, short tutorial of the non-obvious share-sheet trigger, then create-first-Bako or join-via-link.

### Screens (8)

shelf · bako/[id] · download modal · create modal · join/[token] · welcome · tutorial · photo/[assetId] viewer — plus handle-share intake sheet and settings riding along. Route tree in §9.6.

## 4. Design ideology

Cozy and nostalgic — opening a shoebox of old photos. If a choice makes it feel like Google Photos, it is wrong.

### Palette (theme tokens — zero hardcoded hex anywhere)

| Token | Hex | Use |
|---|---|---|
| cream | #F5F0E8 | Primary background |
| parchment | #EDE5D4 | Secondary surfaces, tab bars |
| terracotta | #C26B54 | Primary actions, CTAs, active nav |
| dusty rose | #D4857A | Accents, dot indicators, avatar fills |
| forest | #4A7C59 | Success, member-join indicators |
| espresso | #3A2F2A | Primary text |
| warm-muted | #A08070 | Secondary text, labels, metadata |
| warm-white | #FEFCF8 | Card surfaces, bottom nav |

No pure black, pure white, or blue-primary actions.

### Rules

- Typography: weights 400/500 only. System sans for UI; editorial serif allowed for wordmark. Sentence case everywhere.
- Bako covers: 2×2 mosaic of four most-recent uploads; empty cells filled parchment.
- Grid cells: 3–4px warm-white Polaroid border + subtle shadow; contributor name appears on tap only.
- Bottom sheets (@expo/ui BottomSheet) for all contextual actions — never full-screen modals for single decisions.
- Long-press triggers multi-select with a floating action bar.
- Upload progress: badge on Bako card + activity-feed line. Never an intrusive progress screen.
- **Light mode only for v1** (`userInterfaceStyle` locked). Dark mode arrives later as a "lamplight" palette (warm espresso tones, never black) behind the same theme tokens — tokens are mandatory now so that swap is mechanical.
- **Design finalization gate:** after screens are functionally complete, run the `/impeccable` skill set over every screen as a polish/QA pass before calling any screen done.

## 5. Freemium model

Free: 3 Bakos, 5 GB total storage. Paid: unlimited both. Per-Bako storage indicator ("2.1 GB of 5 GB used"). Enforcement:

- Hard block at limits with a warm paywall bottom sheet; visible quota meter on home shelf; upgrade prompt at 90%.
- Soft-limit overshoot accepted: concurrent uploads may overshoot by one file; newest asset quarantined (`over-quota`, excluded from grids) pending upgrade. No reservation ledger — deliberate consumer-grade tradeoff.
- Payments: **RevenueCat** (App Store + Play billing rules).
- Boundary behavior: block *new* uploads only; existing assets remain viewable/downloadable.

## 6. Monorepo architecture

pnpm workspaces + Turborepo. `.npmrc`: `node-linker=hoisted` (required for Expo/Metro).

```
omoide-slop/
├── apps/
│   ├── mobile/          # Expo SDK 57 (≥57.0.9), RN 0.86.2, New Arch, React Compiler ON
│   └── api/             # Hono on Cloudflare Workers — THIN adapter only
├── packages/
│   ├── contracts/       # zod schemas for every request/response + Hono RPC types
│   ├── core/            # platform-agnostic domain: bako CRUD, membership rules,
│   │                    #   quota math — defined against PORTS: StoragePort, DbPort, NotifierPort
│   └── db/              # Drizzle schema + SQL migrations (SQLite-pure for portability)
├── infra/               # sst.config.ts (SST v4 Ion)
└── docs/                # this PRD, ADRs
```

**Dependency law:** `core` never imports Hono, `@cloudflare/workers-types`, or React Native. Anything needing `Request`/`env` belongs in an adapter. Share-extension target imports `contracts` + a slim upload client only. This keeps the future web app a new thin adapter over the same core/contracts/db.

## 7. Backend (apps/api)

Hono on Cloudflare Workers consuming zod contracts via `@hono/zod-validator`; typed RPC (`hc<AppType>`) shared to clients — no OpenAPI codegen step.

### Database — Cloudflare D1 + Drizzle

Tables: `users`, `bakos`, `memberships`, `assets`, `activity`, `upload_sessions`.

- Photo rows ~400–800B; even 5M assets lands ~3–5 GB against D1's hard **10 GB ceiling** (permanent — 2–3 year horizon).
- **Escape hatch (must not rot):** keep Drizzle schema SQLite-clean and ALL queries inside `packages/core`; hatch = shard per-Bako D1 databases or migrate to Postgres (Neon/Hyperdrive) as a mechanical rewrite.
- Atomic quota guard: `UPDATE users SET used_bytes = used_bytes + ? WHERE id = ? AND used_bytes + ? <= quota` — check `meta.changes`; D1 `batch()` makes guard+insert one atomic unit.
- Migrations: `drizzle-kit generate` SQL committed; applied via `wrangler d1 migrations apply` as a scripted CI post-deploy step.

### Storage — private R2 bucket

**Upload flow (direct-to-R2, presigned):**

1. Client: `POST /bakos/:id/uploads` `{fileName, byteSize, contentType, contentHash}`.
2. Worker: membership check → quota pre-check → insert row `status=pending` → mint credentials.
3. Images (<100 MB): single presigned S3 PUT. Videos/large files: S3-compatible multipart via `aws4fetch` — ~16 MB parts, parallel, per-part retry, part ETags returned, `CompleteMultipartUpload` flips row to `ready`.
4. Integrity: client computes SHA-256 while reading the file; key is content-addressed (`bakos/{bakoId}/{hash}.{ext}`) giving free dedupe and idempotent retries. Post-upload HEAD verifies size/hash match.
5. Never relay bytes through the Worker (duration/CPU limits). Presigned URLs pin Content-Type; expiry 1–6 h. Lifecycle rule aborts orphaned multipart uploads (mandatory — silent cost otherwise).

**Download flow:** private bucket, no public access, no `r2.dev`. Worker checks membership → mints short-lived presigned GETs (60 s–15 min). Downloads metered at mint-time ("download events"); if byte-metering ever becomes a billing requirement, swap endpoint to Worker-proxied streaming — a Port swap, not a redesign.

**"Download all" zip:** Worker streams fflate zip (STORE method — media is already compressed) straight from R2 bindings; never buffer whole objects (128 MB isolate limit). Batch large Bakos per-N-photos. Mobile ships sequential resumable saves instead (§9.7); zip endpoint primarily serves web/desktop later.

CORS configured on the bucket in IaC (needed for future web; harmless for native).

### Auth — WorkOS AuthKit (owner decision)

Managed hosted login; **free up to 1M MAU**. Providers: email/password + Google + Sign in with Apple (Apple mandatory for App Review once Google is offered). Tradeoff accepted by owner: provider/redirect config lives in the WorkOS dashboard.

Flow (mobile):

1. App calls API `GET /auth/authorize` → Worker mints AuthKit authorization URL with PKCE (verifier held server-side, keyed by state, short TTL).
2. App opens URL in system browser (`expo-web-browser` auth session). Hosted AuthKit UI handles email/Google/Apple.
3. Redirect to app scheme → app sends `code` to `POST /auth/token`.
4. Worker exchanges code server-side via `@workos-inc/node` (client secret stays off-device) → returns access + refresh tokens.
5. App stores tokens in `expo-secure-store`; sends bearer access token on API calls.
6. API verifies JWTs via WorkOS JWKS (`jose`). Refresh handled through API endpoint (server-side refresh-token rotation).
7. Not-signed-in shares park payloads and resume after auth completes.

Future web reuse: same WorkOS project, `@workos-inc/authkit-nextjs` adapter — zero duplication.

### Quota & accounting

`storage_used_bytes` on user row incremented atomically at finalize (guarded statement above). Enforcement points: (1) pre-check at URL mint (fast UX rejection), (2) authoritative guard at finalize (race safety), (3) 3-Bako cap at creation.

### Push notifications

Expo push service (`expo-notifications`) abstracting APNs/FCM; receipts for delivery tracking. Activity events (new upload, member joined) trigger pushes — which also serve as natural wake-ups for Tier B uploads.

### Invites

Universal/App Links on owned domain: `https://omoide.app/join/<signed-token>`. HMAC-signed expiring token encoding bako ID + inviter. Join endpoint validates cap/quota before adding. AASA (`/.well-known/apple-app-site-association`) and assetlinks.json served by the Worker — fully IaC'd. Custom scheme kept as dev fallback.

## 8. Storage economics (why R2)

Originals are the product — never recompressed server-side. Chosen over S3 because Omoide is download-heavy (full-res album pulls, zips): S3 egress at $0.09/GB would dominate the bill (~$900/mo at 1 TB stored / 10 TB served); **R2 = $0 egress forever**, $0.015/GB-mo storage, S3-compatible API, 10 GB free tier. Thumbnails add ~5% storage. Minimum burn approved by owner: domain ~$15/yr + Apple Developer $99/yr + Workers Paid $5/mo + RevenueCat.

## 9. Mobile app (apps/mobile)

Expo SDK 57 (≥57.0.9 — Hermes memory-regression fix), RN 0.86.2, New Arch mandatory, React Compiler ON. Dev builds mandatory (share extension, MMKV, secure-store, push); Expo Go unsupported — enforce dev-client launcher.

### 9.1 Styling

Plain `StyleSheet` + frozen typed `theme.ts` token object (`color/space/radius/font/shadow`) + `useTheme()`. NativeWind rejected: v5 preview-quality, className transform conflicts with React Compiler, needless CSS engine for 8 screens and a tiny custom palette.

### 9.2 Share intake (the hook)

First-party `expo-sharing` receive-share support (SDK 57): config plugin creates iOS Share Extension target + App Group and Android intent filters (`ACTION_SEND`/`_MULTIPLE`). Extension foregrounds host app and hands payloads across (sidesteps the ~120 MB extension memory ceiling); main app reads via `+native-intent.ts` → `/handle-share` route + `useIncomingShare()`. Payload URIs copied into app container before upload (source access dies when host suspends). Limits: ≤200 images / ≤20 videos per share; media types only. Isolated behind one config plugin + hook so a custom native extension can replace it without touching product code. Validate on real devices early — simulator coverage is partial.

### 9.3 Upload engine (tiered honesty)

- **Tier A — foreground + grace:** JS sequential queue; runs while app open or within the ~30 s post-backgrounding grace window. Covers the dominant case (share → app forwards → finish in seconds/minutes). MMKV-persisted queue state; resumes on relaunch/reconnect (NetInfo).
- **Tier B — opportunistic:** `expo-background-task` (BGTaskScheduler / WorkManager) drains remnants whenever the OS allows. Best-effort; never an SLA.
- Product language never promises more than Tier A delivers: pending = clock icon ("will upload when Omoide opens"); active = spinner.
- Videos ride the settled multipart contract with part-level persisted progress.

### 9.4 Media policy — originals & HEIC (owner decision: lossless downloads required)

- **Originals are uploaded and stored byte-exact.** No server-side transcoding ever. SHA-256 verified post-upload. This is what "backup-first" means.
- **Thumbnails** (display-only): 480px long-edge **WebP q75**, client-side via `expo-image-manipulator`, uploaded alongside original → `bakos/{id}/thumbs/{hash}.webp`. Mosaic covers reuse grid thumbs (composite is layout, not a separate asset). Video posters via `expo-video-thumbnails`.
- **Lossless download strategy:** default action everywhere is **Original** — byte-identical file, verified against stored hash. iOS renders HEIC natively (always fine). Android ≥ 9 (API 28) decodes HEIF broadly — original is the default there too.
- **Fallback ladder** for devices that cannot decode HEIC (Android < 9, some OEM gaps):
  1. Capability check at save time (`MediaCodecList`/decoder probe).
  2. If unsupported → offer **"Save as JPEG"**: full-size JPEG rendition generated on demand via Cloudflare Image Transformations (HEIC input supported), cached into R2 under `renditions/{hash}.jpg`. Lazy = near-zero storage cost; rare legacy path = negligible transformation spend. Max-quality setting to stay faithful to the original.
  3. "Save as JPEG" remains available as an explicit option on any device for maximum out-of-app compatibility.
- Zips contain originals only, byte-exact.
- **Scope:** images are v1 focus; videos supported end-to-end (multipart upload, poster frames, streamed playback via presigned URL) as designed but polished second. Live Photo / motion-photo pairing deferred to v2 — stills are taken silently; note it in the tutorial.

### 9.5 Data layer

TanStack Query v5 wrapping the Hono RPC client in one `api.ts` (`['bakos']`, `['bako', id]`, `['bako', id, 'activity']`, cursor-paginated assets; stale times 60/30/15s). **MMKV** (Nitro, new-arch) persists query cache + upload/download queues; tokens live in secure-store only. Optimistic uploads: pending assets projected into grid data as shimmer cells; card mosaics show pending slots. Offline reads served from persisted cache; offline writes = queuing uploads only.

### 9.6 Route tree

```
apps/mobile/src/app/
├── _layout.tsx                  # root Stack + providers, Stack.Protected auth guard
├── index.tsx                    # redirect to /(app)/shelf or /(auth)/welcome
├── +native-intent.ts            # intercept expo-sharing:// → redirect /handle-share
├── (auth)/
│   ├── _layout.tsx
│   ├── welcome.tsx              # email / Google / Apple via AuthKit
│   └── tutorial.tsx             # share-flow walkthrough (re-entry from settings)
├── (app)/
│   ├── _layout.tsx              # signed-in shell
│   ├── shelf.tsx                # Bako cards + activity feed
│   ├── bako/
│   │   ├── [id].tsx             # grid, member bar, long-press multi-select
│   │   └── [id]/download.tsx    # modal: selection summary + resumable progress card
│   ├── create.tsx               # modal: name → cover → invite link
│   ├── join/[token].tsx         # universal-link landing → preview → accept
│   ├── handle-share.tsx         # share-intake sheet: preview → pick Bako → queue
│   ├── photo/[assetId].tsx      # full-screen Reanimated pinch/pager viewer
│   └── settings.tsx             # profile, quota meter, tutorial, sign out
```

Single stack + modals; **no tabs**. Sheets via @expo/ui BottomSheet.

### 9.7 Rendering & downloads

FlashList v2, uniform 3-column Polaroid squares (no masonry), expo-image cells with `recyclingKey` + disk cache. Custom Reanimated viewer (pinch-zoom + pager), thumb → progressive original. **No client-side zip:** downloads are sequential per-photo camera-roll saves via `expo-media-library`, each independently resumable, persistent progress card + resume-on-relaunch (queue in MMKV). Interruption loses at most one file.

## 10. Infrastructure as Code

**SST v4 (Ion/Pulumi)** in `infra/sst.config.ts`: `sst.cloudflare.Worker` (+ links for R2/D1 bindings/secrets), `sst.cloudflare.Bucket` (CORS + multipart-abort lifecycle rules), D1 database, custom domain routes, AASA/assetlinks serving. Stages dev/prod free. `sst deploy` from CI (GitHub OIDC + scoped Cloudflare API token). Alchemy rejected (v2 beta churn — violates known-great rule; revisit in 12 months); Terraform rejected (HCL/TS split-brain); wrangler-only rejected (no state graph/stages once domains+CORS+lifecycle enter).

### Unavoidable manual steps (one-time; everything else is `sst deploy`)

1. Cloudflare account + R2 enablement (card) + Workers Paid subscription.
2. Domain purchase + DNS zone on Cloudflare.
3. WorkOS account: enable User Management/AuthKit, configure Google + Sign in with Apple credentials, register redirect URIs, set custom domain.
4. Google Cloud Console: OAuth consent screen + Android/iOS/Web clients (SHA-1 fingerprints).
5. Apple Developer Program: App ID (Sign in with Apple + associated domains entitlement), APNs .p8 key, signing certs, app record.
6. Firebase project for FCM (service-account JSON → `eas credentials`).
7. Store consoles: App Store Connect + Play Console listings.
8. GitHub secrets for CI deploys.

## 11. Risks (ranked)

1. **Background-upload honesty** — iOS gives ~30s grace + opportunistic tasks, nothing more. In-product copy must never oversell (§9.3).
2. **`expo-sharing` receive path is experimental** (extension foregrounding host is Apple-unblessed) — contained blast radius, named fallback (custom native extension).
3. **D1 10 GB permanent ceiling** — escape hatch stays alive only if queries stay in `core` and schema stays SQLite-pure. Enforced in review.
4. **Large-video share payloads** — container copy needs progress UI + disk-full handling.
5. **Zip-of-originals duration** on huge Bakos — batch per-N; mobile uses sequential saves anyway.
6. **Orphaned multiparts** — lifecycle abort rule is mandatory from day one.
7. **pnpm hoisting drift** — `node-linker=hoisted` documented in AGENTS.md; removal breaks pods/React resolution.
8. **SDK-version memory regressions** — pin ≥57.0.9; memory-profile the grid screen.
9. **Apple review** — Sign in with Apple must ship alongside Google; don't defer entitlement wiring.

## 12. Build phases

1. **Foundations** — monorepo restructure (move scaffold → apps/mobile), Turborepo, contracts/core/db packages, SST skeleton deploying hello-world Worker + bucket + D1.
2. **Backend vertical slice** — schema + migrations, WorkOS auth endpoints, bako/membership CRUD, presign + finalize upload flow, quota guards. Contracts-first.
3. **Mobile shell** — theme tokens, route tree, auth flow, shelf with placeholder data, TanStack Query + MMKV wiring.
4. **Upload pipeline** — thumbnail pipeline, hash computation, presigned PUT/multipart client, optimistic grid projection, Tier A queue.
5. **Share intake** — expo-sharing plugin, handle-share sheet, parked-payload resume, real-device validation.
6. **Bako detail** — FlashList grid, member filter, multi-select, viewer.
7. **Downloads** — resumable saver queue, progress cards, HEIC fallback path.
8. **Invites + push + join flow** — universal links, signed tokens, Expo push wiring.
9. **Create/onboarding/tutorial** — full Flow 4 + Flow 5 polish.
10. **Design finalization gate** — run `/impeccable` across every screen; fix findings before store submission prep. Then EAS production builds.

## 13. Decision log

| # | Decision | Choice | Notes |
|---|---|---|---|
| 1 | Object storage | Cloudflare R2 | $0 egress beats S3 decisively for download-heavy product |
| 2 | Auth | **WorkOS AuthKit** (owner override of Better Auth rec) | Simplicity chosen over self-hosted code-first purity; dashboard config accepted |
| 3 | Share intake | First-party `expo-sharing` receive-share | Owner-approved experimental bet; fallback named |
| 4 | Original fidelity | Byte-exact originals, lossless downloads, HEIC preserved | Owner: HEIC is necessary; JPEG fallback via lazy renditions for legacy devices |
| 5 | Media scope | Images first, videos supported second, motion photos v2 | Owner directive |
| 6 | Free-tier enforcement | Hard block + warm paywall; soft-limit overshoot accepted | Owner-approved |
| 7 | Theme | Light-only v1; tokens mandatory; dark mode later | `/impeccable` gate added to design finalization phase |
| 8 | Recurring costs | Approved: domain, Apple $99/yr, Workers Paid $5/mo, RevenueCat | Owner-approved |
