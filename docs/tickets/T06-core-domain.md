# T06 · core package: ports and domain

Wave 2 · Depends on: T02, T03
Owns: `packages/core/**`
Consumed by: T07 (api app). The D1 escape hatch lives or dies here.

## Goal

Platform-agnostic domain: bako CRUD with cap enforcement, membership rules,
quota math with the atomic guarded increment, invite token mint/verify,
activity writes. All queries live here, defined against ports
(PRD §6 dependency law, §7).

## Contract to resolve

CONTRACTS.md §7 (ports + domain responsibilities) against §6 schema types:

- `StoragePort`, `NotifierPort` exported exactly as written there.
- DbPort/repositories typed against `@omoide/db` inferred types; you decide
  the repository split, but every SQL statement in the product ends up in
  this package.
- Atomic quota guard implemented and unit-tested as specified:
  guarded UPDATE checking changes count, wrapped so guard+insert is one
  atomic unit (D1 `batch()` semantics).
- Bako creation enforces the 3-cap via a check that is correct under races
  or logs why consumer-grade tolerance is acceptable.
- Invite helpers per §9: HMAC payload format, 30-day default expiry,
  constant-time comparison on verify.
- Membership rule: read/write/upload/download all gated on membership rows;
  owner role only matters for delete-if-ever, keep it simple.
- Activity writes for 'upload' and 'join' events happen inside the same
  transactional boundary as the mutation they describe.

## Decisions already made

- No reservation ledger for quota; soft overshoot of one file accepted,
  newest asset quarantined `over_quota` (PRD §5). Finalize returns that
  status instead of failing.
- Dedupe: same contentHash already `ready` in bako → `conflict`, client
  treats as success-and-skip.

## Gotchas

- Dependency law is enforced in review and by lint import rules if you can
  add them: no Hono, no workers-types, no react-native imports, ever.
- D1 batch() is your transaction story. There is no BEGIN/COMMIT across
  statements otherwise; design finalize around one batch call.
- `meta.changes` from the guarded UPDATE is the only race-safe quota signal;
  do not pre-read then write.
- Keep functions taking plain data + ports so vitest covers everything
  without Cloudflare. If you need `Request`/`env`, stop: it belongs in T07's
  adapters.

## Done when

- Unit tests cover: quota guard pass/fail/race-window semantics (simulated),
  cap enforcement, membership checks, invite mint/verify round-trip +
  expired-token rejection + tampered-signature rejection, dedupe conflict.
- Package has zero runtime deps beyond drizzle/@omoide/db/@omoide/contracts.
- A README in-package maps each domain function to its PRD section.

## Async log

(append: date, what you decided or hit, why)
