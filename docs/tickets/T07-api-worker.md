# T07 · api app: full Worker

Wave 3 · Depends on: T02, T06 (T04 infra lands in parallel; code against
contract binding names, deploy when T04 is ready)
Owns: `apps/api/**`

## Goal

The thin Hono adapter on Cloudflare Workers: every route from contracts §2-§5,
zod-validated via `@hono/zod-validator`, all logic delegated to core, bytes
never relayed through the Worker for uploads/downloads except the zip stream
(PRD §7).

## Contract to resolve

CONTRACTS.md §1-§5 and §8:

- Mount the real `AppType`; if your implementation diverges from contracts,
  one of them is wrong, fix it or amend contracts with a changelog entry.
- Presign flow per §4: membership → quota pre-check → insert pending row +
  upload session → mint presigned PUTs (single) or multipart session
  (videos / >= 100 MB, aws4fetch). Decide and log the single-mode finalize
  mechanism (HEAD-on-first-read vs empty-parts complete call).
- Finalize runs core's atomic quota guard; returns 'ready' or 'over_quota'.
- Downloads per §5: membership-gated short-TTL presigned GETs; zip endpoint
  streams fflate STORE straight from `env.BUCKET`, never buffering whole
  objects (128 MB isolate limit).
- Serve `/.well-known/apple-app-site-association` + assetlinks.json (T14
  fills content; routes exist from T04).
- Error responses always use contracts §1 envelope.

## Decisions already made

- WorkOS AuthKit for auth (PRD decision 2); PKCE verifier server-side keyed
  by state; JWT verification via jose against WorkOS JWKS.
- No OpenAPI codegen; RPC types come from AppType.

## Gotchas

- aws4fetch multipart signing against R2 has edge cases (payload hashing,
  part URL reuse). Budget time to verify parts actually complete against a
  real bucket; mocks will not catch signing bugs.
- Presigned PUTs must pin Content-Type or clients can poison it silently.
- Worker CPU/duration limits make any "just proxy it" temptation fatal;
  streaming only, chunked zip batching per-N photos.
- Without WorkOS credentials you cannot test the browser round-trip. Ship
  behind the same dev-bypass flag T05 defines, log as blocker, keep the flag
  out of prod paths.
- D1 batch is your only transaction; do not interleave await points between
  guard and insert.

## Done when

- Every route in contracts §2-§5 exists, zod-validated, returning contract
  shapes; `hc<AppType>` from a scratch client typechecks against the running
  worker (or wrangler dev).
- Integration script (vitest + miniflare/workers pool) covers: auth bypass,
  create bako, cap rejection, upload init single+multipart, finalize ready +
  over_quota paths, download URL membership gate, 401/403/409/413 envelopes.
- Deployed to dev stage end-to-end once T04 lands; note deployment date here.

## Async log

(append: date, what you decided or hit, why)
