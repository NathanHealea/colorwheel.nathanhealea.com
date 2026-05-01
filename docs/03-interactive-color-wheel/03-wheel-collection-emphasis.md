# Emphasize Collection Paints on the Color Wheel

**Epic:** Interactive Color Wheel
**Type:** Feature
**Status:** Todo
**Branch:** `feature/wheel-collection-emphasis`
**Merge into:** `v1/main`

## Summary

When a user is authenticated, paint markers on both the Munsell and HSL wheels that belong to their collection are visually emphasized with a distinct ring/halo so they can immediately see where their paints fall in color space. Unauthenticated users see no visual difference.

## Acceptance Criteria

- [ ] Collection paints are visually distinguished on both the Munsell and HSL wheels
- [ ] The emphasis ring scales correctly with zoom (stays the same apparent screen size)
- [ ] Collection paints render on top of non-collection paints so the ring is never obscured
- [ ] Unauthenticated users see no visual difference (no ring, no layout change)
- [ ] Emphasis is compatible with active filters — only visible emphasized markers remain when filters are applied
- [ ] `npm run build` and `npm run lint` pass with no errors

## Key Files

| Action | File | Description |
|--------|------|-------------|
| Modify | `src/modules/color-wheel/components/paint-marker.tsx` | Add `emphasized` prop; render a gold outer ring when true |
| Modify | `src/modules/color-wheel/components/munsell-color-wheel.tsx` | Accept `userPaintIds`; split paint render order; pass `emphasized` to `PaintMarker` |
| Modify | `src/modules/color-wheel/components/hsl-color-wheel.tsx` | Accept `userPaintIds`; split paint render order; pass `emphasized` to `PaintMarker` |
| Modify | `src/modules/color-wheel/components/color-wheel-container.tsx` | Pass `userPaintIds` down to both wheel components |

## Implementation

### 1. Add `emphasized` prop to `PaintMarker`

**File:** `src/modules/color-wheel/components/paint-marker.tsx`

Add `emphasized?: boolean` to the props (defaults to `false`). When true, render an outer ring element behind the paint marker using a gold stroke (`#f59e0b`) to clearly distinguish collection paints from the white stroke on every marker.

For circle markers, add a `<circle>` with `fill="none"`, `stroke="#f59e0b"`, `strokeWidth={2 / zoom}`, and `r={r + 3 / zoom}` — rendered before (behind) the main circle. For diamond (metallic) markers, compute a proportionally larger diamond polygon outline using the same gold stroke.

Wrap both elements in a `<g>` when emphasized so the grouping is explicit:

```tsx
if (emphasized) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 3 / zoom} fill="none" stroke="#f59e0b" strokeWidth={2 / zoom} />
      <circle cx={cx} cy={cy} r={r} {...shared} />
    </g>
  )
}
```

Apply the same pattern for the metallic diamond case.

### 2. Pass `userPaintIds` to both wheel components

**File:** `src/modules/color-wheel/components/color-wheel-container.tsx`

`userPaintIds?: Set<string>` already arrives at `ColorWheelContainer`. Thread it to both wheel components:

```tsx
<MunsellColorWheel paints={filteredPaints} hues={hues} userPaintIds={userPaintIds} />
<HslColorWheel paints={filteredPaints} userPaintIds={userPaintIds} />
```

### 3. Update `MunsellColorWheel`

**File:** `src/modules/color-wheel/components/munsell-color-wheel.tsx`

Add `userPaintIds?: Set<string>` to the component props.

**Render order** — emphasized markers must render on top of non-emphasized ones so the ring is never obscured by a neighboring marker. Split the paint array before rendering:

```tsx
const [ownedPaints, otherPaints] = userPaintIds
  ? [paints.filter((p) => userPaintIds.has(p.id)), paints.filter((p) => !userPaintIds.has(p.id))]
  : [[], paints]
```

Render `otherPaints` first, then `ownedPaints`, each passed to `PaintMarker` with the appropriate `emphasized` value:

```tsx
{otherPaints.map((paint) => (
  <PaintMarker key={paint.id} paint={paint} ... emphasized={false} />
))}
{ownedPaints.map((paint) => (
  <PaintMarker key={paint.id} paint={paint} ... emphasized />
))}
```

When `userPaintIds` is `undefined`, all paints render through `otherPaints` with no emphasis — preserving unauthenticated behavior.

### 4. Update `HslColorWheel`

**File:** `src/modules/color-wheel/components/hsl-color-wheel.tsx`

Identical change to Step 3, applied inside the `<g id="paint-markers">` block.

## Risks & Considerations

- **Ring color contrast.** Gold (`#f59e0b`) reads well against both dark and light sectors. Avoid white (same as the existing marker stroke) or the paint's own hex color.
- **Metallic diamond ring.** The emphasized ring for metallic paints uses a slightly scaled-up diamond polygon with the same gold stroke — keep the scaling factor consistent with the circle case (`r + 3/zoom` maps to `d * 1.4 + 3/zoom` for the diamond half-diagonal).
- **Filter interaction.** Because filtering happens in `ColorWheelContainer` before the `paints` array reaches the wheel, emphasized filtering is automatic — only visible paints are passed down, so only visible collection paints get the ring.
- **Zoom invariance.** The ring strokeWidth and offset both divide by `zoom`, matching the existing marker geometry convention.
- **Empty collection.** When `userPaintIds` is an empty `Set`, `ownedPaints` is `[]` and nothing changes visually — no special case needed.
