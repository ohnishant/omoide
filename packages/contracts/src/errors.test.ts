import { describe, expect, it } from "vitest";
import * as v from "valibot";

import { ERROR_CODES, ERROR_STATUS, errorEnvelope, errorEnvelopeSchema } from "./errors";
import {
  FREE_BAKO_LIMIT,
  FREE_BYTE_QUOTA,
  PAYWALL_WARN_RATIO,
} from "./constants";

describe("error codes", () => {
  it("has exactly the seven frozen codes", () => {
    expect(ERROR_CODES).toEqual([
      "unauthorized",
      "forbidden",
      "not_found",
      "invalid_request",
      "conflict",
      "quota_exceeded",
      "bako_limit_reached",
    ]);
  });

  it("maps every code to its HTTP status per CONTRACTS §1", () => {
    expect(ERROR_STATUS).toEqual({
      unauthorized: 401,
      forbidden: 403,
      not_found: 404,
      invalid_request: 400,
      conflict: 409,
      quota_exceeded: 413,
      bako_limit_reached: 403,
    });
  });

  it("envelope round-trips", () => {
    const body = errorEnvelope("quota_exceeded", "storage guard rejected");
    expect(v.parse(errorEnvelopeSchema, body)).toEqual(body);
  });

  it("rejects unknown codes", () => {
    const res = v.safeParse(errorEnvelopeSchema, {
      error: { code: "teapot", message: "?" },
    });
    expect(res.success).toBe(false);
  });
});

describe("free-tier constants", () => {
  it("match CONTRACTS §1", () => {
    expect(FREE_BAKO_LIMIT).toBe(3);
    expect(FREE_BYTE_QUOTA).toBe(5 * 1024 ** 3);
    expect(PAYWALL_WARN_RATIO).toBe(0.9);
  });
});
