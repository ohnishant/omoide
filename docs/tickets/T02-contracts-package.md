# T02 · contracts package

Wave 1 · Depends on: T01
Owns: `packages/contracts/**`
Consumed by: T06, T07, T08 and every mobile feature ticket. Highest-leverage
ticket on the board.

## Goal

Every request/response body, error code, domain type, and route definition as
zod schemas plus the Hono `AppType` for RPC typing (PRD §7). No runtime logic
beyond zod.

## Contract to resolve

You are implementing CONTRACTS.md §1-§5 verbatim. That file is your spec:

- Error envelope + all seven error codes with HTTP mapping.
- Free-tier constants `FREE_BAKO_LIMIT`, `FREE_BYTE_QUOTA`,
  `PAYWALL_WARN_RATIO`.
- Auth routes §2, resource routes §3 with the exact `User`, `BakoSummary`,
  `BakoDetail`, `Asset`, `ActivityEvent` types.
- Upload init/parts/complete §4 including single vs multipart discriminated
  union.
- Download routes §5.
- Export the Hono `AppType` chain so `hc<AppType>` works even before the api
  app exists: define it against stub handlers in the package if needed, T07
  re-exports/implements the real one. The shape of `AppType` must match the
  route table exactly; clients in T08 compile against it.

## Decisions already made

- Typed RPC via `hc<AppType>`, no OpenAPI codegen (PRD §7).
- Zod v4 (or latest stable); schemas double as runtime validators via
  `@hono/zod-validator` in the api app.
- Cursors are opaque strings; do not leak row ids as cursor semantics.
- Epoch ms integers everywhere on the wire, matching db columns.

## Gotchas

- This package is imported by the share extension path too (PRD §6). Keep it
  free of Hono server imports except the type-level `AppType`; types are
  erased, values are not.
- Discriminate upload modes on `mode`, not on presence of fields. Clients
  switch on it.
- `thumb` is nullable in upload-init but the response always carries a
  thumbnail slot when the client sent one. Encode that link explicitly or T09
  will guess wrong.
- Do not add endpoints not in CONTRACTS.md. If something is missing (you will
  find gaps), edit CONTRACTS.md + changelog first, then implement. That edit
  is the integration signal for every other agent.

## Done when

- `pnpm --filter @omoide/contracts test` passes: round-trip parse tests for
  each schema, error-code/status mapping table tested.
- `hc<AppType>` infers correct request/response types for every route (a
  type-level test file proves at least one happy path and one error path).
- Zero dependencies beyond zod + hono types.

## Async log

- 2026-08-22 — Implemented §1-§5 as zod v4 schemas (`src/domain|auth|bakos|
  uploads|downloads|errors.ts`) + constants. Runtime deps are exactly `zod`
  and `hono` (hono needed at type level for `AppType`; vitest is dev-only).
- 2026-08-22 — "402-style 403" for `bako_limit_reached` read as: HTTP status
  is **403**, paywall flavor carried by the error code. Clients must switch
  on `code`, never on status (also true for quota_exceeded=413 vs generic
  rejections). Flagged in ERROR_STATUS doc comment.
- 2026-08-22 — Upload-init response `thumbnail` slot modeled nullable and the
  request-thumb link documented in schema comments: response carries a slot
  iff request `thumb` was non-null. T09: switch on that, don't guess.
- 2026-08-22 — `AppType` derived from a stub Hono app in `src/app-type.ts`
  with typed fixtures, so `hc<AppType>` infers exact request/response types.
  index.ts re-exports **only** `type AppType`; dist/index.js has zero hono
  imports (verified) — share extension stays hono-free. T07 should replace
  stubs with real handlers but keep this module's shape (or re-export from
  api) so T08 client typing keeps compiling.
- 2026-08-22 — Wrote hand-rolled `vJson`/`vQuery` middleware inside
  app-type.ts that mimics zValidator's `{in,out}` typing so request bodies/
  query params infer without adding `@hono/zod-validator` (ticket caps deps).
  It also actually validates and returns the §1 invalid_request envelope.
  T07 may swap in zod-validator; input types must stay identical.
- 2026-08-22 — POST /bakos stub encodes the success+error union
  (`BakoDetail | ErrorEnvelope`) as the one proven error path in type tests;
  per §1 any route can return the envelope, only this one is type-visible.
- 2026-08-22 — Assumption: `platform` on POST /devices constrained to
  `'ios' | 'android'` (CONTRACTS.md left it open). Edit contracts if more
  platforms needed later.
- 2026-08-22 — Gotchas for next agents: package tsconfig adds DOM lib
  (hono types reference fetch globals); vitest runs `--dir src` so dist test
  copies aren't collected; TypeScript 6 requires parenthesizing
  `(typeof x)["prop"]` chains in type-level tests.
