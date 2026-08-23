import * as cloudflare from "@pulumi/cloudflare";
import { accountId } from "./env";

/**
 * R2 bucket for originals, thumbnails and renditions (CONTRACTS §8 key
 * formats). Private by default — all access flows through the Worker or
 * presigned URLs minted by it.
 *
 * The multipart-abort lifecycle rule is mandatory from day one (PRD risk 6):
 * an abandoned mobile upload leaves orphaned parts billed forever unless a
 * rule reaps them. SST's Bucket component doesn't surface CORS or lifecycle,
 * so both attach as raw Pulumi resources against the component's bucket.
 */
export const mediaBucket = new sst.cloudflare.Bucket("BUCKET");

const bucketName = mediaBucket.name;

/**
 * CORS for browser-based presigned PUT/GET (future web client). Mobile native
 * clients don't enforce CORS but the allow-list keeps the web path open.
 */
new cloudflare.R2BucketCors("BucketCors", {
  accountId,
  bucketName,
  rules: [
    {
      id: "web-presign",
      allowed: {
        origins: ["https://omoide.app"],
        methods: ["GET", "PUT", "HEAD"],
        headers: ["*"],
      },
      exposeHeaders: ["etag"],
      maxAgeSeconds: 3600,
    },
  ],
});

/**
 * Abort incomplete multipart uploads after 7 days. 604800s = 7d; uploads take
 * minutes at worst, so anything older is dead weight.
 */
new cloudflare.R2BucketLifecycle("BucketLifecycle", {
  accountId,
  bucketName,
  rules: [
    {
      id: "abort-incomplete-multipart-7d",
      enabled: true,
      conditions: { prefix: "" },
      abortMultipartUploadsTransition: {
        condition: { maxAge: 604800, type: "Age" },
      },
    },
  ],
});
