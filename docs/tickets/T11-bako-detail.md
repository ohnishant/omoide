# T11 · Bako detail screens

Wave 4 · Depends on: T05, T08 (T09 for optimistic projection shapes)
Owns: `apps/mobile/src/app/bako/**`, `photo/[assetId].tsx`,
`src/features/bako/**`

## Goal

Inside-a-Bako experience per PRD §3 flow 3: chronological 3-column FlashList
grid of Polaroid cells, member avatar filter bar, long-press multi-select with
floating action bar, one-tap download-all handoff to T13, full-screen Reanimated
viewer.

## Contract to resolve

CONTRACTS.md §10/§11 plus PRD §9.6-§9.7:

- Grid: FlashList v2, uniform squares, no masonry; expo-image cells with
  `recyclingKey` + disk cache; thumbs only in grid.
- Cells: 3-4 px warm-white border + subtle shadow token; contributor name on
  tap only. Pending assets render as shimmer cells from T08 optimistic
  helpers; `over_quota` assets never appear in grids.
- Member filter bar: avatars filled by cycling `avatarFills`; filter feeds
  `['bako', id, 'assets', memberId]`.
- Multi-select: long-press enters selection, floating action bar (download
  selected / deselect). Download action calls T13's `enqueueDownload(asset,
  'original')` per asset and opens the download modal route.
- Viewer: custom Reanimated pinch-zoom + pager, thumb loads first then
  progressive original via presigned URL from `GET /assets/:id/url`;
  contributor name + date overlay on tap.
- All colors/spacing/radius/shadows via `useTheme()` tokens.

## Decisions already made

- No client-side zip on mobile; downloads are sequential saves handled by
  T13. Your job ends at enqueueing.
- Videos in viewer stream via presigned URL (expo-video); polish second,
  function first (decision 5).

## Gotchas

- Memory is the risk here (risk 8): profile the grid at 500+ assets on the
  oldest device you can find; SDK >= 57.0.9 pin exists because of Hermes
  regressions. Record peak memory numbers in the async log.
- Long-press must not fight scroll or the viewer's pinch gestures; gesture
  composition is where this screen gets janky, test on device not simulator.
- Progressive original loading can double memory if thumb stays mounted;
  release aggressively on pager swipe-away.
- Do not edit `_layout.tsx` for the download modal presentation; coordinate
  via your async log if the route needs a presentation change owned by T05.

## Done when

- 60 fps scroll through a 1000-asset bako on a mid-tier Android device.
- Multi-select → download selected hands off N assets correctly; deselect
  and partial states clean up after themselves.
- Viewer survives rapid swiping between HEIC originals without OOM.

## Async log

(append: date, what you decided or hit, why)
