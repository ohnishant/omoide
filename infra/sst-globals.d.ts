/**
 * Minimal ambient types for the SST v4 Ion globals used by this stack.
 *
 * Normally `/// <reference path="./.sst/platform/config.d.ts" />` provides
 * these, but that file drags the whole platform's .ts sources into the
 * program and they don't compile under the repo's TypeScript 6 yet. The shim
 * keeps `pnpm exec tsc -p infra` meaningful; SST's own CLI runs the config
 * with its bundled Bun runtime where the real globals exist.
 */
import * as pulumi from "@pulumi/pulumi";
import * as cf from "@pulumi/cloudflare";

declare global {
  const $app: { name: string; stage: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function $config(input: any): unknown;

  function $interpolate(
    strings: TemplateStringsArray,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...values: any[]
  ): pulumi.Output<string>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function $jsonStringify(obj: any): string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function $transform<T>(component: T, callback: (args: any) => void): void;

  namespace sst {
    class Secret {
      constructor(name: string);
    }

    namespace cloudflare {
      interface BucketArgs {
        transform?: {
          bucket?:
            | cf.R2BucketArgs
            | ((args: cf.R2BucketArgs) => void);
        };
      }

      interface D1Args {
        transform?: {
          database?:
            | cf.D1DatabaseArgs
            | ((args: cf.D1DatabaseArgs) => void);
        };
      }

      interface WorkerArgs {
        handler: pulumi.Input<string>;
        url?: pulumi.Input<boolean>;
        link?: unknown[];
        environment?: pulumi.Input<Record<string, pulumi.Input<string>>>;
        domain?:
          | pulumi.Input<string>
          | { name: pulumi.Input<string>; aliases?: pulumi.Input<string>[] };
        transform?: {
          worker?: Partial<cf.WorkersScriptArgs>;
        };
      }

      class Bucket {
        constructor(name: string, args?: BucketArgs);
        readonly name: pulumi.Output<string>;
      }

      class D1 {
        constructor(name: string, args?: D1Args);
        readonly databaseId: pulumi.Output<string>;
      }

      class Worker {
        constructor(name: string, args: WorkerArgs);
        readonly url: pulumi.Output<string | undefined>;
      }
    }
  }
}
