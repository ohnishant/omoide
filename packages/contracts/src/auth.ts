import { userSchema } from "./domain";
import { z } from "zod";

export const authorizeQuerySchema = z.object({
  redirectUri: z.string().min(1),
});

export const authorizeResponseSchema = z.object({
  authorizeUrl: z.string(),
  state: z.string(),
});

export const tokenPairResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const tokenRequestSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const meResponseSchema = z.object({
  user: userSchema,
});
