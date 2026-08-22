# Omoide ticket board

Tickets live here as one file each. They are written to be picked up cold by an
agent (or you) with no other context than three documents:

1. `docs/prd.md` (the spec)
2. `docs/tickets/CONTRACTS.md` (frozen integration surface)
3. the ticket file itself

## Loop protocol

Run one ticket per iteration:

1. Pick the lowest-numbered ticket whose status is `open` and whose dependencies
   are `done` (see status table below). If several are eligible, any order works;
   waves just mark safe parallel batches.
2. Read the PRD sections the ticket cites, then CONTRACTS.md, then the ticket.
3. Implement inside the ticket's owned paths only. Never edit another ticket's
   files. If you need a change there, write the request into your ticket's async
   log instead.
4. If the work requires changing something CONTRACTS.md froze, stop coding,
   edit CONTRACTS.md, add a changelog entry at its bottom, then continue. All
   tickets consume CONTRACTS.md fresh at pickup, so edits integrate without
   coordination.
5. Run the ticket's verification commands until green.
6. Update the ticket: fill in every section marked "append", set `status: done`,
   list anything you left broken or assumed.
7. Commit with message `T<nn>: <summary>`.
8. Update the status table below.

A ticket is not done when the code exists. It is done when the next agent can
build on it without asking you anything. The decisions and gotchas sections are
the handoff, not a formality.

## Status

| Ticket | Title | Wave | Depends on | Status |
|---|---|---|---|---|
| T01 | Monorepo foundations | 0 | - | done |
| T02 | contracts package | 1 | T01 | done |
| T03 | db package | 1 | T01 | open |
| T04 | Infra SST stack | 1 | T01 | open |
| T05 | Mobile foundation: theme, shell, auth | 2 | T01 | open |
| T06 | core package: ports and domain | 2 | T02, T03 | open |
| T07 | api app: full Worker | 3 | T02, T06 | open |
| T08 | Mobile data layer and RPC client | 3 | T02, T05 | open |
| T09 | Mobile upload engine | 4 | T07, T08 | open |
| T10 | Share intake | 4 | T05, T08 | open |
| T11 | Bako detail screens | 4 | T05, T08 | open |
| T12 | Shelf screen | 4 | T05, T08 | open |
| T13 | Downloads and HEIC fallback | 5 | T08, T09 | open |
| T14 | Invites, join, push | 5 | T07, T12 | open |
| T15 | Create, onboarding, paywall | 5 | T08 | open |
| T16 | Design finalization gate | 6 | all above | done |

Waves are batches that can run concurrently with no file conflicts. Within a
wave, tickets share no owned paths. Cross-wave dependencies come from contracts
and imports, not from shared files.

## Rules that keep async work integrable

- CONTRACTS.md is the single source of truth for anything crossing a package or
  app boundary. Types, route shapes, table columns, R2 key formats, binding
  names, theme token names, exported function signatures.
- Dependency law from PRD §6 holds everywhere: `core` never imports Hono,
  workers-types, or React Native. The share extension imports `contracts` plus
  a slim upload client, nothing else.
- Every hex color in `apps/mobile` goes through theme tokens. A hardcoded hex
  fails review even if the screen looks right.
- Manual account setup (WorkOS dashboard, Cloudflare, Apple, Google, Firebase,
  store consoles, PRD §10 steps) is human work. When a ticket hits a missing
  credential, build against the documented mock/fallback, log it in the async
  log as a blocker, and move on. Do not stall the loop on secrets.
