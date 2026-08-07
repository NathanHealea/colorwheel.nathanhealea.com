# DESIGN.md — Grimify

> Grimify is a **precision craft tool** for miniature painters. It helps painters search, compare, track, and collect paint colors across brands. Every design decision flows from one principle: **color is the hero — the UI is its frame**.

The design system is called **Undercoat**. Its tokens live in `src/styles/variables.css` (fixed values) and `src/app/globals.css` (theme-adaptive roles and font families).

---

## 1. Visual Theme & Atmosphere

**Design character**: Instrument panel. Functional precision, zero decoration.

Grimify sits at the intersection of three reference points:

| Reference | What Grimify borrows |
|-----------|----------------------|
| **Coolors** | Color-as-hero philosophy — neutral chrome, swatches pop |
| **ArmyCrafter** | Hobbyist utility — filter-heavy, dual-theme, community-aware |
| **Lab / measurement software** | Data legibility — mono numerals, hairline rules, tight radii |

**Mood**: A colorimeter's readout. Calm graphite chrome with one amber indicator light.

**Density**: Moderate-tight. Radii are small (4–8px), type is compact, rules are hairlines. Paint cards are small; comparison and detail views expand.

**Light mode**: Graphite-tinted near-white canvas (`#f4f5f7`). Cards are pure white. Cool slate hairlines organize hierarchy. Amber signals measurement and ownership.

**Dark mode**: Near-black graphite (`#0e1013`) with cool slate panels (`#171a20`). Amber brightens to its base step. The darkness reads as instrument housing, not atmosphere.

**Always dual-theme.** Both modes are first-class. There is currently no theme toggle shipped, but every adaptive role is defined for `.dark` and must stay correct.

**Amber is the only chromatic color in the interface.** It always means something — measurement, ownership, or active state. Never decoration. Terracotta (`danger`) is the one exception, reserved for validation and destructive actions.

---

## 2. Color Palette & Roles

All values are hex tokens in `src/styles/variables.css`. Use the semantic role, never the raw ramp step.

### Palette Ramps

Four numeric ramps, 50 → 950, base at 500.

| Ramp | Character | 50 | 500 | 950 | Purpose |
|------|-----------|-----|-----|-----|---------|
| `primary-*` | Graphite | `#f4f5f7` | `#5b6270` | `#0e1013` | App chrome, grounds, text |
| `secondary-*` | Cool slate | `#f7f8fa` | `#8a919e` | `#171a20` | Borders, mounts, metadata, disabled |
| `accent-*` | Signal amber | `#fff8e8` | `#ffb020` | `#351d00` | Measurement, ownership, active state |
| `danger-*` | Terracotta | `#fdf4f1` | `#c44b2b` | `#280e08` | Validation errors, destructive actions |

> `primary` is **graphite chrome, not the brand signal**. `--color-primary` resolves to `primary-900`. The thing a user clicks is `signal` / `signal-on`, never `primary`.

### Theme-Adaptive Roles

These are the vocabulary for markup. Each is a Tailwind utility namespace (`bg-canvas`, `text-copy`, `border-rule`, …) that flips on `.dark`.

| Utility | Role | Light | Dark |
|---------|------|-------|------|
| `canvas` | Page background | `primary-50` | `primary-950` |
| `panel` | Card, popover, dropdown, sheet, dialog | `white` | `secondary-950` |
| `panel-raised` | Chip / tint on top of a panel | `primary-100` | `secondary-900` |
| `inset` | Muted + hover surfaces, skeletons, wells | `primary-50` | `secondary-900` |
| `rule` | Default border, input outline, divider | `secondary-200` | `secondary-900` |
| `rule-strong` | Emphasised border, secondary button | `secondary-300` | `secondary-800` |
| `copy` | Primary text | `primary-900` | `secondary-200` |
| `meta` | Secondary text, captions, placeholders | `secondary-500` | `secondary-400` |
| `signal-on` | Amber as **text / border / ring** on the active ground | `accent-700` | `accent-500` |
| `danger` | Error text and destructive action | `danger-600` | `danger-400` |
| `danger-soft` | Error background tint | `danger-100` | `danger-900` |

**`signal` vs `signal-on`.** `bg-signal` is always `accent-500` — fills need no contrast bump, and `text-ink` on top of them stays legible in either theme. `text-signal-on` / `border-signal-on` adapts, because amber-500 as *text* fails contrast on a light ground.

### Ground-Specific Roles

Reach for these only when you deliberately want a value that **ignores** the theme.

| Utility | Value | When |
|---------|-------|------|
| `ink`, `ink-raised`, `ink-line` | Fixed dark surfaces | Text on an amber fill (`text-ink`); permanently dark marketing sections |
| `ink-text`, `ink-text-muted` | Fixed light text | Copy on a fixed dark surface |
| `surface-mount` | `secondary-100` | The light mat under a swatch — see `.card-mount` |
| `graphite`, `slate`, `slate-dim` | Fixed dark text | Copy on a fixed light surface (inside a mount) |
| `signal`, `signal-ink` | `accent-500` / `accent-700` | Amber fills; amber text known to be on a light ground |

### Domain Semantics

| Utility | Value | Meaning |
|---------|-------|---------|
| `stock-low` | `accent-700` | Collection quantity running out |
| `match-close` | `accent-700` | ΔE < 3 — a close cross-brand match |
| `match-far` | `secondary-500` | ΔE ≥ 3 — present but not notable |

### Paint Swatch Colors

Paint swatches are user-supplied hex values. They are never styled by the design system — their color IS the content. Use `.swatch` (geometry only) and set the color inline:

```tsx
<div className="swatch size-10" style={{ background: paint.hex }} />
```

Always render a swatch against a neutral ground (`panel`, `inset`, or `.card-mount`) so the swatch dominates.

---

## 3. Typography

Three faces, each with a distinct job. All loaded via `next/font/google` in `src/app/layout.tsx`, which exposes them as `--font-display-face` / `--font-sans-face` / `--font-mono-face`; the `@theme inline` block in `globals.css` wraps each in its fallback stack.

| Token | Family | Job |
|-------|--------|-----|
| `font-display` | Space Grotesk | Headings, page titles, brand wordmark. Applied automatically to `h1`–`h4`. |
| `font-sans` | IBM Plex Sans (400/500/600) | Body and UI text. The `<html>` default. |
| `font-mono` | IBM Plex Mono (400/500) | Micro-labels, data chips, ΔE values, hex codes, prices. |

Every numeral in `font-mono`, `code`, `kbd`, and `samp` is `tabular-nums` — columns of numbers must align.

### Type Scale

Line-height and letter-spacing are **baked into each step**. Do not add `leading-*` or `tracking-*` utilities on top.

| Utility | Size | Line-height | Tracking | Use |
|---------|------|-------------|----------|-----|
| `text-micro` | 10px | 1.3 | +0.06em | Mono uppercase labels (`.label-micro`) |
| `text-data` | 11.5px | 1.4 | — | Mono chips, ΔE, prices, badges |
| `text-small` | 12.5px | 1.5 | — | Helper text, captions, descriptions |
| `text-body` | 14.5px | 1.55 | — | Default — set on `body` |
| `text-subhead` | 15px | 1.3 | −0.01em | Card/step titles, large inputs |
| `text-heading` | 19px | 1.2 | −0.02em | Section headings, card titles, dialog titles |
| `text-title` | 24px | 1.1 | −0.03em | Page titles |
| `text-display` | 42px | 1.0 | −0.035em | Marketing hero only |

The design-system CSS in `src/styles/` uses this scale exclusively. **Page markup has not been migrated yet** — it still carries Tailwind's default `text-sm` / `text-xs` / `text-lg`. New markup should use the Undercoat scale; the sweep of existing pages is outstanding work.

---

## 4. Component Stylings

Component classes live one-per-file in `src/styles/*.css`, imported into `layer(components)` from `globals.css`.

### Radius Vocabulary

Five steps, each with a job. Don't reach for Tailwind's `rounded-md` / `rounded-lg` / `rounded-xl`.

| Token | Value | Use |
|-------|-------|-----|
| `rounded-swatch` | 4px | Swatches, badges, chips, xs/sm controls |
| `rounded-control` | 5px | Buttons, inputs, selects, menu rows |
| `rounded-tile` | 6px | Icon tiles, large badges |
| `rounded-card` | 8px | Cards and every floating panel |
| `rounded-device` | 22px | Device-frame mockups (marketing) |

### Buttons (`.btn`)

Base: `h-8`, `px-2.5`, `rounded-control`, `text-small`, `font-medium`, `inline-flex`, `gap-1.5`

| Class | Appearance | When to use |
|-------|-----------|-------------|
| `.btn-primary` | Amber fill, ink text | Primary action — Add to Collection, Save Palette |
| `.btn-secondary` | Hairline border, panel fill | Secondary actions beside a primary |
| `.btn-accent` | Amber tint fill, amber text | Active toggles, ownership state |
| `.btn-outline` | Border in the variant's color, canvas fill | Secondary emphasis |
| `.btn-ghost` | No border, meta text → inset bg on hover | Toolbar actions, icon-only buttons |
| `.btn-soft` | Inset fill, meta text → copy on hover | Filter tags, list actions |
| `.btn-destructive` | Terracotta tint fill, terracotta text | Delete, remove |
| `.btn-link` | Transparent, amber, underline on hover | Inline text links |

Sizes: `.btn-xs` (h-6, `text-data`), `.btn-sm` (h-7), `.btn-md` (h-8, default), `.btn-lg` (h-9, `text-body`)

Shapes: `.btn-square` / `.btn-circle` for icon-only. `.btn-block` for full-width. `.btn-wide` for wide CTAs.

Focus state: `focus-visible:border-signal-on focus-visible:ring-3 focus-visible:ring-signal-on/50`. Destructive buttons ring in terracotta.

There are no `success` / `warning` / `info` variants. Amber is the only chromatic color; a second and third hue would dilute it.

### Cards (`.card`)

Base: `rounded-card`, `border border-rule`, `bg-panel`, `text-copy`, `shadow-card`

Undercoat separates panels with a **hairline rule first and a shadow second** — `--shadow-card` is a 1px lift, not a float.

| Sub-element | Class | Notes |
|-------------|-------|-------|
| Content area | `.card-body` | `p-6`, `flex flex-col gap-4` |
| Heading | `.card-title` | `font-display text-heading font-semibold` |
| Description | `.card-description` | `text-small text-meta` |
| Footer | `.card-footer` | `p-6 pt-0`, horizontal flex for actions |
| Compact | `.card-compact .card-body` | `p-4`, `gap-3` — dense paint grids |
| Emphasised | `.card-bordered` | `border-2` — selection state, not decoration |
| Mount | `.card-mount` | Light mat for color-subject cards — see below |

**`.card-mount` is not theme-adaptive on purpose.** In dark mode a swatch-bearing card gets *lighter*, never darker, so the paint stays the brightest thing on screen. Use it for any card whose subject is a color.

**Paint cards** always show the swatch prominently — a large `.swatch` or `.swatch-circle` using the paint's hex — before the paint name.

### Swatches (`.swatch`)

Geometry only; the color is always inline.

| Class | Notes |
|-------|-------|
| `.swatch` | `--radius-swatch` + `background-clip: padding-box` |
| `.swatch-circle` | Fully round |
| `.swatch-hero` | Card radius plus `--inset-shadow-bottle` — the paint-pot meniscus |

`background-clip: padding-box` keeps a translucent border from being tinted by the paint underneath, which is what makes one hairline border read correctly on both very dark and very light paints.

### Control States — the shared escalation

Every interactive control in the app follows one state ladder. It is written once here because `.input`, `.textarea`, `.select-trigger`, `.input-group`, `.checkbox`, `.radio`, and `.input-color` all implement the same rungs.

| Rung | Treatment | Why |
|------|-----------|-----|
| **Rest** | `border-rule`, no ring, `bg-transparent` | A field at rest is a hairline on the ambient ground. It inherits whatever surface it sits on. |
| **Hover** | `border-rule-strong` — the hairline firms. No ring, no hue. | A field the pointer merely crosses is not active. Amber has to keep meaning "active" to mean anything at all. |
| **Focus** | `border-signal-on` + `ring-3 ring-signal-on/50` | A focused field *is* an active state — one of the three things amber is allowed to mean. |
| **Open / pressed** | `.select-trigger[data-state='open']` gets the same amber as focus; `:active` adds `bg-inset` | `:focus-visible` never fires on a `<button>` clicked by pointer, so a trigger opened by mouse would otherwise show nothing. |
| **Checked** | `bg-signal` + ink glyph (`.checkbox`, `.radio`) | A ticked box means ownership or an active filter. Solid amber, same as `.btn-primary` and `.badge-accent`. |
| **Invalid** | `border-danger` + `ring-3 ring-danger/40` | Terracotta, and it **outranks focus** — focusing a bad field must not repaint it amber and swallow the error. The ring is 40% rather than 20% so it matches the amber ring by weight, not by the number. |
| **Disabled** | `opacity-50`, `pointer-events-none`, `cursor-not-allowed` | One treatment for every control. |

Two rules make this survive editing:

- **Declare states as separate blocks in escalating order.** `.input:hover`, `.input:focus-visible`, `.input[aria-invalid='true']`, and `.input:disabled` are all specificity 0,2,0 — identical — so source order is the only thing deciding the winner. Cramming them into one `@apply` hands the ordering to Tailwind's fixed variant sort instead of to intent.
- **Every colour variant restates its own hover and focus.** `.input-error` alone is 0,1,0 and would lose to `.input:hover` at 0,2,0, so a pre-coloured border would go neutral the moment the pointer touched it.

Text fields have no pressed state — there is nothing to press. `:active` lives on `.btn` and `.select-trigger`.

### Inputs (`.input`)

Base: `h-9`, `rounded-control`, `border border-rule`, `text-body`, `bg-transparent`

| Class | Use |
|-------|-----|
| `.input-error` | Terracotta border and ring; also triggered by `aria-invalid="true"` |
| `.input-ghost` | Borderless at rest — reads as text until you reach for it. Hover reveals the hairline. |
| `.input-color` | Compact `type="color"` swatch trigger (`h-8 w-10`, `rounded-swatch`). Restates the radius on `::-webkit-color-swatch` / `::-moz-color-swatch`, which no utility can reach. |
| `.input-disabled` | Disabled appearance without the `disabled` attribute |

Sizes: `.input-xs` (h-6), `.input-sm` (h-7), `.input-md` (h-9, default), `.input-lg` (h-11, `text-subhead`). `.textarea` mirrors the same scale with `resize: vertical`.

The navbar paint search uses `.input-ghost .input-sm`. Fields floating over artwork (the colour-wheel search) add `bg-canvas` and nothing else — never an ad-hoc focus ring.

### Input Groups (`.input-group`)

The group owns the border, the hover, the focus ring, and the invalid ring for everything inside it; the slotted control is stripped to `border-0 ring-0` so the two never draw competing outlines. That means the group reproduces the same escalation itself: `:hover` firms the hairline, `:focus-within` goes amber, `:has([aria-invalid='true'])` goes terracotta and is declared last. `.input-group-btn` carries no border of its own — only a focus ring, plus `:active` deepening the `.btn-ghost` hover ground so a press registers.

### Checkboxes & Radios (`.checkbox`, `.radio`)

`appearance: none` so the native browser-blue tick never renders. Unchecked: `size-4`, `border border-rule`, `bg-transparent`, `rounded-swatch` (`.radio` is `rounded-full`). Checked: `bg-signal` with an ink glyph drawn as a `background-image` data URI — data URIs cannot read CSS custom properties, so the mark is the literal `--color-ink` (`#0e1013`), which is correct because neither the amber fill nor the ink mark flips with the theme.

Sizes: `.checkbox-xs` (size-3) / `-sm` (size-3.5) / `-md` (size-4, default) / `-lg` (size-5). Filter rows use `.checkbox-sm` beside `text-body`. `.checkbox-error` handles invalid required groups and is declared after `:checked` so the error outranks the fill.

### Comboboxes (`.combobox`)

Autocomplete result panels — paint search, army search, scheme base-colour search.

| Class | Use |
|-------|-----|
| `.combobox` | `relative` positioning root |
| `.combobox-panel` | `absolute` overlay: `rounded-card`, `border-rule`, `bg-panel`, `shadow-overlay` |
| `.combobox-list` | `max-h-72 overflow-y-auto p-1` — carries `role="listbox"` |
| `.combobox-item` | The row itself is the `role="option"`, never a button inside one |
| `.combobox-item-active` | Keyboard highlight (`bg-inset`), declared after `:hover` |
| `.combobox-item-meta` | Right-aligned brand name / owned badge, `text-small text-meta` |
| `.combobox-empty` | "No results" row |
| `.combobox-chip` | Selected-value chip shown in place of the field |

Highlight lives in React state and is announced via `aria-activedescendant`; DOM focus stays in the text field, so rows must not be focusable.

### Browser-Owned Chrome

Four things the app cannot style directly, handled once in `globals.css`:

- `color-scheme: light` / `dark` on `:root` / `.dark` — scrollbars, the `type="color"` picker panel, date pickers, spin buttons, and the autofill dropdown. Without it every one of those stays light-mode in a dark app.
- `caret-color: var(--color-signal-on)` — the caret is the one place amber earns its way into an idle field, because it marks where the next character lands.
- `-webkit-autofill` — Chrome's pale blue fill comes from a UA rule `background-color` cannot beat. `-webkit-background-clip: text` removes the fill entirely, which is right because every field is `bg-transparent` and has no ground to restore.
- `::selection` — amber wash at 35%, **background only**. Setting the colour too would make selected text invisible inside a fixed-light region such as a swatch mount.

### Badges & Data Chips (`.badge`)

Base: `rounded-swatch`, `px-2 py-0.5`, `text-data font-medium`, `bg-inset text-meta`

| Class | Use |
|-------|-----|
| `.badge-primary` | Amber tint — brand/hue name tags on paint cards |
| `.badge-accent` | Solid amber, ink text — owned / active |
| `.badge-soft` | Secondary metadata (paint type, product line) |
| `.badge-outline` | Filter chips in active state |
| `.badge-destructive` | Discontinued paint warning |
| `.chip-data` | Mono uppercase value chip — hex, range, brand code |
| `.badge-delta` | Mono ΔE badge; add `.is-close` for ΔE < 3 (solid amber) |

Sizes: `.badge-xs` / `.badge-sm` / `.badge-md` (default) / `.badge-lg` — `.badge-lg` steps up to `rounded-tile`.

### Labels (`.label-micro`)

`font-mono text-micro uppercase text-meta` — the Undercoat caption. Used for form section labels, dropdown/select group labels, sidebar headings, and any field name above a value. It replaces the old "small bold uppercase" treatment everywhere.

### Navbar (`.navbar`)

`min-h-14`, `border-b border-rule`, `bg-canvas`, `px-4`

- Left: `.navbar-brand` (display face, `text-heading`, amber on hover) + `.navbar-mobile-trigger`
- Center: paint search bar (desktop)
- Right: user menu (avatar + dropdown)

Mobile: search collapses into a sheet. Navigation moves into a slide-in sheet.

### Sidebar (`.sidebar`)

Admin navigation. `w-60`, `border-r border-rule`, `bg-canvas`. Items are `rounded-control text-body`; the section heading is the mono micro-label. Active items take an `inset` background, not an amber fill.

### Skeleton (`.skeleton`)

`animate-pulse rounded-swatch bg-inset` — used during server-side data loading on all route pages. Every data-dependent element must have a skeleton loading state.

---

## 5. Layout Principles

### Page Shell (`.main`)

All route pages wrap content in `.main` with a max-width modifier:

| Class | Max-width | Use |
|-------|-----------|-----|
| `.main-md` | 28rem (448px) | Auth forms, narrow settings |
| `.main-2xl` | 42rem (672px) | Single-column reading, settings |
| `.main-3xl` | 48rem (768px) | Marketing copy blocks |
| `.main-4xl` | 56rem (896px) | Most content pages |
| `.main-5xl` | 64rem (1024px) | Paint explorer, comparison |
| `.main-6xl` | 72rem (1152px) | Wide browse/list pages |
| `.main-container` | Tailwind `container` | Responsive-stepped shells |
| `.main-full` | None | Full-bleed marketing sections |

Padding: `.main-padding` (`px-4 py-12`), `.main-padding-compact` (`px-4 py-8`)

### Grid

Paint grids: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3` for compact swatch grids. Larger cards: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`.

Filter sidebars: `flex gap-6` where sidebar is `w-56 shrink-0` and content takes `flex-1 min-w-0`.

Detail pages: `--spacing-rail` (320px) is reserved as the fixed rail width for a paint/palette detail sidebar — use `w-rail shrink-0`. No page uses it yet; it exists so every detail rail lands on the same width.

### Spacing Scale

Follow Tailwind's default 4px base unit. Key values in practice:

| Use | Value |
|-----|-------|
| Component internal gap | `gap-1.5` (6px) to `gap-4` (16px) |
| Section vertical gap | `space-y-6` (24px) to `space-y-8` (32px) |
| Card padding | `p-6` (24px), `p-4` (16px) compact |
| Page top padding | `py-12` (48px) |
| Navbar height | `min-h-14` (56px) |
| Detail rail | `w-rail` (320px) |

### Whitespace Philosophy

Generous vertical rhythm between sections. Dense inside data tables and paint grids (compact card variant). Never zero padding — even the tightest component has breathing room.

---

## 6. Depth & Elevation

Two shadows. That's the whole system.

| Token | Value | Use |
|-------|-------|-----|
| `shadow-card` | `0 1px 2px rgb(14 16 19 / 0.06)` | Cards. A 1px lift, not a float. |
| `shadow-overlay` | `0 8px 24px rgb(14 16 19 / 0.18)` | Everything floating: dialog, sheet, popover, dropdown, select panel. |
| `--inset-shadow-bottle` | `inset 0 -50px 44px -34px rgb(0 0 0 / 0.5)` | `.swatch-hero` only — the meniscus inside a paint pot. |

| Layer | Class | Light | Dark |
|-------|-------|-------|------|
| Page background | `bg-canvas` | `#f4f5f7` | `#0e1013` |
| Card surface | `bg-panel shadow-card` | `#ffffff` | `#171a20` |
| Chip on a panel | `bg-panel-raised` | `#e9ebef` | `#2b3038` |
| Floating surface | `bg-panel shadow-overlay` | `#ffffff` | `#171a20` |
| Overlay scrim | `bg-black/50` | Dark scrim | Dark scrim |
| Active/hover surface | `bg-inset` | `#f4f5f7` | `#2b3038` |

**Separation is a hairline rule first.** Every panel carries `border border-rule`; the shadow only tells you which side of the rule is on top.

**No decorative shadows.** Shadows communicate elevation, not style.

---

## 7. Do's and Don'ts

### Do

- **Let the swatch lead.** Paint color circles/squares are always the largest visual element on a paint card.
- **Use amber sparingly.** One primary action per screen. Amber is valuable because it's rare, and because it *means* something: measurement, ownership, or active state.
- **Use `.card-mount` for color-subject cards.** A swatch belongs on a light mat in both themes.
- **Use adaptive roles in markup.** `bg-canvas`, `bg-panel`, `text-copy`, `text-meta`, `border-rule`, `text-signal-on` — not ramp steps, not raw Tailwind colors.
- **Reach for a ground-specific role only deliberately.** `text-ink` on an amber fill, `ink-raised` on a fixed dark marketing surface. If you're not overriding the theme on purpose, use the adaptive role.
- **Use mono for anything measured.** Hex codes, ΔE, quantities, prices, brand codes. All tabular.
- **Support dark mode equally.** Every adaptive role has a `.dark` value; keep it correct even though no toggle ships yet.
- **Skeleton every async component.** All data-fetching UI must have a `<Skeleton>` loading state.
- **Defer to the ghost button** in toolbars and tables. Only one primary CTA per view.

### Don't

- **Don't introduce a third hue.** Amber is the only chromatic color; terracotta is the single sanctioned exception, for validation and destructive actions only. No success green, no info blue.
- **Don't use `primary` as the brand color.** `--color-primary` is graphite chrome. The clickable thing is `signal` / `signal-on`.
- **Don't use color for decorative backgrounds.** No tinted hero sections, no gradient fills on non-interactive elements. Color belongs to paint data, not chrome.
- **Don't add `leading-*` or `tracking-*` on top of a type step.** The ramp bakes both in; overriding them breaks the rhythm.
- **Don't use Tailwind's default radii or shadows.** Use the five radius tokens and the two shadow tokens. No third shadow level.
- **Don't nest cards.** No card inside a card.
- **Don't color links amber by default.** Most anchors here wrap whole cards and rows. Inline prose links opt in with `text-signal-on`.
- **Don't use terracotta on text unless it signals an error.** It's reserved for validation and delete flows.
- **Don't add icons unless they aid recognition.** Prefer text labels for actions; icon-only for space-constrained toolbars with clear affordances.
- **Don't mix font families outside their jobs.** Display for headings, sans for body and UI, mono for measured values. A mono paragraph or a display-face button is wrong.

---

## 8. Responsive Behavior

### Breakpoints (Tailwind defaults)

| Name | Width | Strategy |
|------|-------|----------|
| `sm` | 640px | Single-column → two-column grids |
| `md` | 768px | Navbar search visible; sidebar collapses |
| `lg` | 1024px | Three-column grids; filter sidebars docked |
| `xl` | 1280px | Wider explorer layouts |

### Touch Targets

Minimum 44px touch target on interactive elements for mobile. Use `min-h-[44px]` wrapper on small buttons if stacked in lists.

### Navigation

- **Desktop** (≥ `md`): horizontal navbar with docked search bar center, user menu right.
- **Mobile** (< `md`): hamburger trigger opens slide-in sheet. Search bar moves to sheet or collapsible below navbar.

### Paint Grids

- Mobile: 2-column compact swatch grid
- Tablet: 3–4 columns
- Desktop: 4–5 columns for compact, 3 for standard cards

### Filter Sidebar

- **Desktop**: docked left sidebar, `w-56`, persistent
- **Mobile**: hidden behind a "Filters" button → opens a bottom sheet or drawer

### Cards

Card content never truncates paint names — use `truncate` only as a last resort with a tooltip. Swatch size is fixed (`size-8` / `size-10`); text wraps below.

---

## 9. Agent Prompt Guide

### Quick Reference

```
Signal (amber fill):  #ffb020            → bg-signal, text-ink on top
Signal as text:       #a35a00 / #ffb020  → text-signal-on (adapts)
Canvas:               #f4f5f7 / #0e1013  → bg-canvas
Panel:                #ffffff / #171a20  → bg-panel
Text primary:         #1b1e24 / #e2e5ea  → text-copy
Text muted:           #8a919e / #a5abb6  → text-meta
Rule (border):        #e2e5ea / #2b3038  → border-rule
Error:                #a63d21 / #dc7a5c  → text-danger
Swatch mount:         #eceff3 (both)     → .card-mount

Fonts:   Space Grotesk (display) / IBM Plex Sans (body) / IBM Plex Mono (data)
Type:    text-micro 10 · text-data 11.5 · text-small 12.5 · text-body 14.5
         text-subhead 15 · text-heading 19 · text-title 24 · text-display 42
Radius:  rounded-swatch 4 · rounded-control 5 · rounded-tile 6 · rounded-card 8
Shadow:  shadow-card (panels) · shadow-overlay (floating)
```

### Starter Prompts

**New page:**
> "Build a [page name] page for Grimify. Use `.main .main-5xl .main-padding` as the shell. Header uses `<PageHeader>` with a title and optional action (`.btn .btn-primary`). Data cards use `.card .card-body`. Undercoat theme: graphite chrome on `bg-canvas`, hairline `border-rule` separation, amber `signal` reserved for the one primary action. Body copy `text-body`, captions `text-small text-meta`, field labels `.label-micro`."

**Paint card:**
> "Create a paint card component for Grimify. Use `.card .card-compact .card-mount` so the swatch sits on a light mat in both themes. Show the swatch first — `<div className='swatch-circle size-10' style={{ background: paint.hex }} />`. Below: paint name `text-subhead font-medium`, brand `.label-micro`, hex as a `.chip-data`. Collection toggle is `.btn .btn-ghost .btn-xs`, switching to `.btn-accent` when owned."

**Comparison row:**
> "Build a cross-brand match row for Grimify. Left: source `.swatch size-8`. Right: candidate `.swatch size-8`. Between them a `.badge-delta` with the ΔE value, plus `.is-close` when ΔE < 3. Names in `text-body`, brand in `.label-micro`. Row separated by `border-b border-rule`, hover `bg-inset`. All numerals mono and tabular."

**Marketing landing section:**
> "Design a hero section for Grimify's homepage. Use `.hero .hero-content`; add `.hero-dark` for a fixed ink surface. Eyebrow `.hero-eyebrow` (mono micro-label), heading `.hero-title` (display face, `text-title` → `sm:text-display`), subtext `.hero-description`. One amber CTA `.btn .btn-primary .btn-lg`. Feature cards below use `.feature-grid` + `.card .feature-card`. No gradients, no tinted decoration."

**Filter sidebar:**
> "Build a paint filter sidebar for Grimify. Left-docked on desktop (`w-56 shrink-0`), bottom sheet on mobile. Section headings use `.label-micro`. Sections: Brand (checkbox list), Paint Type (checkbox), Tags (`.badge .badge-outline`, `.badge-accent` when active). Clear button `.btn .btn-ghost .btn-sm`. Body text `text-body`."
