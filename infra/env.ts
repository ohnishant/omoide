/**
 * Shared deploy-time inputs.
 *
 * CLOUDFLARE_ACCOUNT_ID is required by the raw Pulumi resources that SST's
 * Cloudflare components don't expose (R2 CORS + lifecycle rules, pinned D1
 * name). Exported by CI and documented in infra/README.md; also consumed
 * implicitly by the provider and wrangler.
 */
export const accountId = (() => {
  const id = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!id) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID is not set. Export it (see infra/README.md) before running sst deploy/diff.",
    );
  }
  return id;
})();

export const stage = $app.stage;
