#!/usr/bin/env bash
# Applies packages/db migrations to the stage's D1 database (CONTRACTS §8).
# Idempotent: wrangler records applied files in the d1_migrations table and
# skips them, so this is safe to run after every deploy.
#
# Usage: infra/scripts/migrate.sh [stage]
# Requires: CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN in env.
set -euo pipefail

stage="${1:-dev}"
db_name="omoide-${stage}"
migrations_dir="packages/db/migrations"

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" || -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "error: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set" >&2
  exit 1
fi

echo "Applying $migrations_dir to D1 database $db_name..."
pnpm exec wrangler d1 migrations apply "$db_name" \
  --remote \
  --migrations-dir "$migrations_dir"
