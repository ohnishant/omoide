# T05 · Mobile foundation: theme, shell, auth

Wave 2 · Depends on: T01
Owns: `apps/mobile/**` except paths owned by later mobile tickets (T08-T15
own their screens/engines; you own everything else including root `_layout.tsx`)

## Goal

The signed-in shell every screen builds on: frozen theme tokens, the full
route tree from PRD §9.6 with placeholder screens, WorkOS auth flow end to end,
TanStack Query + MMKV + secure-store providers wired (PRD §3 flow 5, §9).

## Contract to resolve

CONTRACTS.md §10 and §11:

- `src/theme/theme.ts` token object exactly as specified, `useTheme()` hook.
  Zero hex literals outside theme.ts, enforced by lint rule if feasible.
- Route tree exactly as PRD §9.6. Placeholder screens for routes owned by
  T09-T15; they replace your placeholders without touching layouts.
- Root `_layout.tsx`: Stack + providers + `Stack.Protected` auth guard.
- Auth flow against contracts §2: `GET /auth/authorize` → expo-web-browser
  system-browser session → redirect via app scheme → `POST /auth/token` →
  tokens in secure-store → bearer on API calls → refresh through
  `POST /auth/refresh`.
- Providers: TanStack Query v5 persisted to MMKV (Nitro), asyncStorage
  replacement off. Tokens never in MMKV.

## Decisions already made

- Plain StyleSheet + tokens, no NativeWind (PRD §9.1). Weights 400/500 only,
  sentence case everywhere, light mode locked (PRD §4).
- Dev build mandatory; Expo Go must fail fast with a clear message
  (share extension, MMKV, secure-store need it).
- Auth UI hits the hosted AuthKit pages inside the browser session; nothing
  but buttons per provider on welcome.tsx.

## Gotchas

- Without real WorkOS credentials (human step, PRD §10.3) you cannot complete
  the browser round-trip. Build the full flow behind an env flag with a dev
  bypass mode that mints a fake session locally, log it as a blocker, and
  make sure the flag cannot ship enabled.
- expo-web-browser auth sessions differ between iOS (ASWebAuthenticationSession)
  and Android custom tabs; test both or note which one is verified.
- React Compiler ON changes what hooks patterns are legal; keep providers
  compiler-clean from day one, not retrofitted.
- SDK >= 57.0.9 pin exists for a Hermes memory fix; do not let a lockfile
  resolve drift below it (risk 8).
- MMKV Nitro + new arch versions move fast; pin exact package versions and
  record them here.

## Done when

- Cold start lands on shelf placeholder if tokened, welcome if not; sign out
  returns to welcome; kill-and-relaunch keeps the session.
- Theme swap test: changing one token value visibly changes placeholders,
  proving no hardcoded colors snuck into shell chrome.
- `pnpm --filter mobile typecheck && pnpm --filter mobile lint` green.

## Async log

(append: date, what you decided or hit, why)
