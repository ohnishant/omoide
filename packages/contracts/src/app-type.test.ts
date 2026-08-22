import { describe, expectTypeOf, it } from "vitest";
import { hc } from "hono/client";
import type { InferRequestType, InferResponseType } from "hono/client";

import type { AppType } from "./app-type";
import type {
  BakoDetail,
  BakoSummary,
  User,
} from "./domain";
import type { ErrorEnvelope } from "./errors";
import type {
  ListAssetsResponse,
  ListActivityResponse,
} from "./bakos";
import type {
  MultipartUploadResponse,
  SingleUploadResponse,
  UploadCompleteRequest,
  UploadInitRequest,
} from "./uploads";

const client = hc<AppType>("https://api.test");

type BakoIdRoutes = (typeof client.bakos)[":id"];
type SessionRoutes = (typeof client.uploads)[":sessionId"];

describe("hc<AppType> infers contract types", () => {
  it("happy path: GET /auth/me -> { user: User }", () => {
    expectTypeOf<InferResponseType<typeof client.auth.me.$get>>().toEqualTypeOf<{
      user: User;
    }>();
  });

  it("happy path: POST /bakos/:id/uploads -> single | multipart union on mode", () => {
    expectTypeOf<
      InferResponseType<BakoIdRoutes["uploads"]["$post"]>
    >().toEqualTypeOf<SingleUploadResponse | MultipartUploadResponse>();
    const req = {} as InferRequestType<
      BakoIdRoutes["uploads"]["$post"]
    >["json"];
    expectTypeOf(req).toEqualTypeOf<UploadInitRequest>();
  });

  it("happy path: list routes carry optional opaque nextCursor", () => {
    expectTypeOf<
      InferResponseType<BakoIdRoutes["assets"]["$get"]>
    >().toEqualTypeOf<ListAssetsResponse>();
    expectTypeOf<
      InferResponseType<BakoIdRoutes["activity"]["$get"]>
    >().toEqualTypeOf<ListActivityResponse>();
    expectTypeOf<InferResponseType<typeof client.bakos.$get>>().toEqualTypeOf<{
      bakos: BakoSummary[];
    }>();
  });

  it("error path: POST /bakos can answer with the error envelope (cap)", () => {
    expectTypeOf<InferResponseType<typeof client.bakos.$post>>().toEqualTypeOf<
      BakoDetail | ErrorEnvelope
    >();
  });

  it("request bodies are required and typed", () => {
    const complete = {} as InferRequestType<
      SessionRoutes["complete"]["$post"]
    >["json"];
    expectTypeOf(complete).toEqualTypeOf<UploadCompleteRequest>();
  });
});
