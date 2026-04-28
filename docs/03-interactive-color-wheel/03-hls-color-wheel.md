# HSL Color Wheel

**Epic:** Interactive Color Wheel
**Type:** Feature
**Status:** Todo
**Branch:** `feature/hls-color-wheel`
**Merge into:** `v1/main`

## Summary

Render a second color wheel variant that places paints using raw HSL coordinates — no Munsell sectors, no ISCC-NBS bands. The background is a continuous HSL spectrum disc (conic hue ring with white lightness gradient overlay) so painters get an accurate, perceptually continuous view of where their paints fall in the CSS color space.

## Acceptance Criteria

- [ ] An HSL color wheel is rendered at `/wheel/hls`
- [ ] The wheel background shows the full hue spectrum (0–360°) as a continuous conic gradient ring
- [ ] A white radial gradient overlay fades to transparent from center outward to represent the lightness dimension
- [ ] Every paint is positioned using raw `hslToPosition(paint.hue, paint.lightness, OUTER_RADIUS)` — no ISCC-NBS cell logic
- [ ] Standard paint markers render as circles; metallic paints render as diamonds (reuses `PaintMarker`)
- [ ] Hovering a paint shows a tooltip with paint name, brand, and product line (same pattern as `MunsellColorWheel`)
- [ ] A loading skeleton renders while paint data fetches
- [ ] `npm run build` and `npm run lint` pass with no errors

## Routes

| Route        | Description             |
| ------------ | ----------------------- |
| `/wheel/hls` | HSL color wheel variant |

## Implementation Plan

All new code lives in the existing `src/modules/color-wheel/` module. No new module is needed. The new component reuses `PaintMarker`, `hslToPosition`, and `ColorWheelPaint` from the existing module. No hue data or ISCC-NBS logic is needed.

### Step 1 — HslColorWheel component

Create `src/modules/color-wheel/components/hsl-color-wheel.tsx` as a `'use client'` component:

- **Props:** `paints: ColorWheelPaint[]`
- State: `hoveredPaint: ColorWheelPaint | null`, `tooltipPos: { x: number; y: number }`
- `containerRef` attached to the outer `<div>` for tooltip bounding
- SVG uses `viewBox="-500 -500 1000 1000" width="100%" height="100%"`
- Layer order (bottom to top):
  1. **HSL spectrum ring** — a CSS `conic-gradient` background `<div>` behind the SVG, masked to a circle via `rounded-full`. The gradient covers the full 0–360° hue range: `conic-gradient(hsl(0,80%,55%), hsl(30,80%,55%), hsl(60,80%,55%), hsl(90,80%,55%), hsl(120,80%,55%), hsl(150,80%,55%), hsl(180,80%,55%), hsl(210,80%,55%), hsl(240,80%,55%), hsl(270,80%,55%), hsl(300,80%,55%), hsl(330,80%,55%), hsl(360,80%,55%))`
  2. **Lightness overlay** — SVG `<radialGradient id="lightnessOverlay">` from white at 0% (opacity 0.9) to transparent at 70% radius, applied as `<circle r={450} fill="url(#lightnessOverlay)" />`
  3. **Paint markers** — one `<PaintMarker>` per paint; position computed with `hslToPosition(paint.hue, paint.lightness, 450)` for every paint unconditionally
- Hover handler: converts `clientX/Y` to container-relative coords via `containerRef.current.getBoundingClientRect()`; clamps tooltip position to stay within container bounds
- Tooltip: absolutely-positioned `card`-styled div showing `paint.name`, `paint.brand_name`, `paint.product_line_name`; same structure as in `MunsellColorWheel`

Container layout:
```tsx
<div className="relative aspect-square w-full max-w-2xl mx-auto" ref={containerRef}>
  <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(...)' }} />
  <svg viewBox="-500 -500 1000 1000" width="100%" height="100%" className="relative">
    <defs>
      <radialGradient id="lightnessOverlay" ...>
        <stop offset="0%" stopColor="white" stopOpacity={0.9} />
        <stop offset="70%" stopColor="white" stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle r={450} fill="url(#lightnessOverlay)" />
    {paints.map(paint => {
      const { x, y } = hslToPosition(paint.hue, paint.lightness, 450)
      return <PaintMarker key={paint.id} paint={paint} cx={x} cy={y} onHover={handleHover} />
    })}
  </svg>
  {hoveredPaint && <Tooltip ... />}
</div>
```

### Step 2 — Loading skeleton

Create `src/app/wheel/hls/loading.tsx`:

- Identical to `src/app/wheel/loading.tsx`
- Renders a full-viewport centered pulsing circle: `<div className="mx-auto aspect-square w-full max-w-2xl animate-pulse rounded-full bg-muted" />`

### Step 3 — Page

Create `src/app/wheel/hls/page.tsx` as a server component:

- Fetches `paintService.getColorWheelPaints()` only (no hue service needed)
- Renders `<HslColorWheel paints={paints} />` inside `<main className="flex min-h-screen items-center justify-center p-4">`

### Affected Files

| Action | File                                                             | Description                              |
| ------ | ---------------------------------------------------------------- | ---------------------------------------- |
| Create | `src/modules/color-wheel/components/hsl-color-wheel.tsx`        | HSL color wheel client component         |
| Create | `src/app/wheel/hls/loading.tsx`                                  | Pulsing circle skeleton for `/wheel/hls` |
| Create | `src/app/wheel/hls/page.tsx`                                     | Server component for `/wheel/hls` route  |

### Risks & Considerations

- **Conic gradient browser support**: `conic-gradient` is supported in all modern browsers (Chrome 69+, Firefox 83+, Safari 12.1+). No polyfill needed for the target audience.
- **Marker density at center**: Very light paints (lightness ≈ 90–100%) cluster near the center. The 90% radius cap in `hslToPosition` (`maxRadius * 0.9`) already gives a white gutter; the lightness overlay reinforces this visually.
- **`radialGradient` id collision**: If both `MunsellColorWheel` and `HslColorWheel` ever appear on the same page, their SVG `<defs>` `id` values could collide. Use a unique id (`lightnessOverlay-hsl`) to avoid cross-contamination.
- **No ISCC-NBS jitter**: Without cell-based placement, paints with identical or near-identical HSL values will overlap. This is acceptable for the HSL view — it reflects true color space density. Future work could add a small random jitter seeded on paint ID.
