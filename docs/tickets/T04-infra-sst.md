# T04 · Infra SST stack

Wave 1 (parallel with T02, T03) · Depends on: T01
Owns: `infra/**`, CI workflow files for deploy

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

- `sst deploy --stage dev` succeeds end to end against a hello-world handler
  in apps/api (T07 will replace the handler, not the infra).
- Bucket shows CORS + multipart-abort lifecycle in the dashboard.
- Migration apply runs as part of deploy and is idempotent.
- infra/README documents required env/secrets and the domainless fallback.

## Async log

(append: date, what you decided or hit, why)
