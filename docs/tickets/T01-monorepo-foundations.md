# T01 · Monorepo foundations

Wave 0 (serial gate, everything else waits on this) · Depends on: nothing
Owns: root of repo, `apps/`, `packages/`, `infra/` skeletons, `AGENTS.md`

## Goal

Turn the bare Expo scaffold in `app/` into the monorepo from PRD §6 so every
other ticket can land in parallel without merge conflicts. This is plumbing
only. No product code.

## Contract to resolve

CONTRACTS.md header block. Concretely, after this ticket:

- Workspace layout exists: `apps/mobile`, `apps/api`, `packages/contracts`,
  `packages/core`, `packages/db`, `infra/`, `docs/`.
- Scaffold moved intact to `apps/mobile` (`git mv`, keep history). App boots
  with dev client after the move.
- Package names are `@omoide/contracts`, `@omoide/core`, `@omoide/db`. Each
  package compiles with a placeholder index.ts and is consumed by
  `apps/mobile` via workspace protocol.
- Root `.npmrc` has `node-linker=hoisted`. This line must never disappear
  (risk 7).
- Turborepo wired with tasks `build`, `typecheck`, `lint`, `test`. All four
  run from repo root and pass (trivially) across all workspaces.
- One shared tsconfig base at root; per-workspace configs extend it.
- `AGENTS.md` at root documents: hoisted linker warning, dependency law
  (core never imports Hono / workers-types / React Native), theme-token rule,
  pointer to `docs/tickets/README.md`.

## Decisions already made

- pnpm + Turborepo, not npm/yarn/nx (PRD §6). Alchemy and Terraform rejected
  for infra; SST v4 Ion chosen (PRD §10) but that is T04's problem.
- Expo SDK pinned >= 57.0.9, RN 0.86.2, New Arch, React Compiler ON (PRD §9).
  Pin exact versions here so later tickets inherit them.
- Expo Go unsupported; enforce dev-client launcher in the mobile scripts.

## Gotchas

- Moving an Expo app into a workspace breaks Metro resolution unless hoisted
  linking is set before the first install. Set `.npmrc` first, then move, then
  a clean install.
- Watchman/metro cache will hold stale paths after the move. Clear caches
  before declaring victory.
- Hoisted mode can hoist conflicting transitive versions. If pods or React
  resolution fail, the fix is never "remove node-linker", it is pnpm overrides.
- Keep the existing scaffold's lint setup working through the move; a broken
  baseline hides every later ticket's regressions.

## Done when

- `pnpm install && pnpm build && pnpm typecheck && pnpm lint` all pass from
  root.
- `pnpm --filter mobile ios` (or android) boots the app on a simulator with
  the placeholder screen.
- AGENTS.md contains the four rules listed above.

## Async log

(append: date, what you decided or hit, why)
