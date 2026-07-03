# Paint Gradient Scale

**Epic:** Paint Data & Search
**Type:** Feature
**Status:** Completed
**Branch:** `feature/paint-gradient-scale`
**Merge into:** `main`

## Summary

Add a "gradient scale" section to the paint details page. For a paint that belongs to a
brand-defined color group (e.g., Army Painter Fanatic's **Black & Greys**), the page shows
the group as a dark-to-light scale of swatch bars — styled after the scale icon on the
Army Painter Fanatic Practical Naming Chart (bars increasing in height left→right, with a
triangle marker above the current paint's position). Each position links to that sibling
paint's details page.

The data model and UI component are **brand-agnostic**: groups and ordered member
positions live in new DB tables keyed to any product line, and the component takes generic
props (label, ordered swatch items, current index). Army Painter Fanatic is the first
seeded brand; Citadel, Green Stuff World, etc. can be added later with data only — no code
changes.

### Data source findings (from exploration)

- `scripts/data/paints/army-painter.json` lists the 162 Fanatic acrylics in **official
  chart order**: exactly 27 consecutive runs of 6 (`ap-1`–`ap-162`). Example: `ap-1`–`ap-6`
  = Matt Black → Deep Grey → Uniform Grey → Ash Grey → Company Grey → Brigade Grey, which
  matches the naming chart's Black & Greys scale (Ash Grey at position 4).
- The DB stores these ids as `paints.brand_paint_id` (`'ap-1'`, …), so seed SQL can
  resolve paint UUIDs by joining brand + product line + `brand_paint_id`.
- **Direction is not uniform**: some runs are printed light→dark in the source data
  (e.g., `ap-19` Augur Blue → `ap-24` Triumphant Navy). The seed generator must normalize
  each group to dark→light by relative luminance; gradients are monotonic within a group,
  so sorting by luminance reproduces the official scale order.
- `Fanatic Metallic` (18) and `Fanatic Wash` (17) entries are excluded — they are not part
  of the 6-step colour groups.
- The 27 group display names (e.g., "Black & Greys") are **not** in the JSON; they must be
  transcribed from the naming chart PDF
  (`docs/pdfs/A3_Fanatic_Practical_Naming_Chart_51bee74d-aa6a-4037-9bcc-9cbb0d4489fa.pdf`)
  during implementation.

## Acceptance Criteria

- [x] New tables `paint_gradient_groups` and `paint_gradient_group_members` exist with
      public read-only RLS (mirroring the `paints` table policies).
- [x] Seed migration populates 27 Army Painter Fanatic groups and 162 memberships with
      dark→light positions 1–6; group names match the naming chart.
- [x] Paint details page for a grouped paint (e.g., Ash Grey) shows the gradient scale:
      group name label, 6 swatch bars increasing in height dark→light, triangle indicator
      above the current paint's bar, current bar visually emphasized.
- [x] Non-current positions link to their sibling paint's details page and show the paint
      name as a tooltip; the current position is not a link.
- [x] Paints with no group (Speedpaint, Scale75, metallics, washes, …) render the details
      page unchanged — no gradient section, no errors.
- [x] `GradientScale` component is purely presentational and brand-agnostic: props are
      `label`, `items` (`{ hex, label?, href? }[]`), `currentIndex` — no brand, paint, or
      DB types in its props.
- [x] Component works for any item count (not hardcoded to 6).
- [x] All exports have JSDoc per `CLAUDE.md`; no barrel files; route page stays thin.
- [x] `npm run build` and `npm run lint` pass.

## Implementation

All app code lives in the existing **`paints` module** (`src/modules/paints/`).

### Deviations from the original plan

1. **Chart order is authoritative, not luminance sorting.** The curated JSON
   (`scripts/data/paint-groups/army-painter-fanatic.json`) stores each group's members
   already in official chart order (dark→light). The generator uses relative luminance
   only as a sanity check: it fails if a group runs light→dark overall and warns on local
   inversions while keeping the chart order. One known inversion exists — Deep Greens'
   Eternal Hunt (`#329149`, officially "Very Dark Green") is brighter than its neighbors
   but stays at chart position 1. Deep Green-Blues' JSON id order deviates from the chart
   (`ap-34`/`ap-35` swapped), so its member order is explicitly
   `ap-31, ap-32, ap-35, ap-33, ap-34, ap-36`.
2. **Dual-file seed output.** Locally, `supabase db reset` runs migrations *before*
   `seed.sql`, and Army Painter paints only exist locally via `seed.sql` — so a seed
   migration alone would insert nothing on a fresh local reset. The generator therefore
   emits identical idempotent `INSERT … SELECT … JOIN` statements (which no-op when the
   referenced paints are absent) into **both** the committed migration
   `20260702000001_seed_army_painter_fanatic_gradient_groups.sql` (effective in
   production) and `supabase/seeds/gradient-groups.sql` (effective locally; registered
   after `./seed.sql` in `config.toml`'s `sql_paths`). Regenerate both with
   `npm run db:seed:generate:gradient-groups`.

### Step 1 — Migration: gradient group tables

**`supabase/migrations/<timestamp>_add_paint_gradient_groups.sql`**

```sql
CREATE TABLE public.paint_gradient_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_line_id bigint NOT NULL REFERENCES public.product_lines(id) ON DELETE CASCADE,
  name text NOT NULL,          -- display name, e.g. 'Black & Greys'
  slug text NOT NULL,          -- e.g. 'black-and-greys'
  position integer NOT NULL,   -- group order within the product line (chart order)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_line_id, slug),
  UNIQUE (product_line_id, position)
);

CREATE TABLE public.paint_gradient_group_members (
  group_id uuid NOT NULL REFERENCES public.paint_gradient_groups(id) ON DELETE CASCADE,
  paint_id uuid NOT NULL REFERENCES public.paints(id) ON DELETE CASCADE,
  position integer NOT NULL,   -- 1-based, dark → light
  PRIMARY KEY (group_id, paint_id),
  UNIQUE (group_id, position),
  UNIQUE (paint_id)            -- a paint belongs to at most one group
);
```

Enable RLS on both tables with public `SELECT` policies (copy the pattern used by
`paints`/`product_lines` in `20260413000000_create_paint_tables.sql`). Add an index on
`paint_gradient_group_members (paint_id)` (covered by the UNIQUE constraint) for the
lookup path.

### Step 2 — Seed data: Army Painter Fanatic groups

1. **`scripts/data/paint-groups/army-painter-fanatic.json`** — 27 entries:
   `{ "name": "Black & Greys", "slug": "black-and-greys", "paintIds": ["ap-1", …, "ap-6"] }`.
   Membership and group boundaries are mechanical (consecutive runs of 6 in `ap-id`
   order); **names are transcribed from the naming chart PDF** and verified against it.
2. **`scripts/generate-gradient-group-seed.ts`** — one-off generator (same style as
   `generate-seed.ts`): reads the JSON + `scripts/data/paints/army-painter.json`,
   normalizes each group's member order to dark→light by relative luminance of the hex
   value, and emits the seed migration SQL. Paint UUIDs are resolved at insert time via
   `(SELECT p.id FROM paints p JOIN product_lines pl … WHERE br.slug = 'the-army-painter'
   AND p.brand_paint_id = 'ap-N')`, matching the Scale75 migration pattern.
3. **`supabase/migrations/<timestamp>_seed_army_painter_fanatic_gradient_groups.sql`** —
   the generated output, committed. All inserts use `ON CONFLICT DO NOTHING` so the
   migration is idempotent.

### Step 3 — Types

**`src/modules/paints/types/gradient-scale-item.ts`** — presentational, brand-agnostic:

```ts
type GradientScaleItem = {
  hex: string      // swatch fill color
  label?: string   // tooltip / accessible name (e.g. paint name)
  href?: string    // optional link target for the position
}
```

**`src/modules/paints/types/paint-gradient-group.ts`** — domain shape returned by the
service:

```ts
type PaintGradientGroup = {
  id: string
  name: string
  paints: { id: string; name: string; slug: string; hex: string; position: number }[]
}
```

### Step 4 — Service

**`src/modules/paints/services/paint-service.ts`** — add `getGradientGroupForPaint(paintId: string): Promise<PaintGradientGroup | null>`:

1. Query `paint_gradient_group_members` for `paint_id` → get `group_id` (return `null` if
   none).
2. Fetch the group row plus all members joined to `paints (id, name, slug, hex)`, ordered
   by `position`.

Single round-trip is achievable with one Supabase select from
`paint_gradient_group_members` filtered by group after an initial lookup, or a nested
select from `paint_gradient_groups`; follow whichever pattern reads cleanest next to the
existing queries. Expose it through `paint-service.server.ts` following the existing
server-wrapper pattern.

### Step 5 — `GradientScale` component

**`src/modules/paints/components/gradient-scale.tsx`** — server-compatible presentational
component (no client state needed).

Props: `label: string`, `items: GradientScaleItem[]`, `currentIndex: number`.

Layout (matching the chart icon):

```
            ▼
▁▂ ▃▄ ▅▆ ▇█        ← bars, height ramps min→max left→right
dark  →  light
Black & Greys       ← label (small, muted)
```

- Flex row, `items-end`, small gap. Bar `i` height interpolates between a min and max
  (e.g., 12px → 32px) by `i / (items.length - 1)`; fixed bar width (~14px); slight
  rounding on top corners.
- Bar fill = `item.hex`; add a subtle border/ring so near-white bars stay visible on light
  backgrounds (and near-black on dark).
- Current position: triangle marker (`▼` glyph or CSS triangle) centered above the bar
  plus a primary-colored ring on the bar itself.
- Items with `href` render as `next/link` `<Link>` with `title={item.label}`; the current
  item and items without `href` render as plain `<span>`.
- Accessibility: wrap in a labelled group (`role="group"`, `aria-label` from `label`);
  each position gets an accessible name from `item.label`; current position gets
  `aria-current="true"`.
- Styling via existing Tailwind utilities + theme tokens; no new `src/styles/*.css` file
  is warranted for a one-off component.

### Step 6 — Wire into the details page

1. **`src/app/paints/[id]/page.tsx`** — fetch `getGradientGroupForPaint(id)` alongside the
   existing lookups (it is independent — include it in the existing parallel fetch if one
   exists) and pass `gradientGroup` to `<PaintDetail>`.
2. **`src/modules/paints/components/paint-detail.tsx`** — new optional prop
   `gradientGroup: PaintGradientGroup | null`. When non-null, render a "Gradient" block
   after the hue classification section and before `<PaintSectionsToggle>`, mapping:
   - `label` = `gradientGroup.name`
   - `items` = members → `{ hex, label: name, href: /paints/${id} }` (omit `href` for the
     current paint)
   - `currentIndex` = index of `paint.id` in the ordered members

### Step 7 — Verify

No test framework exists in this project — manual verification:

- `supabase db reset` applies both migrations cleanly; spot-check
  `paint_gradient_group_members` count = 162, groups = 27.
- `/paints/<ash-grey-id>` shows "Black & Greys" with 6 bars, marker on position 4;
  hovering other bars shows sibling names; clicking navigates to the sibling paint, where
  the marker moves accordingly.
- Matt Black (position 1) and Brigade Grey (position 6) render with the marker at the
  extremes.
- A Speedpaint, Fanatic Metallic, and Scale75 paint show no gradient section.
- `npm run build` and `npm run lint` pass.

## Key Files

| Action | File | Description |
|--------|------|-------------|
| Create | `supabase/migrations/<ts>_add_paint_gradient_groups.sql` | Group + membership tables, RLS public read |
| Create | `scripts/data/paint-groups/army-painter-fanatic.json` | 27 group definitions (names from naming chart, `ap-id` members) |
| Create | `scripts/generate-gradient-group-seed.ts` | Generator: JSON → seed SQL, normalizes dark→light order |
| Create | `supabase/migrations/<ts>_seed_army_painter_fanatic_gradient_groups.sql` | Generated seed (27 groups, 162 memberships) |
| Create | `src/modules/paints/types/gradient-scale-item.ts` | `GradientScaleItem` presentational type |
| Create | `src/modules/paints/types/paint-gradient-group.ts` | `PaintGradientGroup` domain type |
| Modify | `src/modules/paints/services/paint-service.ts` | Add `getGradientGroupForPaint` |
| Modify | `src/modules/paints/services/paint-service.server.ts` | Server wrapper for the new query |
| Create | `src/modules/paints/components/gradient-scale.tsx` | Brand-agnostic scale component |
| Modify | `src/modules/paints/components/paint-detail.tsx` | Render gradient section after hue classification |
| Modify | `src/app/paints/[id]/page.tsx` | Fetch gradient group, pass to `PaintDetail` |

## Risks & Considerations

- **Group names require manual transcription.** No PDF tooling is available in the dev
  environment, so the 27 Fanatic group names must be read from the chart by a human (or
  the chart pages shared as images) and verified before the seed is generated. Membership
  and order are mechanical and low-risk.
- **Luminance normalization assumption.** Direction normalization assumes each 6-paint
  group is tonally monotonic. The Black & Greys and skin-tone runs confirm this; the
  generator should fail loudly (not silently reorder) if a group's luminance sequence is
  neither ascending nor descending, so anomalies get human review.
- **`UNIQUE (paint_id)`** encodes "one group per paint." True for Fanatic; if a future
  brand reuses a paint across groups, this constraint must be relaxed and
  `getGradientGroupForPaint` revisited. Deliberate simplification for now.
- **Near-white/near-black bars** can disappear against the page background — the border
  ring in Step 5 mitigates; check both light and dark themes.
- **Fanatic Metallics/Washes** are intentionally out of scope; they are not part of the
  chart's colour groups.
