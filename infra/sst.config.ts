/**
 * Omoide infrastructure — SST v4 (Ion) targeting Cloudflare (PRD §10).
 *
 * Provisions everything apps/api binds against so T07 deploys real resources,
 * not mocks (CONTRACTS.md §8):
 *
 *   env.BUCKET                  R2 bucket (media originals/thumbnails)
 *   env.DB                      D1 database (drizzle schema)
 *   WORKOS_CLIENT_ID            secret
 *   WORKOS_API_KEY              secret
 *   INVITE_HMAC_SECRET          secret
 *   APP_URL / APP_SCHEME        vars
 *
 * Component logical names deliberately double as Cloudflare binding names
 * (BUCKET, DB, WORKOS_*) so the frozen CONTRACTS §8 surface holds verbatim.
 */
export default $config({
  app(input) {
    return {
      name: "omoide",
      home: "cloudflare",
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: input?.stage === "prod",
      providers: {
        cloudflare: "6.19.0",
      },
    };
  },
  async run() {
    const stage = $app.stage;

    await import("./secrets");
    await import("./database");
    const { mediaBucket } = await import("./storage");
    await import("./api");

    return {
      // consumed by scripts/migrate.sh consumers and humans wiring wrangler
      dbName: `omoide-${stage}`,
      bucketName: mediaBucket.name,
    };
  },
});
