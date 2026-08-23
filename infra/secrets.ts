/**
 * WorkOS AuthKit credentials (PRD §10.3). Values set per stage via
 * `sst secret set WORKOS_CLIENT_ID --stage <stage>` — never in config.
 *
 * Logical names match the CONTRACTS §8 binding names exactly so apps/api
 * reads them straight off `env` / `Resource`.
 */
export const workosClientId = new sst.Secret("WORKOS_CLIENT_ID");
export const workosApiKey = new sst.Secret("WORKOS_API_KEY");

/**
 * HMAC key for invite token mint/verify (CONTRACTS §9). Rotating it invalidates
 * outstanding invite links; acceptable, invites are 30-day ephemeral.
 */
export const inviteHmacSecret = new sst.Secret("INVITE_HMAC_SECRET");
