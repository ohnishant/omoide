# Omoide

`思い出 · memories`

Omoide is a backup-first photo app for groups. After a trip, everyone pools
their photos into one shared box, a **Bako** (箱), instead of clogging iCloud,
Google Photos, or WhatsApp. The hook lives in the OS share sheet: select
photos, Share, Omoide, pick a Bako, done. Originals are stored byte-exact and
downloads are lossless. Sharing is by invitation link only. There is no feed,
no likes, no discovery.

Full spec: [docs/prd.md](docs/prd.md).

## Status

Spec approved for build. The repo currently has:

- pnpm + Turborepo monorepo with hoisted linking (`.npmrc`, do not remove)
- `@omoide/contracts`, `@omoide/core`, `@omoide/db` packages building
- `apps/mobile`: Expo SDK 57 scaffold, RN 0.86, New Architecture, React
  Compiler on
- A locked design language in [DESIGN.md](DESIGN.md): "Sun-Faded Shoebox"
  light theme plus a validated Lamplight dark variant behind the same tokens
- An interactive prototype under `prototype/`
- A CI check that flags design slop on every PR (`scripts/detect-slop.mjs`)

Not started yet: `apps/api` (Hono on Cloudflare Workers) and `infra/` (SST).
The ticket board drives everything else.

## Repo layout

```
apps/mobile          Expo app, the whole client
apps/api             Hono Worker API (planned, T07)
packages/contracts   zod schemas + typed RPC surface shared by every client
packages/core        domain logic against ports; all DB queries live here
packages/db          Drizzle schema + migrations, SQLite-pure, targets D1
infra                SST v4 stack (planned, T04)
prototype            interactive prototype
docs                 PRD, ticket board, frozen contracts
```

## Development

```
pnpm install
pnpm build           # or typecheck / lint / test, all workspaces via turbo
pnpm --filter mobile ios       # or android
```

Dev builds only. Expo Go is unsupported: MMKV, secure-store, push, and the
share extension need native code. If Metro misbehaves after moving files or
switching branches, clear caches before trusting the failure (command in
[AGENTS.md](AGENTS.md)).

## How work happens

Development runs through the ticket board in [docs/tickets](docs/tickets/README.md).
Each ticket is written to be picked up cold by an agent or a human:

1. Read the PRD sections it cites, then CONTRACTS.md, then the ticket.
2. Work inside the ticket's owned paths only.
3. Log decisions and gotchas in the ticket's async log as you go.
4. Verify, set status to done, commit as `T<nn>: <summary>`.

Anything crossing a package boundary is frozen in
[docs/tickets/CONTRACTS.md](docs/tickets/CONTRACTS.md). Changing it means
editing that file with a changelog entry before writing code, which is what
lets several tickets run in parallel without coordination.

Agent-specific rules (dependency law, theme tokens, hoisted linker) live in
[AGENTS.md](AGENTS.md).

## Docs

| Doc | What it is |
|---|---|
| [docs/prd.md](docs/prd.md) | approved spec and technical design |
| [docs/tickets/README.md](docs/tickets/README.md) | ticket board and loop protocol |
| [docs/tickets/CONTRACTS.md](docs/tickets/CONTRACTS.md) | frozen integration contracts |
| [DESIGN.md](DESIGN.md) | design language, palette, typography |
| [PRODUCT.md](PRODUCT.md) | product positioning summary |
| [AGENTS.md](AGENTS.md) | working rules for coding agents |
