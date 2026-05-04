# Palette Hue-Locked HSL Swap

**Epic:** Color Palettes
**Type:** Feature
**Status:** Todo
**Branch:** `feature/palette-hue-swap`
**Merge into:** `v1/main`

## Summary

Inside the palette builder, let users replace any paint in a slot with a different paint that shares the same hue but has different saturation or lightness. The picker presents same-hue paints sorted by perceptual distance from the current slot color, with optional saturation and lightness range filters. Clicking a candidate swaps the slot's `paint_id` and re-renders the strip.

This delivers the user's "change colors based on saturation and lightness, keeping the same hue" requirement without needing custom hex inputs — every candidate is still a real paint in the database, so the palette remains a list of paints (not a list of mixed colors).

## Acceptance Criteria

- [ ] Each row in the palette builder has a "Swap by hue" affordance (icon + label or menu item)
- [ ] Clicking it opens a modal/popover showing same-hue candidate paints
- [ ] Candidates are filtered to paints in the **same Munsell hue group** as the current slot's paint
- [ ] Candidates are ranked by perceptual distance (CIE76 ΔE) to the current slot's hex
- [ ] Saturation and lightness sliders narrow the candidate set (S range, L range, both default to full)
- [ ] An "Owned only" toggle filters to the user's collection (visible because the user is signed in)
- [ ] A live legend shows the current slot's hue/sat/lightness; the candidate list updates as sliders move
- [ ] Selecting a candidate replaces the slot's `paint_id` (not the position); the swatch strip and row update immediately
- [ ] If the current slot's paint has no hue group (edge case), the swap is disabled with an explanatory tooltip
- [ ] `npm run build` and `npm run lint` pass with no errors

## Module additions

```
src/modules/palettes/
├── actions/
│   └── swap-palette-paint.ts             NEW — replaces a slot's paint_id
├── components/
│   ├── palette-swap-button.tsx           NEW — trigger for the swap UI
│   ├── palette-swap-dialog.tsx           NEW — modal/popover with candidate grid
│   ├── palette-swap-candidate-card.tsx   NEW — single candidate tile with swatch + ΔE badge
│   └── palette-swap-sliders.tsx          NEW — S range + L range dual-thumb sliders
└── utils/
    ├── filter-paints-by-hue-group.ts     NEW — gates candidates by hue group
    ├── rank-paints-by-delta-e.ts         NEW — same as scheme matcher; reuses delta-e
    └── filter-paints-by-hsl-range.ts     NEW — keeps paints whose S/L falls in [min,max]
```

## Key Files

| Action | File                                                                | Description                                                              |
| ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Create | `src/modules/palettes/actions/swap-palette-paint.ts`                | Updates `palette_paints.paint_id` for a slot                             |
| Create | `src/modules/palettes/components/palette-swap-button.tsx`           | Icon-only button on each row; "Swap by hue"                              |
| Create | `src/modules/palettes/components/palette-swap-dialog.tsx`           | Modal with sliders, owned toggle, candidate grid                         |
| Create | `src/modules/palettes/components/palette-swap-candidate-card.tsx`   | Reuses `CollectionPaintCard`; overlays `ΔE n.n`                          |
| Create | `src/modules/palettes/components/palette-swap-sliders.tsx`          | Daisy-style range sliders (`input range`); dual-thumb via two inputs     |
| Create | `src/modules/palettes/utils/filter-paints-by-hue-group.ts`          | Returns paints sharing a Munsell hue group                               |
| Create | `src/modules/palettes/utils/filter-paints-by-hsl-range.ts`          | Filters by S range and L range                                           |
| Create | `src/modules/palettes/utils/rank-paints-by-delta-e.ts`              | Wraps `findMatchingPaints`-style ranker; returns ordered ΔE list         |
| Modify | `src/modules/palettes/components/palette-paint-row.tsx`             | Mounts `<PaletteSwapButton>` next to the existing remove + drag handle   |

## Implementation

### 1. "Same hue" definition

The Munsell-hue refactor in `02-paint-data-search/04-munsell-hue-refactor.md` already gives every paint a hue assignment. Use whichever existing field/relation it lands on (likely a `hue_id` on `paints` or a linked row in a `paint_hues` table — confirm at implementation time). "Same hue" means **same hue group**, not "same hue spoke". Examples: a "Blue" hue group includes its tints and shades; a "Yellow-Green" group includes its tints and shades.

`filterPaintsByHueGroup(currentPaint, allPaints)` returns paints whose hue group matches the current paint's hue group. If the current paint has no hue assigned, the function returns an empty array — the swap UI handles this by disabling the trigger.

### 2. Sat/light filtering

Each paint already exposes `hex`. Convert to HSL once via `hexToHsl` (already in `color-wheel/utils`). `filterPaintsByHslRange(paints, { sMin, sMax, lMin, lMax })` keeps paints whose `s ∈ [sMin, sMax]` and `l ∈ [lMin, lMax]`.

The slider component renders two dual-thumb ranges:

- **Saturation**: 0–100, default `[0, 100]`
- **Lightness**: 0–100, default `[0, 100]`

Both also display the current slot's value as a tick mark on the slider track so users can see where they're starting.

### 3. Ranking

After the hue and HSL filters narrow the set, `rankPaintsByDeltaE(target.hex, candidates, limit)` orders by ΔE76 (reuse `hex-to-lab.ts` and `delta-e.ts` from `color-wheel/utils/`, already shipped by `02-scheme-to-paints`). Default limit `40` — high enough that sliders rarely cut the result to zero, low enough to keep render cheap.

### 4. Trigger and dialog

`PaletteSwapButton`:

- Lives on each `PalettePaintRow` next to the remove button and drag handle
- Disabled (greyed) when the current paint has no hue group; tooltip explains why
- Click opens `<PaletteSwapDialog>` rooted at the row's slot id

`PaletteSwapDialog`:

- Header: current slot's swatch + paint name + "Hue group: {group}"
- Sliders: `<PaletteSwapSliders>`
- Filters row: "Owned only" toggle (default off), "Brand" multi-select (optional v1; defer if it crowds)
- Body: scrollable grid of `<PaletteSwapCandidateCard>`s
- Footer: cancel + close on selection

State lives in the dialog (not the row): `{ sRange, lRange, ownedOnly }`. Computing the candidate list:

```
candidates = pipe(
  allPaints,
  filterPaintsByHueGroup(currentPaint),
  filterPaintsByHslRange({ sRange, lRange }),
  ownedOnly ? filter(p => ownedIds.has(p.id)) : identity,
  rankPaintsByDeltaE(currentPaint.hex, _, 40)
)
```

### 5. Selection behavior

Clicking a candidate calls `swapPalettePaint(paletteId, slotId, newPaintId)`:

1. Verifies ownership (RLS too)
2. `UPDATE palette_paints SET paint_id = $1 WHERE slot_id = $2`
3. `revalidatePath('/palettes/{id}/edit')`
4. Returns `{ ok: true }`; the dialog closes and the row re-renders with the new paint

The slot's `position`, `note`, and `slot_id` are preserved — only `paint_id` changes. This is important for any downstream features that reference slot identity (e.g., recipe step paints).

### 6. Loading / empty states

- While `allPaints` for the wheel are not yet loaded, show a skeleton candidate grid
- If filters narrow to zero results, show a single muted line: "No same-hue paints match these ranges. Try widening saturation or lightness."
- If owned-only is on but the user owns nothing in this hue group, the empty state mentions the owned filter explicitly

### 7. Where the candidate list comes from

The dialog needs the full paint set (not just owned). Reuse the same loader path the wheel uses — most likely a server-fetched, cached `getColorWheelPaints` already exposed through the wheel module. Pass the result down through the builder so the dialog doesn't re-fetch per row.

### 8. Manual QA checklist

- Open the swap dialog on a blue paint — only blue-group paints render
- Move sat slider to `[0, 30]` — only desaturated blues remain; ΔE values rise as candidates drift
- Move lightness slider to `[60, 100]` — only light blues remain
- Toggle "Owned only" — narrows further; numbers shrink
- Select a candidate — row updates instantly; refresh confirms persistence
- Try the swap on a paint with no hue assigned — button is disabled with tooltip
- Saving same paint as before is a no-op (allow it; user gesture, no error)
- `npm run build` + `npm run lint`

## Risks & Considerations

- **Hue group field is not yet stable**: The Munsell hue refactor sets the data shape this feature relies on. Confirm at implementation time which column/relation surfaces the hue group, and adjust the filter helper accordingly. If it changes mid-flight, only `filterPaintsByHueGroup` needs updating.
- **Dual-thumb sliders without a library**: Daisy + Tailwind doesn't ship a native two-thumb range. The simplest approach is two `<input type="range">` overlapping, with custom track CSS. If that gets fiddly, drop in a single tiny dependency (e.g., `react-range`) — keep the swap behind that import boundary.
- **Performance**: Hue + HSL filters + Lab conversion run client-side over the full paint set per slider movement. Cache `hexToLab(paint.hex)` per paint with a simple `Map` keyed by paint id — avoids re-computing Lab per slider tick.
- **"Same hue" ambiguity**: A user might expect "same hue" to mean "exact hue spoke" (e.g., 7.5R in Munsell). v1 uses the broader hue **group** because the existing UI talks in groups (Itten/Munsell wheel segments). If feedback says it's too loose, add a "Strict hue" toggle in a v2.
- **Slot identity preservation**: Swapping `paint_id` keeps the slot stable — important for `recipe_step_paints` (Epic 12), where a recipe step references a `palette_slot_id`. If we ever change the swap to delete + reinsert, that breaks the recipe linkage; keep the in-place update.
- **Off-database custom colors (deferred)**: True painter intent is sometimes "I want this exact custom mix." That requires a `custom_hex` column and is explicitly out of scope here — see the `00-palette-schema` "Future custom hex slots" note.

## Notes

- This feature depends on `00-palette-schema` (need slot ids, which were added in `03-palette-reorder`'s migration). Sequence: 00 → 01 → 02 → 03 → 04.
- The Munsell hue group lookup is shared with the color-wheel module — keep the helper in `palettes/utils/` for now; if Cross-Brand Comparison or another feature needs the same filter, promote it to `color-wheel/utils/`.
- Color-math primitives (`hexToLab`, `deltaE76`) are already shipped by `02-scheme-to-paints`. No new color math needed here.
