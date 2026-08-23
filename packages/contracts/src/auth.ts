import * as v from "valibot";

import { userSchema } from "./domain";

export const authorizeQuerySchema = v.object({
  redirectUri: v.pipe(v.string(), v.minLength(1)),
});

export const authorizeResponseSchema = v.object({
  authorizeUrl: v.string(),
  state: v.string(),
});

export const tokenPairResponseSchema = v.object({
  accessToken: v.string(),
  refreshToken: v.string(),
});

export const tokenRequestSchema = v.object({
  code: v.pipe(v.string(), v.minLength(1)),
  state: v.pipe(v.string(), v.minLength(1)),
});

export const refreshRequestSchema = v.object({
  refreshToken: v.pipe(v.string(), v.minLength(1)),
});

export const meResponseSchema = v.object({
  user: userSchema,
});
