import { accountId, stage } from "./env";

/**
 * D1 database backing every bako/user/member row (packages/db schema).
 *
 * Physical name is pinned deterministically (`omoide-<stage>`) instead of the
 * Pulumi random suffix so `scripts/migrate.sh` can target it with plain
 * `wrangler d1 migrations apply omoide-dev --remote` without scraping state.
 * Renaming this later replaces the database — migrate data before changing it.
 */
export const db = new sst.cloudflare.D1("DB", {
  transform: {
    database: (args) => {
      args.accountId = accountId;
      args.name = `omoide-${stage}`;
    },
  },
});
