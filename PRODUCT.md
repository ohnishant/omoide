# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

Expo SDK 57 (React Native 0.86, New Architecture, React Compiler ON), Expo Router,
plain StyleSheet + frozen typed theme tokens via `useTheme()` (NativeWind rejected).
Monorepo: pnpm workspaces + Turborepo; Hono API on Cloudflare Workers; Drizzle/D1;
R2 storage; SST v4 IaC. Details frozen in docs/prd.md §6–§10 and docs/tickets/CONTRACTS.md.
(Recorded from the approved PRD — owner pre-approved; no live interview.)

## Users

Groups of friends/family after a shared trip or event. Primary job: pool everyone's
photos at full resolution into one shared album without clogging iCloud/Google
Photos/WhatsApp. Secondary job: get everyone's photos back out, losslessly.

## Product Purpose

Omoide (思い出, "memories") is a backup-first, share-later photo app for groups.
Photos are uploaded byte-exact (originals are never recompressed) into a **Bako** (箱),
one shared box per trip. Success: frictionless share-trigger upload and lossless
retrieval inside an app that feels warm and non-digital.

## Positioning

Lives inside the native OS share sheet: select photos → Share → Omoide → pick Bako →
background upload, three taps after gallery selection. Not a social feed — no likes,
comments, or discovery. Private shelf of memory boxes, invitation-link only.

## Operating Context

- Core flows in priority order: share-trigger upload → home shelf → inside-a-Bako
  grid/multi-select/viewer → create Bako + invite link → onboarding/tutorial.
- Upload honesty is product truth: Tier A foreground uploads only within ~30 s grace;
  copy must never promise background sync beyond what the OS allows.
- Freemium: free = 3 Bakos / 5 GB; paid unlimited via RevenueCat; quota meter visible.
- Terminology is binding: **Omoide** (the app), **Bako** (one shared album).

## Capabilities and Constraints

- Originals byte-exact end-to-end; SHA-256 verified; HEIC preserved; JPEG fallback
  rendition only for devices that cannot decode HEIF.
- Share intake via expo-sharing receive-share (experimental, contained); payloads park
  until auth completes.
- WorkOS AuthKit auth (email/Google/Apple); tokens in secure-store; MMKV for caches/queues.
- Light mode only for v1 (`userInterfaceStyle` locked); dark "lamplight" palette later
  behind the same theme tokens.
- No tabs in navigation; single stack + bottom sheets for contextual decisions.
- Zero hardcoded hex anywhere outside theme tokens (CONTRACTS.md §10).

## Brand Commitments

- Wordmark sub-tagline: `思い出 · memories`.
- Editorial serif allowed for the wordmark only; system sans carries UI.
- Sentence case everywhere; font weights 400/500 only.
- The app must feel like opening a shoebox of old photos. If a choice makes it feel
  like Google Photos, it is wrong. (Binding test from PRD §4.)

## Evidence on Hand

docs/prd.md (approved spec), docs/tickets/CONTRACTS.md (frozen integration surface,
incl. §10 theme token values), docs/tickets/*.md (T01–T16 build tickets).
No marketing site, testimonials, or press assets exist; none may be fabricated.

## Product Principles

1. Frictionless first: any added step in the share flow costs real adoption.
2. Pristine originals: fidelity is the product; nothing recompresses user photos.
3. Warmth over cleverness: cozy and nostalgic beats sleek and efficient.
4. Honest machinery: progress states tell the truth about what the OS allows.
5. Private by structure: invitation links only, no discovery surfaces.

## Accessibility & Inclusion

Contrast floor: secondary text (warm-muted) on cream/parchment backgrounds must meet
WCAG AA for its role (T16 checklist). Dynamic type follows platform text styles;
touch targets meet platform minimums (44 pt iOS / 48 dp Android).
