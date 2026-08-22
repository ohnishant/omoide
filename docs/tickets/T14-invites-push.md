# T14 · Invites, join, push

Wave 5 · Depends on: T07 (routes), T12 (shelf navigation entry)
Owns: join backend glue in `apps/api` well-known routes content + push wiring
`src/lib/push/**`, `apps/mobile/src/app/join/[token].tsx`

## Goal

Link-only invites end to end per PRD §7 invites + push section:
`https://omoide.app/join/<signed-token>` opens app (or store) into the join
flow; preview → accept lands the member in the bako. Expo push notifications
for activity events.

## Contract to resolve

CONTRACTS.md §3 join routes + §9 token format:

- Token mint/verify already live in core (T06); you wire endpoints and links.
  `GET /join/:token/preview` public-ish (authed optional), `POST /join/:token`
  authed, cap/quota validated before adding.
- Fill `/.well-known/apple-app-site-association` and `assetlinks.json`
  content served by the Worker (routes exist from T04). Custom scheme
  `omoide://join/<token>` remains dev fallback.
- Mobile `join/[token].tsx`: parse token from universal link OR custom
  scheme, preview card, accept → membership → navigate into bako. Expired/
  tampered tokens get warm error states.
- Push: expo-notifications registration, `POST /devices` on login, token
  refresh handling; new-upload and member-joined events trigger pushes via
  NotifierPort from T07's activity writes. Push receipts tracked.

## Decisions already made

- Link-only invites, pasted into any group chat; no in-app invite discovery
  ever (PRD §1).
- Pushes double as natural wake-ups for Tier B uploads; keep payload data
  keys stable so T09 can act on them later.

## Gotchas

- Universal Links validation is unforgiving and silent: AASA must be served
  over HTTPS with correct content-type, no redirects, apple-app-site-
  association JSON exact appID team prefix. Test with a real device + real
  domain, notes app long-press trick. Record what worked.
- Apple review requires Sign in with Apple entitlements sorted elsewhere,
  but associated domains entitlement belongs here; missing it breaks links
  only after store install, the worst way to find out.
- Join flow signed-out: user taps link before ever opening app. Route through
  welcome → post-auth resume of the join intent (park it like share payloads).
- Android assetlinks need the release SHA-256 fingerprint; debug builds will
  fail link verification. Ship both fingerprints or document why not.
- Push on iOS needs APNs .p8 uploaded to EAS (human step); gate gracefully.

## Done when

- Real device: Notes-app link opens app directly to join preview, accept
  adds membership visible on shelf, second member's upload fires a push to
  the first.
- Expired and tampered tokens rejected with warm UI.
- Dev-scheme fallback works on both platforms for simulator testing.

## Async log

(append: date, what you decided or hit, why)
