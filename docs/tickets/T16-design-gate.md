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

## Async log

(append: date, what you decided or hit, why)
