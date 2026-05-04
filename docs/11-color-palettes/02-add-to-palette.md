# Add Paints to a Palette — From Anywhere

**Epic:** Color Palettes
**Type:** Feature
**Status:** Todo
**Branch:** `feature/add-to-palette`
**Merge into:** `v1/main`

## Summary

Let users build palettes from anywhere in the app. Three entry points:

1. **Per-paint add**: A new "Add to palette" affordance on `CollectionPaintCard` and the paint detail page.
2. **Bulk-from-scheme**: A "Save scheme as palette" action in the Color Scheme Explorer that creates a palette pre-populated with each scheme color's top paint match.
3. **Bulk-from-search**: A "Add selected to palette" action when multi-selecting paints in any paint grid that supports selection.

Paints can be added whether or not the user owns them (no collection check). Each add appends to the end of the palette and respects the user's most-recently-edited palette as the default target.

## Acceptance Criteria

- [ ] Every `CollectionPaintCard` shows an "Add to palette" action (icon + label or menu item)
- [ ] The paint detail page (`/paints/[id]`) shows the same action
- [ ] The action opens a popover/menu listing the user's existing palettes plus a "Create new palette" option
- [ ] Selecting an existing palette appends the paint at the next position
- [ ] "Create new palette" opens an inline name input, then creates the palette and adds the paint
- [ ] Adding shows a toast with "Added to {palette name}" and a link to view the palette
- [ ] Adding a paint already in the target palette is allowed (the schema permits duplicates)
- [ ] The Color Scheme Explorer adds a "Save as palette" button that, given the active filter state, creates a new palette containing each scheme color's nearest paint match (skipping empty match slots)
- [ ] "Save as palette" prompts for a palette name (defaulting to "{schemeType} from {baseLabel}")
- [ ] Unauthenticated users clicking any add action are redirected to `/sign-in?next={current-path}`
- [ ] All adds preserve order; positions remain `0..N-1` after every mutation
- [ ] `npm run build` and `npm run lint` pass with no errors

## Routes

No new pages. This feature wires entry points into existing routes:

| Route                      | Change                                                  |
| -------------------------- | ------------------------------------------------------- |
| `/paints/[id]`             | Adds `<AddToPaletteButton paintId={id} />`              |
| `/schemes`                 | Adds `<SaveSchemeAsPaletteButton />` to the explorer   |
| `/collection`, `/wheel`, … | `CollectionPaintCard` gains the popover menu item       |

## Module additions

### `src/modules/palettes/`

```
actions/
├── add-paint-to-palette.ts          NEW — append a paint to an existing palette
├── add-paints-to-palette.ts         NEW — append many paints in one transaction
└── create-palette-with-paints.ts    NEW — create + populate in a single action
components/
├── add-to-palette-button.tsx        NEW — popover trigger; shows "+ Add to palette"
├── add-to-palette-menu.tsx          NEW — menu body: list + "Create new palette" footer
└── new-palette-inline-form.tsx      NEW — minimal inline name field
```

### `src/modules/color-schemes/`

```
components/
├── save-scheme-as-palette-button.tsx NEW — opens dialog with name input + confirm
└── (modify) scheme-explorer.tsx      pass the current matches/filters to the button
utils/
└── build-palette-from-scheme.ts      NEW — pure: SchemeColor[] -> { name, paintIds[] }
```

## Key Files

| Action  | File                                                                       | Description                                                          |
| ------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Create  | `src/modules/palettes/actions/add-paint-to-palette.ts`                     | Appends a single `paint_id` to a palette                             |
| Create  | `src/modules/palettes/actions/add-paints-to-palette.ts`                    | Appends an ordered list of `paint_id`s in one transaction            |
| Create  | `src/modules/palettes/actions/create-palette-with-paints.ts`               | Creates a palette and populates it atomically                        |
| Create  | `src/modules/palettes/components/add-to-palette-button.tsx`                | Trigger button + popover wrapper                                     |
| Create  | `src/modules/palettes/components/add-to-palette-menu.tsx`                  | Menu UI: existing palettes + "Create new"                            |
| Create  | `src/modules/palettes/components/new-palette-inline-form.tsx`              | Inline name field used inside the menu                               |
| Modify  | `src/modules/collection/components/collection-paint-card.tsx`              | Mounts `<AddToPaletteButton>` (icon-only on grid, full on detail)    |
| Modify  | `src/app/paints/[id]/page.tsx`                                             | Renders full-width "Add to palette" button next to existing actions  |
| Create  | `src/modules/color-schemes/components/save-scheme-as-palette-button.tsx`   | Composes existing scheme state into a palette                        |
| Modify  | `src/modules/color-schemes/components/scheme-explorer.tsx`                 | Wires `SaveSchemeAsPaletteButton` and forwards `schemeColors`        |
| Create  | `src/modules/color-schemes/utils/build-palette-from-scheme.ts`             | Pure helper that turns `SchemeColor[]` into `{ name, paintIds[] }`   |

## Implementation

### 1. Service additions

In `palette-service.ts`, add:

- `appendPaintToPalette(client, paletteId, paintId, note?)` — reads max position, inserts at `max+1`, returns the new row
- `appendPaintsToPalette(client, paletteId, paintIds[])` — single insert with computed positions; uses an RPC or a transaction to keep order coherent

Both run after the action verifies ownership (RLS enforces too). After insert, callers normalize positions only if they detect a gap (shouldn't happen in append flows).

### 2. Per-paint add — `<AddToPaletteButton>`

Client component with two responsibilities: trigger and popover.

Trigger variants via a `variant` prop:

- `icon` (default for paint cards) — a plus-folder icon button, `btn btn-ghost btn-xs`
- `full` (paint detail page) — `btn btn-soft btn-primary` with label "Add to palette"

The popover body is `<AddToPaletteMenu>`. On trigger click, fetch the user's palettes via a thin client query (use the existing `palette-service.client.ts`). Render:

- A short scrollable list of palettes (name + paint count)
- "Create new palette" footer that toggles `<NewPaletteInlineForm>` inside the popover

Both paths call a server action; on success, close the popover and toast "Added to {palette name}" with a "View" link to `/palettes/{id}`.

`AddToPaletteMenu` must:

- Loading state while fetching palettes
- Empty state ("You don't have any palettes yet — create your first one")
- Error state with retry

For unauthenticated users the trigger should redirect to `/sign-in?next={current-path}` rather than render a popover. Reuse the same redirect handling pattern as `CollectionToggle`.

### 3. Wiring into `CollectionPaintCard`

Add the icon-variant button to the paint card. Position:

- Sits next to the existing collection toggle in the card's action row
- `pointer-events-auto` and `stopPropagation()` on click so it doesn't trigger the underlying `<Link>` from `PaintCard`

The card will now have two affordances: collection toggle (existing) and add-to-palette (new). Verify visual density at `xs` and `sm` card sizes.

### 4. Wiring into the paint detail page

`/paints/[id]/page.tsx` adds `<AddToPaletteButton variant="full" paintId={id} />` next to the existing collection toggle.

### 5. Save scheme as palette

`SaveSchemeAsPaletteButton` lives next to the scheme type selector or in the explorer's header.

Behavior:

1. Disabled when the active scheme has zero matches (e.g., filters eliminated all candidates)
2. On click, opens a dialog with a name input pre-filled from `build-palette-from-scheme.ts` (e.g., "Triadic from Cobalt Blue")
3. Confirm calls `createPaletteWithPaints` with `{ name, paintIds }` where `paintIds` is the top match per scheme color (skipping any color whose `nearestPaints` is empty)
4. On success, redirect to `/palettes/{id}/edit` so the user can immediately curate

`build-palette-from-scheme.ts` is a pure helper:

```ts
export function buildPaletteFromScheme(scheme: SchemeColor[], baseLabel: string, schemeType: ColorScheme): {
  name: string
  paintIds: string[]
}
```

Skips empty match slots; the scheme color's hue still matters for naming, but only colors with a top match contribute paint IDs.

### 6. Action implementation notes

`addPaintToPalette(paletteId, paintId)`:

1. `getSession()`, redirect to sign-in if unauthenticated
2. Service call (RLS enforces ownership)
3. `revalidatePath('/palettes/{id}')` and `revalidatePath('/palettes/{id}/edit')`
4. Returns `{ ok: true, palette: { id, name } }` so the toast can show context

`addPaintsToPalette(paletteId, paintIds)`:

- Same as above but takes an array; service runs a single insert with computed `position` values

`createPaletteWithPaints({ name, description?, paintIds })`:

1. Validates name
2. Creates palette
3. Appends paints in one go
4. Redirects to `/palettes/{id}/edit`

### 7. Default-target heuristic

The "Add to palette" menu's default highlighted palette is the user's most-recently-edited (already first in the dashboard ordering — `updated_at desc`). No persisted "last used" — the implicit ordering already conveys it.

### 8. Manual QA checklist

- Add a paint from a paint card → toast appears, palette count increments on the dashboard
- Add the same paint twice → both rows persist, palette swatches show duplicates
- "Create new palette" inline → palette is created and the paint added; dashboard shows it
- From a paint card with no palettes → menu shows the empty state with a single "Create new" CTA
- Generate a complementary scheme, click "Save as palette" → name pre-fills, confirm lands on the edit page with the palettes' paints in scheme order
- Apply a brand filter that wipes all matches → "Save as palette" disables
- Sign out, click any "Add to palette" → redirects to sign-in with `next` set
- `npm run build` + `npm run lint`

## Risks & Considerations

- **Card density**: Two compact action buttons on the paint card (collection toggle + add-to-palette) start to crowd small cards. The icon-only variant + a tooltip keeps it manageable; if it gets worse, collapse both into a single overflow menu.
- **Race on append**: Appending uses `max(position) + 1` per call. Two simultaneous appends could collide at the same position; the composite PK will reject the second one. The action should retry once on `unique_violation` before surfacing the error. Keep this transparent to callers.
- **Stale palette list in popover**: After a "Create new" the popover should optimistically include the new palette. Easiest approach: re-fetch on success.
- **Scheme save default name**: "Triadic from Cobalt Blue" requires the explorer to expose `baseLabel` (paint name when chosen from a paint, hex string otherwise). The base color picker already tracks this.
- **Multi-add from grid (out of scope for v1)**: The acceptance criteria mentions a bulk-add from selection grids, but no current grid supports multi-select. Defer until a "Compare/select" mode lands; the action `addPaintsToPalette` is built so that future mode can plug in without new server work. Note this as deferred in the PR description.

## Notes

- Reordering inside the popover (or after add) is **not** part of this feature — see `03-palette-reorder.md`.
- Editing the per-slot `note` is **not** part of this feature; v1 leaves notes blank on add. A follow-up can add an inline note editor on the palette builder list rows.
- "Save as palette" replaces the deferred acceptance item in `docs/05-color-scheme-explorer/02-scheme-to-paints.md`. Once this lands, mark that checkbox `[x]`.
