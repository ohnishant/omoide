# T09 · Mobile upload engine

Wave 4 · Depends on: T07 (routes live), T08 (data layer)
Owns: `apps/mobile/src/lib/upload/**`, thumbnail pipeline
`apps/mobile/src/lib/media/**`

## Goal

Tier A upload queue per PRD §9.3: sequential JS queue, MMKV-persisted state,
resume on relaunch/reconnect, sha-256 while reading, presigned single PUT for
images and multipart with part-level persisted progress for videos, thumbnail
generation uploaded alongside the original.

## Contract to resolve

CONTRACTS.md §4 and §11:

- Public surface is exactly `enqueueUpload(item)` plus an observable queue
  state; screens never touch presign/fetch logic.
- Client computes sha-256 while streaming the file read (no second pass).
- Single mode: PUT original + PUT thumb, then the finalize mechanism chosen
  in T07 (read their async log; if undecided, empty-parts complete).
- Multipart mode: ~16 MB parts, parallel in flight but sequential queue
  overall, per-part retry, ETags collected into complete call.
- Post-upload HEAD verifies size/hash before marking done.
- Thumbnails: 480 px long-edge WebP q75 via expo-image-manipulator; video
  posters via expo-video-thumbnails. Keys per CONTRACTS.md §8.
- Queue state persisted to MMKV; resume on relaunch and NetInfo reconnect.
  Pending items project into grids via T08's optimistic helpers.

## Decisions already made

- Tiered honesty: Tier A foreground + ~30 s grace covers the dominant case;
  product copy never oversells. Clock icon for pending, spinner for active.
  Tier B (`expo-background-task`) opportunistic drain is a stretch goal at
  the end of this ticket, never a promise.
- Originals byte-exact, no transcoding ever (PRD §9.4).

## Gotchas

- iOS backgrounding kills the JS context shortly after grace expires; persist
  part progress after every part, not at queue end.
- HEIC files: image manipulator must not re-encode the original, only the
  thumb. Verify original bytes are untouched (hash before/after).
- Large video container copies from share intake need disk-space checks;
  coordinate with T10's payload copy, expose `enqueueUpload` to accept
  already-copied local URIs.
- expo-image-manipulator WebP support varies by platform version; verify on
  real devices early, log fallbacks if q75 WebP fails anywhere.
- Upload of a file already `ready` in the bako returns conflict/dedupe;
  treat as success-and-skip so retries never duplicate rows.

## Done when

- 50-photo batch uploads over flaky network (airplane-mode toggling test)
  completes with zero duplicates and zero lost queue entries after relaunch.
- A >100 MB video uploads multipart with visible per-part progress that
  survives app kill mid-upload and resumes.
- Thumbnail appears in grid data after upload without full refetch
  (cache patch via T08 helpers).

## Async log

(append: date, what you decided or hit, why)
