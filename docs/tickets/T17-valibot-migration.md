# T17 · Valibot migration (contracts)

Owner decision logged 2026-08-22: replace zod with **valibot** as the schema
library behind `@omoide/contracts`. Deferred to a future migration so it does
not block the T03-T16 waves; pick it up as its own iteration whenever the
board allows (earlier is cheaper — see Gotchas).

Depends on: T02 (done)
Owns: `packages/contracts/**` (+ its package.json / root lockfile)

## Goal

Swap every schema in `@omoide/contracts` from zod v4 to valibot while keeping
the package's public surface byte-identical:

- exported TS types (`User`, `BakoSummary`, `BakoDetail`, `Asset`,
  `ActivityEvent`, all request/response types, `ErrorEnvelope`)
- runtime constants and error-code/status map
- `hc<AppType>` inference behavior proven by the type-level tests
- wire shapes per CONTRACTS.md §1–§5 (CONTRACTS.md itself must not change)

This is a library swap, not a contract change.

## Notes for implementation

- API mapping to expect: `z.object` → `v.object`, `z.enum` → `v.picklist`,
  `z.literal` → `v.literal`, `z.discriminatedUnion('mode', ...)` →
  `v.variant('mode', ...)`, `.refine` → `v.check`/`v.pipe`, transforms via
  `v.pipe` + `v.transform`, inference via `v.InferInput`/`v.InferOutput`.
  Regex checks become `v.pipe(v.string(), v.regex(...))`.
- The hand-rolled `vJson`/`vQuery` middleware in `src/app-type.ts` is typed
  against `z.ZodType` / `z.input` / `z.output`. Re-port it to valibot's
  `GenericSchema` input/output types (or adopt `@hono/valibot-validator`) —
  whatever keeps client-side request/response inference exactly as today.
- Type-level tests in `src/app-type.test.ts` assert contract shapes, not
  zod internals; they should pass unchanged. That is the regression gate.
- Round-trip tests in `src/schemas.test.ts` may need mechanical rewrites of
  fixtures only where zod-specific APIs were exercised.
- Dependency law holds: runtime deps after migration are exactly
  `{ valibot, hono }`. No new runtime deps beyond that pair.

## Gotchas

- Timing: the longer this waits, the more call sites accumulate in
  T06 (core), T07 (api validators), T08 (mobile RPC client), T09/T13 (upload
 /download engines parsing responses). Migrating before T07/T08 start means
  the blast radius stays inside `packages/contracts`. If picked up late,
  expect follow-up edits in consumers' validator imports
  (`@hono/zod-validator` → `@hono/valibot-validator`) — coordinate via their
  async logs instead of editing their files.
- Do not rename exported symbols while migrating; downstream tickets import
  them by name.
- Keep vitest running with `--dir src` and keep the DOM lib addition in the
  package tsconfig (hono still needs fetch globals).

## Done when

- `pnpm --filter @omoide/contracts test` green with zero zod references left
  (`rg -i zod packages/contracts` returns nothing outside this ticket).
- Root `pnpm typecheck && pnpm test && pnpm build` green across workspaces.
- Async log appended with any API-mapping surprises worth remembering.

## Async log

(append: date, what you decided or hit, why)

- 2026-08-23: Migrated in review-sized chunks on `t3code/valibot-migration`
  (add dep → port schemas per module → re-port middleware → test call sites →
  drop zod). Intermediate commits are `[WIP]`-tagged and NOT individually
  buildable: domain→bakos/uploads, schemas→app-type middleware typing, and
  tests↔schemas are mutually coupled, so only the branch tip is a coherent
  tree. Chose `[WIP]` subject prefix over Conventional Commits `!`, which
  means breaking change, not broken build.
- 2026-08-23: API mapping surprises worth remembering:
  - valibot has no `.extend`; `bakoDetailSchema` spreads
    `bakoSummarySchema.entries`. Adding fields to the summary silently flows
    into detail — same as zod extend, but now it is spread-order dependent.
  - `z.enum(TUPLE)` → `v.picklist(ERROR_CODES)`; picklist accepts the readonly
    tuple directly.
  - `.trim()` is an effect inside `v.pipe`, not a chainable method:
    `v.pipe(v.string(), v.trim(), v.minLength(1))`.
  - Middleware ported by hand onto `GenericSchema` +
    `InferInput`/`InferOutput` (same `{in,out}` shape as before) instead of
    adopting `@hono/valibot-validator` — keeps runtime deps at exactly
    `{ valibot, hono }` and client inference byte-identical. `@hono/
    valibot-validator` was NOT added; T07/T08 can still adopt it later if
    they want, via their own tickets.
  - valibot `safeParse` failure carries `issues[]`, not zod's single
    `error.message`; the 400 invalid_request envelope now joins issue
    messages with ", ". Message text differs from zod but the envelope shape
    (CONTRACTS.md §1) is unchanged.
