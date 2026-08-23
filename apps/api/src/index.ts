/**
 * Hello-world handler standing in until T07 lands the real Hono app.
 * T07 replaces this file's body, not the infra.
 *
 * Serves the universal-link manifest paths (CONTRACTS/T14) so the routes
 * exist from day one. Apple silently fails AASA validation on anything but
 * `application/json` — keep the exact content-type.
 */

const APPLE_APP_SITE_ASSOCIATION = {
  applinks: {
    apps: [],
    details: [],
  },
  // webcredentials/appclips entries land with T14 (invites + push).
};

const ASSETLINKS: unknown[] = [];

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/.well-known/apple-app-site-association") {
      return new Response(JSON.stringify(APPLE_APP_SITE_ASSOCIATION), {
        headers: { "content-type": "application/json" },
      });
    }

    if (pathname === "/.well-known/assetlinks.json") {
      return new Response(JSON.stringify(ASSETLINKS), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        service: "omoide-api",
        note: "placeholder handler — replaced by T07",
      }),
      { headers: { "content-type": "application/json" } },
    );
  },
};
