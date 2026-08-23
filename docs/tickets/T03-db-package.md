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

- 2026-08-22: Schema written exactly to CONTRACTS §6 (six tables, epoch ms
  integers, text pks for app-side `crypto.randomUUID()` ids, no autoincrement).
  Enum values are drizzle `{ enum: [...] }` text columns matching the wire
  enums. Exported `$inferSelect`/`$inferInsert` row types from the package root
  (`UserRow`, `BakoRow`, `MembershipRow`, `AssetRow`, `ActivityRow`,
  `UploadSessionRow` + `New*Row`) so T06/T07 never hand-write them.
- 2026-08-22: FK pragma findings — schema declares FKs with no ON DELETE
  actions, per ticket guidance. Verified locally on better-sqlite3 (same SQLite
  engine family): `foreign_keys` defaults to ON at open, violations are
  rejected at insert, and parent deletes are REJECTED rather than cascading.
  D1 documents the same enforcement plus `PRAGMA defer_foreign_keys` inside a
  transaction. Consequence logged for T06: core must delete in dependency
  order explicitly (assets/activity/memberships/sessions before bakos/users);
  do not assume cascade deletes anywhere.
- 2026-08-22: drizzle.config.ts kept in-package pointing at `local/generate.db`
  (gitignored scratch); production apply path stays `wrangler d1 migrations
  apply migrations/` wired by T04. Migration SQL committed as
  `migrations/0000_windy_baron_zemo.sql`. Test (`pnpm --filter @omoide/db test`)
  applies the committed migration folder to a fresh sqlite file via drizzle's
  migrator and round-trips one row per table through the inferred types;
  also asserts FK enforcement behavior above. Dev deps added: drizzle-orm,
  drizzle-kit, better-sqlite3 (+types) — better-sqlite3 is test-only, never
  imported from src (dependency law holds; zero imports outside drizzle + node
  types in src).
- 2026-08-22: tsconfig uses `allowImportingTsExtensions` +
  `rewriteRelativeImportExtensions` so src can use explicit `.ts` imports that
  node's native TS runner needs for tests while tsc still emits clean dist js.
