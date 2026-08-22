# T12 · Shelf screen

Wave 4 · Depends on: T05, T08
Owns: `apps/mobile/src/app/shelf.tsx`, `src/features/shelf/**`

## Goal

Home shelf per PRD §3 flow 2: scrollable Bako cards with 2x2 mosaic covers,
trip name, member count, "N new" badge, activity feed below, dashed
"New Bako" card at the end. Quota meter visible per PRD §5.

## Contract to resolve

CONTRACTS.md §10/§11 plus PRD §4 rules:

- Mosaic cover: 2x2 of four most-recent ready thumbs from
  `BakoSummary.coverThumbKeys`; empty cells filled parchment token; composite
  is pure layout, not a separate asset.
- Pending uploads project as pending slots in mosaics via T08 optimistic
  helpers (upload progress = badge on Bako card + activity line, never a
  progress screen).
- "N new" badge from `newCount`; tapping a bako navigates to `/bako/[id]`.
- Activity feed below cards from `useBakoActivity`-shaped data on the shelf
  query; dashed New Bako card routes to create modal (T15 owns it; navigate,
  do not implement).
- Quota meter reads `['auth','me']` usage/quota; at >= 90% surface the
  upgrade prompt state (visual only; paywall sheet is T15).
- All tokens via `useTheme()`; sentence case; weights 400/500.

## Decisions already made

- Shelf is the app's face: cozy and nostalgic, shoebox feeling (PRD §4). If
  it looks like Google Photos it is wrong. Polaroid borders and subtle shadow
  tokens over flat modern cards.

## Gotchas

- Mosaic thumbs come from presigned or CDN-ish thumb URLs; coordinate with
  T08/T07 on how thumb URLs reach the client (contract currently carries
  keys, not urls). If you need a `thumbUrl` resolution endpoint or client-side
  URL builder, amend CONTRACTS.md with a changelog entry BEFORE building;
  T11 needs the same answer for grid cells, so decide once.
- Empty states matter here: zero bakos (dashed card only), zero assets in a
  bako (parchment mosaic), offline (cached). Design all three now, not in
  the design gate.
- FlashList for the shelf too if feed+cards share the scroll; nested
  VirtualizedLists are a known trap.

## Done when

- Shelf renders mock data matching contract types including all three empty
  states; live-data swap after T07/T08 integration noted with date.
- Upload-in-progress badge appears while queue active without any navigation.
- Typecheck/lint green; no hex literals outside theme.

## Async log

(append: date, what you decided or hit, why)
