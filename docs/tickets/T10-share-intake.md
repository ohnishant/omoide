# T10 · Share intake

Wave 4 · Depends on: T05 (shell), T08 (data layer), T09 interface (can code
against `enqueueUpload` signature before engine lands)
Owns: share config plugin, `apps/mobile/src/app/handle-share.tsx`,
`+native-intent.ts`, `src/lib/share/**`, `useIncomingShare()`

## Goal

The hook. Gallery → Share → Omoide → recent-Bakos bottom sheet → pick or
create Bako → queued upload, three taps after selection. Works signed-out:
payload parks until auth completes, then resumes (PRD §3 flow 1, §9.2).

## Contract to resolve

CONTRACTS.md §11 share boundary:

- Everything native behind one config plugin + `useIncomingShare()` hook;
  product screens import only the hook.
- `expo-sharing` receive-share path (SDK 57): plugin creates iOS Share
  Extension target + App Group, Android ACTION_SEND/_MULTIPLE intent filters.
- Payload URIs copied into app container storage immediately on receipt,
  before any UI waits on auth (source access dies when host suspends).
- Limits enforced: <=200 images, <=20 videos, media types only; overflow
  handled with a warm message, not silent truncation.
- `handle-share.tsx` flow: preview thumbnails → recent Bakos bottom sheet →
  create-new option → enqueue via T09 → dismiss back to source app feel.
- Parked payloads persisted (MMKV) and drained post-auth automatically.

## Decisions already made

- First-party expo-sharing receive-share is an owner-approved experimental
  bet (decision 3). The extension foregrounds the host app rather than doing
  work inside the ~120 MB extension memory ceiling. Named fallback if it
  proves unshippable: custom native extension, isolated behind the same hook.
- Any added step in this flow costs real adoption; when in doubt, cut a step.

## Gotchas

- This path is experimental and Apple-unblessed. Validate on REAL devices
  first thing, both platforms; simulator coverage is partial. Record device
  models + OS versions tested in the async log.
- Copying large videos takes time; show copy progress and handle disk-full
  gracefully (risk 4). Never block the sheet on copy completion for images.
- App Group id must match between plugin-generated entitlements and host
  config; mismatches fail silently with empty payloads.
- Android ACTION_SEND multi-image shapes vary wildly across OEM share sheets;
  build a fixture matrix from real devices.
- Cold-start vs warm-start receive paths differ; test sharing into a dead app.

## Done when

- Real-device demo: share 5 photos from Photos app cold and warm, pick Bako,
  see queue start; sign out, share again, park, sign in, watch resume.
- Limits and non-media types rejected cleanly.
- Plugin removal/replacement does not require touching product code
  (prove by reading the imports, note it here).

## Async log

(append: date, what you decided or hit, why)
