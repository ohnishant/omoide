# T15 · Create, onboarding, paywall

Wave 5 · Depends on: T08 (data layer); T12 (shelf entry point)
Owns: `apps/mobile/src/app/create.tsx`, `(auth)/welcome.tsx` polish +
`(auth)/tutorial.tsx`, `settings.tsx`, paywall sheet `src/features/paywall/**`

## Goal

PRD flow 4 (create Bako: name → optional cover → invite link), flow 5
(onboarding: welcome → sign-in → tutorial → create-or-join), and the freemium
enforcement UX per PRD §5.

## Contract to resolve

CONTRACTS.md §1/§3/§10/§11 plus PRD §3/§5:

- Create modal three steps as bottom-sheet-styled modal, never a full-screen
  form: name (required, sentence case), optional cover from gallery (uses
  T09 upload path for the cover asset), success shows invite link with copy
  + share handoff. Enforced cap: `bako_limit_reached` opens warm paywall,
  never a raw error toast.
- Tutorial: short walkthrough of the share-sheet trigger (the non-obvious
  hook). Re-enterable from settings. Mentions Live Photo stills behavior
  per PRD §9.4 scope note.
- Settings: profile, quota meter, tutorial re-entry, sign out.
- Paywall: warm bottom sheet at hard block or 90% prompt (`PAYWALL_WARN_RATIO`),
  RevenueCat integration for the paid plan; entitlement flips `plan` which
  lifts caps server-side via `['auth','me']`.
- Boundary behavior: block new uploads only; viewing/download of existing
  assets never gated by quota UI.

## Decisions already made

- RevenueCat for payments (decision 8 approved burn); App Store + Play rules.
- Free tier constants come from contracts, not hardcoded numbers in UI;
  copy reads quota from `/auth/me`.

## Gotchas

- RevenueCat needs store products configured in both consoles (human step,
  PRD §10.7). Build the full sheet against RC's sandbox/offering API behind
  an env flag; without products configured, show the sheet in "coming soon"
  honest state rather than fake purchase buttons. Log blocker.
- Cover upload rides the same quota guards as any asset; a full user cannot
  set covers, decide and log the graceful path.
- Tutorial screenshots/steps will drift as screens change under T16; keep
  steps copy-driven where possible, note capture date for any images.
- Sign out must wipe secure-store tokens AND MMKV cache AND queued state;
  leftover queues resuming post-signout are a privacy bug, test it.

## Done when

- New-user walkthrough: welcome → auth (dev bypass acceptable, noted) →
  tutorial → create first bako → invite link copied.
- 4th bako attempt triggers paywall sheet; after simulated entitlement flip
  creation succeeds.
- Quota meter reflects real usage from `/auth/me`; 90% prompt fires once,
  dismissibly.
- Sign out leaves zero tokens/cache/queue residue (verify MMKV contents).

## Async log

(append: date, what you decided or hit, why)
