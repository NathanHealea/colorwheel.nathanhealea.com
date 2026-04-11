# Color Scheme and Theme

**Epic:** Marketing & Branding
**Type:** Feature
**Status:** Todo
**Branch:** `v1/feature/color-scheme-and-theme`

## Summary

Define the Grimify brand color palette and configure the app's light/dark theme using CSS custom properties. The theme must be intentionally subdued — Grimify is a color exploration tool, so the UI chrome should recede and let paint swatches be the most colorful things on screen.

## Context

Grimify was primarily built for a group of friends painting Warhammer and Age of Sigmar miniatures. The theme should have a subtle nod to the grimdark hobby aesthetic without competing with the thousands of paint colors users are browsing, comparing, and exploring. Neutral backgrounds, minimal brand color usage, and strong contrast for text.

## Acceptance Criteria

- [ ] Brand primary and accent colors are defined (kept to 1-2 hues max)
- [ ] Light mode theme is configured with brand colors in `globals.css`
- [ ] Dark mode theme is configured with brand colors in `globals.css`
- [ ] Theme tokens use OKLch color format for perceptual consistency
- [ ] Color variables are documented in a `src/styles/variables.css` file
- [ ] Backgrounds are neutral (near-zero chroma) so paint swatches display accurately
- [ ] All existing components render correctly with the updated theme
- [ ] `npm run build` and `npm run lint` pass with no errors

## Design Principle

**The UI is the frame, not the painting.** Brand color only appears on interactive elements (buttons, links, focus rings). Everything else is neutral gray. This ensures:
- Paint swatches are the most colorful elements on screen
- Color comparisons aren't influenced by surrounding UI hues
- The app feels like a clean tool, not a colorful distraction

## Color Scheme Options

Three options, all intentionally restrained. Each uses a single brand hue for interactive elements over neutral gray backgrounds.

---

### Option A: "Crimson" — Warhammer Red

A single warm accent pulled from the Warhammer universe. Crimson on buttons and links, everything else gray.

| Token | Role | OKLch | Hex (approx) |
|---|---|---|---|
| **Primary** | Crimson | `oklch(0.50 0.18 25)` | `#A82030` |
| **Primary Foreground** | White | `oklch(0.98 0 0)` | `#FAFAFA` |
| **Accent** | Same as primary | — | — |

Backgrounds, cards, borders, muted — all neutral grays (same as current shadcn defaults, zero chroma).

---

### Option B: "Teal" — Tool Blue-Green

A cool, professional teal. Feels like a utility app. Subtle, doesn't clash with any paint hue range.

| Token | Role | OKLch | Hex (approx) |
|---|---|---|---|
| **Primary** | Deep Teal | `oklch(0.52 0.10 220)` | `#1E7A8A` |
| **Primary Foreground** | White | `oklch(0.98 0 0)` | `#FAFAFA` |
| **Accent** | Same as primary | — | — |

---

### Option C: "Gold" — Retributor Brass

A warm gold accent that nods to Warhammer's Stormcast and Custodes metallics. Warm but restrained.

| Token | Role | OKLch | Hex (approx) |
|---|---|---|---|
| **Primary** | Aged Gold | `oklch(0.65 0.14 80)` | `#B8892A` |
| **Primary Foreground** | Dark | `oklch(0.15 0 0)` | `#181818` |
| **Accent** | Same as primary | — | — |

---

**All three options share the same neutral base:**

| Token | Light Mode | Dark Mode |
|---|---|---|
| **Background** | `oklch(0.99 0 0)` — near white | `oklch(0.15 0 0)` — near black |
| **Card** | `oklch(1 0 0)` — white | `oklch(0.19 0 0)` — dark gray |
| **Foreground** | `oklch(0.15 0 0)` — near black | `oklch(0.96 0 0)` — near white |
| **Muted** | `oklch(0.96 0 0)` — light gray | `oklch(0.25 0 0)` — dark gray |
| **Muted Foreground** | `oklch(0.55 0 0)` — mid gray | `oklch(0.70 0 0)` — mid gray |
| **Border** | `oklch(0.91 0 0)` | `oklch(0.25 0 0)` |
| **Input** | `oklch(0.91 0 0)` | `oklch(0.25 0 0)` |

All backgrounds and surfaces have **zero chroma** — pure neutral grays — so paint colors always read true.

## Key Files

| Action | File | Description |
|---|---|---|
| Create | `src/styles/variables.css` | Brand color definitions |
| Modify | `src/app/globals.css` | Update `:root` and `.dark` theme variables, import variables.css |

## Implementation

### Step 1: Choose a color scheme

Pick Option A, B, or C (or provide a custom single-hue accent). The only colored tokens are `--primary`, `--primary-foreground`, `--ring`, and `--accent`. Everything else stays neutral gray.

### Step 2: Create `src/styles/variables.css`

```css
/*
 * Grimify Brand Colors
 * Keep it simple — one brand hue, neutral everything else.
 */

:root {
  --grimify-brand: oklch(...); /* chosen primary */
  --grimify-brand-foreground: oklch(...);
  --grimify-brand-hover: oklch(...); /* slightly lighter/darker for hover */
}
```

### Step 3: Update `src/app/globals.css`

1. Add `@import '../styles/variables.css';` after the tailwind imports.
2. Update `:root` to map `--primary` and `--ring` to the brand color. Keep all surface/background tokens as neutral grays.
3. Update `.dark` similarly — adjust the brand color's lightness for dark mode contrast if needed.

### Step 4: Verify

1. `npm run build` and `npm run lint` pass
2. Buttons, links, and focus rings show the brand color
3. Cards, backgrounds, borders are all neutral gray
4. A paint swatch (colored div) looks the same against the background as it would on a white/black surface

## Notes

- Dark mode is likely the primary mode for this audience — consider defaulting to dark.
- The `--secondary` token can stay as a neutral gray; there's no need for a second brand color when the goal is maximum neutrality.
- Destructive color stays red (`oklch(0.58 0.24 27)`) regardless of chosen brand — it's a functional color, not brand.
- Chart colors should also use muted, distinguishable hues that don't overshadow paint data.
