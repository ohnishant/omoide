import * as v from "valibot";

export const ERROR_CODES = [
  "unauthorized",
  "forbidden",
  "not_found",
  "invalid_request",
  "conflict",
  "quota_exceeded",
  "bako_limit_reached",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/**
 * Wire status for every error code (CONTRACTS.md §1).
 *
 * `bako_limit_reached` is the deliberate "402-style 403": paywall semantics,
 * delivered over HTTP 403 so proxies/clients never see a bare 402. Distinguish
 * on `code`, never on status.
 */
export const ERROR_STATUS = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  invalid_request: 400,
  conflict: 409,
  quota_exceeded: 413,
  bako_limit_reached: 403,
} as const satisfies Record<ErrorCode, number>;

export const errorBodySchema = v.object({
  code: v.picklist(ERROR_CODES),
  message: v.string(),
});

export type ErrorBody = v.InferOutput<typeof errorBodySchema>;

export const errorEnvelopeSchema = v.object({
  error: errorBodySchema,
});

export type ErrorEnvelope = v.InferOutput<typeof errorEnvelopeSchema>;

export function errorEnvelope(code: ErrorCode, message: string): ErrorEnvelope {
  return { error: { code, message } };
}
