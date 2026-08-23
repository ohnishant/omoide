# T04 · Infra SST stack

Wave 1 (parallel with T02, T03) · Depends on: T01
Owns: `infra/**`, CI workflow files for deploy
status: done (code complete; live-deploy verification blocked on Cloudflare account credentials — see async log)

## Goal

SST v4 (Ion) stack that provisions everything the Worker needs, so T07 deploys
against real bindings instead of mocks (PRD §10).

## Contract to resolve

CONTRACTS.md §8 binding names and bucket rules. Concretely:

- `sst.cloudflare.Worker` for `apps/api` with links wiring `BUCKET`, `DB`,
  secret `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `INVITE_HMAC_SECRET`, vars
  `APP_URL`, `APP_SCHEME`.
- `sst.cloudflare.Bucket`: private, CORS configured for future web PUT/GET,
  lifecycle rule aborting incomplete multipart uploads after 7 days.
  Mandatory on day one (risk 6).
- D1 database resource + a scripted post-deploy step applying
  `packages/db/migrations` via `wrangler d1 migrations apply`.
- Worker routes serving `/.well-known/apple-app-site-association` and
  `assetlinks.json` (route stubs are fine until T14 fills them; the IaC paths
  must exist now).
- Stages dev/prod. `sst deploy --stage dev` works from a fresh checkout given
  the secrets in PRD §10 manual steps; document exactly which env vars the
  config expects in `infra/README.md`.

## Decisions already made

- SST v4 Ion over Alchemy (beta churn) and Terraform (HCL/TS split-brain)
  and wrangler-only (no state graph once domains+CORS+lifecycle enter),
  PRD §10. Do not relitigate; log dissent in the async log if you hit walls.
- CI deploys via GitHub OIDC with scoped Cloudflare API token.

## Gotchas

- R2 lifecycle abort of orphaned multiparts is silent money otherwise. Verify
  the rule actually lands in the Cloudflare dashboard after deploy; SST
  support for this setting has been uneven historically.
- Custom domain routes require the zone already on Cloudflare (manual step).
  If no domain yet, make the stack deploy domainless to workers.dev and gate
  routes behind an `enableDomain` flag so dev is never blocked.
- Secrets via SST links vs wrangler secrets have different local-dev
  behavior; pick `.env`-style local secrets through SST's dev mode and
  document it, or T07 loses half a day.
- AASA files need exact content-type headers from the Worker route. Note it
  in infra/README so T14 does not debug Apple's silent AASA failures cold.

## Done when

- [x] Stack code complete: Worker + R2 (CORS + multipart-abort lifecycle) +
      D1 + secrets/vars wired per CONTRACTS §8, hello-world handler in
      apps/api serving the well-known paths.
- [ ] `sst deploy --stage dev` succeeds end to end — **blocked on human
      Cloudflare account setup** (PRD §10 manual steps 1-2). Config parses and
      reaches the Cloudflare API (`sst diff` with dummy creds fails with auth
      error 6003, proving graph + provider init); live deploy is the first
      action for whoever holds credentials.
- [ ] Bucket CORS + multipart-abort lifecycle verified in dashboard — do this
      immediately after first deploy (see infra/README "human checks").
- [x] Migration apply scripted (`infra/scripts/migrate.sh`), idempotent via
      wrangler's d1_migrations tracking.
- [x] infra/README documents env/secrets, local-dev secret flow, and the
      domainless fallback.

status: done (code; deploy verification blocked on credentials per board rule)

## Async log

- 2026-08-23 — Stack authored: `infra/sst.config.ts` + per-domain modules
  (storage/database/secrets/api), hello-world handler in `apps/api/src/index.ts`
  serving `/.well-known/apple-app-site-association` and `/assetlinks.json`
  with exact `application/json` headers (T14 replaces the stub payloads, not
  the routes). Component logical names are the CONTRACTS §8 binding names
  verbatim (`BUCKET`, `DB`, `WORKOS_*`) so SST's link-generated bindings match
  the frozen surface without a translation layer.
- 2026-08-23 — R2 CORS/lifecycle are not surfaced by SST's Bucket component;
  attached as raw Pulumi resources (`cloudflare.R2BucketCors`,
  `cloudflare.R2BucketLifecycle`, provider 6.19.0) against the component's
  bucket. Multipart abort set to maxAge 604800s = 7d, empty prefix. Dashboard
  verification still required after first deploy — provider support here has
  been historically uneven.
- 2026-08-23 — D1 physical name pinned deterministically to `omoide-<stage>`
  via component transform so `migrate.sh` targets it with plain wrangler CLI,
  no state scraping. Migration apply is idempotent (wrangler tracks applied
  files in `d1_migrations`). Renaming that physical name later replaces the
  database — noted in infra/README.
- 2026-08-23 — OIDC dissent logged: ticket said "GitHub OIDC with scoped API
  token" but Cloudflare has no native OIDC federation yet (wrangler-action#402
  open as of 2026-06). CI ships with a scoped `CLOUDFLARE_API_TOKEN` secret
  and requests `id-token: write` anyway so an exchange/broker step slots in
  without workflow permission changes. Revisit when Cloudflare ships it.
- 2026-08-23 — Custom-domain routing gated behind `OMOIDE_ENABLE_DOMAIN=true`
  + `OMOIDE_DOMAIN`; default deploy is domainless on workers.dev so dev is
  never blocked on the zone transfer (manual step).
- 2026-08-23 — Local secrets: chose SST's own dev mode over .env plumbing —
  `sst secret set X --stage dev` values are injected into `sst dev` and
  deploys identically; documented in infra/README so T07 doesn't wire a
  second mechanism.
- 2026-08-23 — Typecheck caveat: `.sst/platform/config.d.ts` drags platform
  .ts sources into tsc and they fail under TypeScript ~6.0.3, so
  `infra/sst-globals.d.ts` provides ambient types instead (`tsc -p infra` is
  wired into root `typecheck`). Extend the shim when using new components.
- 2026-08-23 — Left for the next agent: run `sst secret set` for all three
  secrets per stage before first deploy; verify lifecycle rule in dashboard;
  T07 should replace only the handler body in `apps/api/src/index.ts`.
