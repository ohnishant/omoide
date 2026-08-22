---
name: Omoide
description: A shoebox of old photos — backup-first, share-later photo boxes for groups
colors:
  cream: "#F5F0E8"
  parchment: "#EDE5D4"
  warm-white: "#FEFCF8"
  terracotta: "#C26B54"
  terracotta-deep: "#A54D35"
  dusty-rose: "#D4857A"
  forest: "#4A7C59"
  espresso: "#3A2F2A"
  cocoa: "#7A5C4A"
  warm-muted: "#A08070"
  lamplight-base: "#161311"
  lamplight-inset: "#2A2420"
  lamplight-raised: "#42372E"
  lamplight-ivory: "#F5F0E8"
  lamplight-bone: "#EBE3D5"
  lamplight-muted: "#A48B85"
  lamplight-glow: "#FFB5A0"
  lamplight-ember: "#DD7254"
  lamplight-clay: "#BE5A3E"
  lamplight-on-glow: "#5F1501"
typography:
  display:
    fontFamily: "ui-serif, Georgia, serif"
    fontSize: 34
    fontWeight: 400
    lineHeight: 40
  title:
    fontFamily: "system-ui (SF Pro / Roboto)"
    fontSize: 22
    fontWeight: 500
    lineHeight: 28
  headline:
    fontFamily: "system-ui (SF Pro / Roboto)"
    fontSize: 17
    fontWeight: 500
    lineHeight: 22
  body:
    fontFamily: "system-ui (SF Pro / Roboto)"
    fontSize: 17
    fontWeight: 400
    lineHeight: 22
  label:
    fontFamily: "system-ui (SF Pro / Roboto)"
    fontSize: 13
    fontWeight: 500
    lineHeight: 18
  metadata:
    fontFamily: "system-ui (SF Pro / Roboto)"
    fontSize: 13
    fontWeight: 400
    lineHeight: 18
rounded:
  sm: 6
  md: 10
  lg: 16
  pill: 999
spacing:
  xs: 4
  sm: 8
  md: 16
  lg: 24
  xl: 32
  xxl: 48
components:
  button-primary:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.warm-white}"
    typography: "{typography.headline}"
    rounded: "{rounded.md}"
    height: 50
    padding: "13 24"
  button-secondary:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.espresso}"
    typography: "{typography.headline}"
    rounded: "{rounded.md}"
    height: 50
    padding: "13 24"
  card-bako:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.lg}"
    padding: 16
  button-primary-lamplight:
    backgroundColor: "{colors.lamplight-glow}"
    textColor: "{colors.lamplight-on-glow}"
    typography: "{typography.headline}"
    rounded: "{rounded.md}"
    height: 50
    padding: "13 24"
  card-bako-lamplight:
    backgroundColor: "{colors.lamplight-raised}"
    textColor: "{colors.lamplight-ivory}"
    rounded: "{rounded.lg}"
    padding: 16
  polaroid-cell:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.cocoa}"
    rounded: "{rounded.sm}"
  input-field:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.md}"
    height: 44
    padding: "10 16"
---

# Design System: Omoide

## Overview

**Creative North Star: "The Sun-Faded Shoebox"**

Omoide feels like pulling a cardboard shoebox down from a closet shelf: photo prints
with soft white borders, handwritten trip names, paper that has warmed with age.
Every surface is paper-toned, every shadow is soft afternoon light, and the single
kiln-fired accent color appears only where a thumb-worn edge would be rubbed — the
one primary action on a screen. Density is generous, never dense; whitespace is the
mat around the print.

The world is tactile and analog against an app that is technically rigorous underneath
(byte-exact originals, presigned uploads). The interface recedes; the photos carry the
color. Screens read as warm paper first, photography second, chrome last.

**Key Characteristics:**

- Warm paper neutrals everywhere; no pure black, pure white, or blue anywhere
- One earthy accent (terracotta) used sparingly as the voice of action
- Polaroid treatment: grid cells wear warm-white borders like prints
- Bottom sheets for every contextual decision; full-screen modals only for immersion
- Two font weights, sentence case, system type — the design lives in tokens, not type

## Colors

Paper and clay: a cream/parchment paper family, one kiln-fired accent, one botanical
green, and espresso ink for text.

### Primary

- **Terracotta** (#C26B54): primary actions, CTAs, active navigation state. Appears at
  most once per screen viewport — its rarity is its authority. Fills buttons and marks
  the active destination; it never decorates.
- **Kiln Deep** (#A54D35): terracotta's readable sibling. Interactive *text* on cream or
  parchment (links, text buttons) uses this darker value to hold AA contrast (4.99:1 on
  cream). Pressed states of terracotta fills also deepen to Kiln Deep.

### Secondary

- **Dusty Rose** (#D4857A): accents, dot indicators, avatar fills. Never text; never a
  fill behind body text.
- **Forest Moss** (#4A7C59): success and member-join indicators. Non-text use (icons,
  badges, dots) freely; as small text only at ≥17 pt / weight 500 (4.29:1 on cream).

### Neutral

- **Cream Paper** (#F5F0E8): primary app background. The default world the phone shows.
- **Parchment** (#EDE5D4): secondary surfaces, tab bars, empty mosaic cells, tonal
  secondary buttons.
- **Warm White** (#FEFCF8): card surfaces, bottom nav, input fields, Polaroid borders.
  The brightest value in the system — deliberately not #FFFFFF.
- **Espresso Ink** (#3A2F2A): primary text. Warm brown-black, never #000000.
- **Cocoa** (#7A5C4A): secondary text, labels, metadata — the *readable* muted ink
  (≥4.85:1 on every surface).
- **Warm Taupe** (#A08070): decorative muted tone only — disabled controls, dividers,
  placeholder accents. Fails contrast for text (3.18:1 on cream); it must never carry
  words a user must read.

### Named Rules

**The Google Photos Test.** If a choice makes a screen feel like Google Photos — cool
grays, blue links, infinite white chrome — it is wrong, whatever the heuristic says.

**The No Extremes Rule.** No pure black (#000000), no pure white (#FFFFFF), no
blue-hued anything in the palette. Depth and ink are always warm-tinted.

**The One Voice Rule.** Terracotta speaks once per screen. If two elements compete in
accent color, one of them is wrong.

**The Readable Ink Rule.** Words a user must read are Espresso or Cocoa only (light) or
Ivory/Bone/Muted only (Lamplight). Taupe may fade chrome, never copy.

### Lamplight (Dark Variant)

The same shoebox after dark, read by a single desk lamp: deep warm brown-black paper,
glowing clay accents, off-white ink. Values below are validated against this variant's
surfaces; the light-mode rules above all hold unchanged.

- **Midnight Base** (#161311): primary canvas. Warm brown-black, deliberately not black.
- **Dark Chocolate** (#2A2420): inset surfaces — bottom sheets, input fields, recessed wells.
- **Deep Amber** (#42372E): raised card surfaces (Bako cards), tonal lift without shadow.
- **Soft Ivory** (#F5F0E8): primary text and Polaroid frames on dark (16.3:1). The same
  value as cream — daylight paper becomes nighttime ink.
- **Warm Bone** (#EBE3D5): body copy alternative (9.1:1 on raised surfaces).
- **Muted Umber** (#A48B85): readable secondary/metadata ink on dark (5.8:1); also the
  sheet grabber. Decorative-only values do not exist in this variant's text roles.
- **Candle Glow** (#FFB5A0): primary button fill, active states — the lamp flame.
  Labels in **Ember Roast** (#5F1501) pass at any size (7.8:1).
- **Kiln Ember** (#DD7254): interactive *text* on dark surfaces (5.8:1).
- **Terracotta Glow** (#BE5A3E): accent fills and pressed states only — fails AA as
  small text on the base (4.16:1), so it never carries words.
- Success (#9DD3AA / #689C77 container) and error (#FFB4AB / #93000A container) keep
  their light-mode roles; all pairings verified ≥4.5:1.

**The Lamplight Rule.** Dark mode is a lighting change, not a palette swap of opposite
extremes: every dark token keeps its light-mode role, no pure black or pure white ever
appears, and glow replaces shadow — never gray inversion.

## Typography

**Display Font:** ui-serif / Georgia serif — wordmark and `思い出 · memories` moments only
**Body Font:** system sans (SF Pro on iOS, Roboto on Android)
**Label/Mono Font:** none — labels stay on the system sans

**Character:** Quiet and unbranded. The system face keeps the app native and legible;
all personality is spent on color and paper texture, so type never competes with the
photographs.

### Hierarchy

- **Display** (400, 34/40, serif): the Omoide wordmark, welcome-screen greeting. Serif is
  banned everywhere else.
- **Title** (500, 22/28): screen titles ("Kyoto 2024"), Bako names.
- **Headline** (500, 17/22): button labels, list row titles, section headers.
- **Body** (400, 17/22): primary reading text, sheet descriptions.
- **Label** (500, 13/18): tab bar items, chips, badges, over-photo contributor tags.
- **Metadata** (400, 13/18): timestamps, member counts, storage figures — Cocoa ink.

### Named Rules

**The Two-Weight Rule.** Weights 400 and 500 exist; nothing else does. Emphasis comes
from size, color, or weight 500 — never from bold, italic, or uppercase shouting.

**Sentence Case Rule.** Every string in the UI is sentence case. "New Bako", never
"NEW BAKO" or "New bako".

## Layout

Single-stack navigation with no tabs (PRD §9.6); hierarchy is push-and-back. Content
lives inside safe-area insets with platform-standard gutters (16 md spacing; 24 lg for
screen edges on shelf screens). Vertical rhythm follows the 4-base scale (xs 4 →
xxl 48), with more space above headings than below. Cards stack in single-column
scrolls; photo grids are uniform 3-column squares — no masonry, no variable heights.
Bottom sheets dock with grabber handles and respect keyboard insets. Touch targets
meet platform minimums (44 pt iOS / 48 dp Android).

## Elevation & Depth

Depth is sunlight through paper: soft, warm, ambient. Shadows derive from Espresso
Ink at low alpha — never gray, never black — and always carry offset plus blur; flat
halos do not exist here. Most of the time layering is tonal (cream under parchment
under warm-white) and shadowless; shadow is reserved for things that physically float.

### Shadow Vocabulary

- **card** (`0 1px 2px rgba(58,47,42,0.06), 0 4px 12px rgba(58,47,42,0.08)`): Bako
  cards, Polaroid grid cells — barely-there lift off the paper.
- **float** (`0 6px 16px rgba(58,47,42,0.16), 0 12px 32px rgba(58,47,42,0.14)`): the
  floating multi-select action bar and dragged elements — genuinely above the page.

### Named Rules

**The Paper Stack Rule.** Prefer tonal layering (surface color changes) over shadows.
If an element rests on the page, give it a lighter paper tone before giving it a shadow.

**The Lamplight Glow Rule (dark only).** Depth inverts after dark: hierarchy steps from
darkest to lightest (Base #161311 → Chocolate #2A2420 → Amber #42372E), raised elements
carry a faint warm bloom (`0 0 24px rgba(255,181,160,0.12)`) instead of a drop shadow,
and insets read as cut-into-the-surface by being darker than their surround. Bloom
always keeps a soft blur — a hard halo is never a glow.

## Shapes

Soft but not bubbly. Radius scale: sm 6 (grid cells, small chips), md 10 (buttons,
inputs, sheets' inner elements), lg 16 (cards, bottom sheets), pill 999 (dot
indicators, member avatars, tag pills). Grid cells clip their photo inside a 6-radius
frame wrapped in a warm-white Polaroid border (3–4 px sides, wider 12 px bottom lip
on featured prints). Borders between surfaces are tonal steps, not hairlines; when a
hairline divider is unavoidable it is Warm Taupe at low alpha. The dashed "New Bako"
card is the one intentional sketch gesture — dashed Parchment border on Cream.

## Components

### Buttons

- **Shape:** gently curved rectangle (radius 10), fixed height 50, padding 24×13
- **Primary:** Terracotta fill, Warm White label at Headline (17/500). Label size never
  drops below 17 pt so the 3.71:1 fill/label pair holds WCAG large-text AA. Pressed
  state deepens fill to Kiln Deep.
- **Primary (Lamplight):** Candle Glow #FFB5A0 fill with Ember Roast #5F1501 label —
  passes AA at any size (7.8:1). Pressed deepens through Kiln Ember to Terracotta Glow.
- **Secondary:** Parchment fill, Espresso label. Same geometry; no border. Lamplight:
  Deep Amber #42372E fill, Warm Bone label.
- **Text/link:** no fill; Cocoa text, or Kiln Deep when the text itself is the action.
  Lamplight: Kiln Ember #DD7254 text (never Terracotta Glow — fails 4.5:1).
- **Disabled:** Warm Taupe fill, Cream label; no opacity tricks. Lamplight: Dark
  Chocolate fill, Muted Umber label.

### Bako Card (signature)

- **Cover:** 2×2 mosaic of the four most-recent uploads; empty cells filled Parchment
  (Dark Chocolate in Lamplight); pending uploads project shimmer slots into the mosaic.
- **Surface:** Warm White, radius 16, card shadow, internal padding 16. Lamplight:
  Deep Amber surface, glow bloom instead of shadow.
- **Meta row:** Title-weight trip name (Espresso / Soft Ivory), Metadata member count +
  quota (Cocoa / Muted Umber), Dusty Rose dot for "N new".
- **Upload progress:** badge on the card plus an activity-feed line — never a modal,
  never a progress screen.

### Polaroid Grid Cell

- **Shape:** square, radius 6, Warm White border 3–4 px, card shadow.
- **Behavior:** contributor name appears on tap only, as a Label-size tag on a
  semi-transparent Espresso scrim. Multi-select via long-press; selected cells gain a
  Terracotta check disc.

### Bottom Sheets

- **Shape:** radius 16 top corners, Warm White, grabber handle (Warm Taupe, pill).
- **Behavior:** all contextual decisions live here — pick/create Bako on share,
  download options, paywall. Swipe-to-dismiss honored unless data loss is possible.
  Never used for immersion (photo viewer stays full-screen).

### Inputs / Fields

- **Style:** Warm White fill, radius 10, no stroke at rest; 1 px Warm Taupe-alpha
  border only when the surrounding surface is also Warm White. Lamplight: Dark
  Chocolate fill, Soft Ivory text, Terracotta Glow caret.
- **Focus:** border shifts to Terracotta; caret is Espresso.
- **Error:** message in a deepened Forest-independent clay red is avoided — errors use
  Espresso text on Parchment with a Terracotta left icon; recovery is always stated.

### Navigation

- **Style:** no tab bar (single stack). Header titles at Title weight 500, back arrows
  system-drawn. Active route indicators (where sheets list destinations) use Terracotta
  icon tint + Espresso label; inactive are Cocoa.
- **Member filter bar:** horizontal avatar row, pill avatars filled from the cycle
  [dusty-rose, terracotta, forest, warm-muted], initials in Warm White Label type.

### Floating Action Bar

Multi-select's companion: pill container (radius 999... visually radius 16 capsule),
Warm White, float shadow, "Download (3)" primary + deselect ghost. Anchors above the
home indicator, enters with a spring rise, honors Reduce Motion with a crossfade.
Lamplight: Deep Amber container lifted by a soft glow bloom, no drop shadow.

## Do's and Don'ts

### Do:

- **Do** route every color, space, radius, font, and shadow through theme tokens — zero
  hardcoded hex outside theme.ts (CONTRACTS §10).
- **Do** keep terracotta for exactly one primary action per screen; use Kiln Deep for
  interactive text on paper backgrounds.
- **Do** design empty, loading, and error states with the same paper warmth — skeleton
  cells in Parchment, never eternal spinners.
- **Do** show upload/download progress as badges and feed lines; resumable progress
  cards live in sheets, not takeover screens.
- **Do** lock light mode (`userInterfaceStyle`); the future dark palette will be a
  "lamplight" swap behind these same token names.

### Don't:

- **Don't** introduce cool grays, blues, or pure black/white — the Google Photos Test
  fails the whole screen.
- **Don't** use font weights beyond 400/500, uppercase labels, or non-sentence-case copy.
- **Don't** open a full-screen modal for a single decision; that is a bottom sheet.
- **Don't** let Warm Taupe carry readable text (use Cocoa), or Dusty Rose sit behind copy.
- **Don't** add likes, comments, feeds, or any social-discovery pattern — Omoide is a
  private shelf, and its design must never imply otherwise.
- **Don't** invert to gray for dark mode: Lamplight tokens are warm-tinted by value,
  glow replaces shadow, and pure black/white stay banned in both modes.
- **Don't** introduce brand text faces (Inter, Noto Serif, etc.) in either mode — the
  system sans carries UI; the serif belongs to the wordmark alone.
