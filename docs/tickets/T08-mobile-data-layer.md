# T08 · Mobile data layer and RPC client

Wave 3 · Depends on: T02, T05
Owns: `apps/mobile/src/lib/**`, `apps/mobile/src/api/**` (screens consume,
never modify)

## Goal

One `api.ts` to rule them all: Hono RPC client wrapped in TanStack Query v5,
MMKV persistence, optimistic upload projection helpers, quota selectors
(PRD §9.5). Every screen ticket consumes this instead of fetching directly.

## Contract to resolve

CONTRACTS.md §11:

- `createApiClient({ getToken })` over `hc<AppType>` from @omoide/contracts.
- Query keys exactly: `['auth','me']`, `['bakos']`, `['bako', id]`,
  `['bako', id, 'activity']`, `['bako', id, 'assets', memberId]`. Stale times
  60/30/15 s per PRD §9.5.
- MMKV-persisted query cache; tokens stay in secure-store only.
- Exported hooks at minimum: `useMe`, `useBakos`, `useBako(id)`,
  `useBakoAssets(id, memberId?)` with infinite cursor pagination,
  `useBakoActivity(id)`.
- Optimistic projection helpers screens use for pending uploads:
  given queue items, produce shimmer placeholder cells shaped like `Asset`
  with `status:'pending'`, and mosaic cover slots for the shelf.
- Offline reads come from persisted cache; no online-only code paths.

## Decisions already made

- TanStack Query v5, MMKV Nitro under new arch, exact versions recorded by
  T05; reuse theirs.
- Cursor pagination via `useInfiniteQuery`; opaque cursors, never parsed.

## Gotchas

- React Compiler + Query v5: avoid manual queryClient mutation inside render;
  patterns that were fine pre-compiler will warn or break.
- Persisted cache must not leak tokens; the api client injects Authorization
  at fetch time from secure-store, never embeds it in cached payloads.
- The RPC client must work before T07 deploys anything real: build against
  contracts types with msw or a typed mock server so screens are not blocked,
  and note which mocks exist here so T07 integration swaps are mechanical.
- Query key drift is the classic silent bug; export key factories, forbid
  inline array keys in screens (lint rule if cheap).

## Done when

- All listed hooks work against mocks AND against a live worker once T07
  lands (record the swap date).
- Kill app → relaunch offline → shelf renders from cache.
- A demo screen (temporary, removable) exercises every hook including
  infinite scroll and error states.

## Async log

(append: date, what you decided or hit, why)
