# Omoide — agent guide

Monorepo: pnpm workspaces + Turborepo. Apps in `apps/`, shared packages in
`packages/`, infrastructure in `infra/` (T04). Spec: `docs/prd.md`. Frozen
integration surface: `docs/tickets/CONTRACTS.md`.

## Rules

1. **pnpm hoisted linker.** Root `.npmrc` sets `node-linker=hoisted`. This line
   must never be removed or changed to isolated linking — Expo/Metro and pod
   installation break without it (PRD §11 risk 7). If dependency conflicts
   appear, fix them with pnpm `overrides`, never by dropping the setting.
2. **Dependency law.** `@omoide/core` never imports Hono,
   `@cloudflare/workers-types`, or React Native. Platform objects (`Request`,
   Worker `env`, RN components) belong to adapters (`apps/api`, share
   extension). Queries stay in core, adapters stay thin (PRD §6).
3. **Theme tokens.** Every color in `apps/mobile` goes through the frozen
   token object in `src/theme/theme.ts` via `useTheme()`. A hardcoded hex
   fails review even if the screen looks right (PRD §4, CONTRACTS.md §10).
4. **Ticket loop.** Work happens one ticket at a time per
   `docs/tickets/README.md`: read PRD + CONTRACTS.md + ticket, implement only
   inside the ticket's owned paths, verify, update the ticket's async log and
   status table, commit per the git conventions below.

## Git conventions

Conventional commits throughout. The subject describes the work; the ticket id
rides along in parentheses and never leads.

- **Commit subject:** `<type>(<scope>): <imperative summary> (<Tnn>)`
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`,
    `design`.
  - Scope is the area touched: `db`, `core`, `contracts`, `api`, `mobile`,
    `infra`, `tickets`, `deps`. Cross-cutting work drops the scope.
  - Summary says what changed and why it matters, lowercase, no period:
    `feat(db): drizzle schema for six tables + committed migration sql (T03)`
    beats `T03: db package`.
  - Individual commits on a multi-commit branch may drop `(Tnn)`; the
    squash/merge commit that lands on main keeps it.
- **Branches:** `<type>/t<nn>-<short-slug>`, e.g. `feat/t03-db-package`,
  `fix/t09-retry-storm`. The slug names the work.
- **PR titles** mirror the landing commit exactly, so the squash commit needs
  no rewrite: `feat(contracts): zod schemas + hono apptype rpc surface (T02)`.
- **PR bodies:** two short lists. `## Summary` bullets of actual behavior
  change, `## Testing` commands run. Link the ticket file
  (`docs/tickets/Tnn-*.md`) when the PR closes it.

## Commands

From repo root:

- `pnpm install` — workspace install (hoisted)
- `pnpm build` / `pnpm typecheck` / `pnpm lint` / `pnpm test` — Turbo across
  all workspaces
- `pnpm --filter mobile ios` / `android` — dev-client launch (Expo Go is not
  supported; dev builds are mandatory for MMKV, secure-store, push, and the
  share extension)

After moving files or switching branches, clear Metro/Watchman caches before
trusting a failure:

```
watchman watch-del-all && rm -rf apps/mobile/.expo apps/mobile/node_modules/.cache
```
