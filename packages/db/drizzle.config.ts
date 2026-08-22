import { defineConfig } from "drizzle-kit";

// Local generation config. Points at a scratch sqlite file; the SQL it emits
// is committed to migrations/ and applied to production D1 via
// `wrangler d1 migrations apply` (wired by T04).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: { url: "./local/generate.db" },
});
