import { db } from "./database";
import { mediaBucket } from "./storage";
import { workosClientId, workosApiKey, inviteHmacSecret } from "./secrets";

/**
 * The API Worker. T07 owns the real handler; this deploys against the
 * hello-world in apps/api so infra is proven end to end first.
 *
 * Custom domain routes are gated behind OMOIDE_ENABLE_DOMAIN=true +
 * OMOIDE_DOMAIN (zone must already sit on Cloudflare — manual step). Without
 * it the stack deploys domainless on workers.dev and dev is never blocked.
 */
const enableDomain = process.env.OMOIDE_ENABLE_DOMAIN === "true";
const domainName = process.env.OMOIDE_DOMAIN;

export const api = new sst.cloudflare.Worker("api", {
  handler: "apps/api/src/index.ts",
  url: true,
  link: [mediaBucket, db, workosClientId, workosApiKey, inviteHmacSecret],
  environment: {
    APP_URL: process.env.APP_URL ?? "https://omoide.app",
    APP_SCHEME: process.env.APP_SCHEME ?? "omoide://",
  },
  domain:
    enableDomain && domainName
      ? { name: domainName }
      : undefined,
});
