# T03 · db package

Wave 1 (parallel with T02, T04) · Depends on: T01
Owns: `packages/db/**`

## Goal

Drizzle schema for the six tables plus committed migration SQL (PRD §7).
SQLite-pure. No queries here; all queries live in core (T06).

## Contract to resolve

CONTRACTS.md §6 verbatim: table and column names, types, indexes, the
`users.storageUsedBytes` quota column that the atomic guard in T06 updates.
Status enums match the wire enums in §3/§4 exactly ('pending' | 'ready' |
'over_quota' | 'failed', etc). Export inferred row types (`typeof users.$inferSelect`)
so core and api never hand-write them.

## Decisions already made

- D1 + Drizzle on Cloudflare (PRD §7); SQLite dialect only. The Postgres
  escape hatch stays mechanical only if nothing dialect-specific leaks in
  (risk 3). No `PRAGMA`, no FTS5, no JSON1 tricks without logging it as an
  escape-hatch cost in the async log.
- Migrations via `drizzle-kit generate`, SQL files committed to the package,
  applied by `wrangler d1 migrations apply` in CI post-deploy (wired by T04).
- Epoch ms integers for timestamps, matching the wire contract.

## Gotchas

- D1 has no native uuid; generate ids application-side (`crypto.randomUUID()`)
  with text pk columns. Do not reach for autoincrement.
- Foreign keys: declare them in schema for documentation but verify D1's
  foreign_keys pragma behavior in the migration runner before relying on
  cascade deletes; log what you found.
- Row width matters at 5M assets (10 GB ceiling). Prefer short text ids and
  avoid duplicated denormalizations unless a query in PRD §3 demands one.
- drizzle-kit config must point at the local sqlite file for generation while
  production runs against D1. Keep both configs in-package so T07 does not
  reinvent them.

## Done when

- `pnpm --filter @omoide/db generate` produces clean SQL from an empty
  database, checked into `migrations/`.
- A local test applies migrations to a fresh sqlite file and round-trips one
  row per table using the inferred types.
- Zero imports outside drizzle + node types.

## Async log

(append: date, what you decided or hit, why)
