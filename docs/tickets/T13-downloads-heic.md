# T13 · Downloads and HEIC fallback

Wave 5 · Depends on: T08, T09 (queue patterns), T11 handoff interface
Owns: `apps/mobile/src/lib/download/**`,
`apps/mobile/src/app/bako/[id]/download.tsx`

## Goal

Resumable download queue per PRD §9.7: sequential per-photo camera-roll saves
via expo-media-library, each independently resumable, persistent progress
card, resume on relaunch, plus the HEIC fallback ladder from §9.4.

## Contract to resolve

CONTRACTS.md §5/§9.4/§11:

- Public surface is `enqueueDownload(asset, mode)` where mode is `'original' |
  'jpeg'`; screens never fetch bytes themselves.
- Originals byte-exact: presigned GET via `/assets/:id/url`, verify against
  stored sha-256, then save to camera roll. A hash mismatch retries before
  saving, never saves corrupt bytes.
- HEIC ladder: capability probe at save time; devices that cannot decode
  HEIC get "Save as JPEG" offered via `/assets/:id/rendition.jpg` (302 to
  cached transformation). "Save as JPEG" stays available explicitly everywhere.
- Download modal route shows selection summary + per-item resumable progress;
  state in MMKV; interruption loses at most one file.
- Zip endpoint exists server-side but mobile never uses it; do not build a
  client zip path.

## Decisions already made

- Default action everywhere is Original (decision 4). iOS always fine;
  Android >= API 28 defaults original too.
- Renditions are lazy server-side (`renditions/{hash}.jpg`); client just
  follows the redirect and caches.

## Gotchas

- expo-media-library save permissions differ across iOS limited-photo
  access and Android scoped storage; handle partial permission states or
  "saved" lies.
- Hashing large videos during download doubles time; stream-verify rather
  than download-then-hash if memory allows, or accept the cost and show it
  honestly in progress.
- The capability probe for HEIF decode is not exposed uniformly by RN;
  expect a small native module or platform-specific check. Keep it inside
  this package's boundary and document it for T16 review.
- Cloudflare Image Transformations require enabling on the zone (human step);
  without it, gate the jpeg mode behind a clear error, log as blocker.

## Done when

- 100-asset download survives force-kill twice with at-most-one-file loss,
  resumes correctly, final count exact.
- Byte-exactness proven by comparing source device file hash to saved file
  hash for HEIC and JPEG originals.
- Fallback path exercised on an Android < 9 device or emulator image, or the
  probe forced true via debug flag with the real-device test logged as pending.

## Async log

(append: date, what you decided or hit, why)
