# T16 · Design finalization gate

Wave 6 (last) · Depends on: every screen ticket done
Owns: edits across `apps/mobile/src/app/**` and feature dirs (this is the one
ticket allowed to touch other tickets' screens)

## Goal

Run `/impeccable` across every screen as polish/QA pass before calling any
screen done (PRD §4 gate). Fix findings. This ticket converts "works" into
"ships".

## Contract to resolve

CONTRACTS.md §10 token discipline holds during polish: no hardcoded hex may
enter during fixes; new visual needs get added as tokens first, then used.

Checklist per screen (shelf, bako/[id], download modal, create modal,
join/[token], welcome, tutorial, photo viewer, handle-share, settings):

- Feels like a shoebox of old photos, not Google Photos (PRD §4 test).
- Sentence case everywhere, weights 400/500 only.
- Bottom sheets for all contextual decisions; no full-screen single-decision
  modals.
- Empty/loading/error states all designed, not default spinners forever.
- Upload progress stays badge + activity line, never intrusive.
- Long-press/floating action bar gesture feel tuned on device.
- Light mode only; verify nothing regressed toward dark/system.
- Contrast check warm-muted text on cream backgrounds (accessibility floor).

## Gotchas

- Polish passes love to introduce hardcoded colors and shadow literals;
  lint for hex after every fix batch.
- Gesture tuning can regress multi-select reliability; rerun T11's device
  checks after any gesture change.
- Do not rename routes or contract fields while polishing; integration
  freezes at this stage except via CONTRACTS.md changelog.

## Done when

- Every screen has an impeccable-pass note in its file header comment or
  feature README with date + findings fixed.
- Full manual walkthrough of all 5 PRD core flows on real iOS + Android
  devices, issues found logged and fixed.
- Lint/typecheck green repo-wide; no hex outside theme.ts verified by search.

## Status

done

## Async log

- 2026-08-22 · Design-language gate run ahead of screens (owner-directed).
  Produced `PRODUCT.md`, `DESIGN.md` ("The Sun-Faded Shoebox" world from PRD §4)
  and `.impeccable/design.json` sidecar via the impeccable loop.
  Findings fixed at token level:
  1. `warmMuted #A08070` fails AA for text on cream/parchment (3.18/2.88:1) →
     demoted to decorative-only (disabled, dividers); new readable secondary
     text token **cocoa #7A5C4A** added (5.35/4.85:1). CONTRACTS §10 needs a
     changelog entry when T05 builds theme.ts.
  2. Interactive text on paper gets new token **terracottaDeep #A54D35**
     (4.99:1 on cream); terracotta fills keep #FEFCF8 labels only at ≥17 pt/500
     (3.71:1 = WCAG large-text pass).
  3. Forest as small text restricted to ≥17pt/500 (4.29:1); free as non-text.
- Per-screen polish passes were not run because no Omoide screens exist yet
  (`app/` is still the stock Expo scaffold). Each screen ticket (T05, T10–T15)
  must apply DESIGN.md + this checklist at build time; re-run an impeccable
  pass over the real screens before store submission prep (PRD phase 10).
  Marking done per owner instruction; the checklist above remains binding.
