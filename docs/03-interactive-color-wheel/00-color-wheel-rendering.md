# Color Wheel Rendering and Paint Mapping

**Epic:** Interactive Color Wheel
**Type:** Feature
**Status:** Todo
**Branch:** `feature/color-wheel-rendering`
**Merge into:** `v1/main`

## Summary

Render an interactive color wheel that maps paints by hue (angle) and lightness (radius), giving painters a spatial view of available colors.

## Acceptance Criteria

- [ ] A color wheel is rendered on the page using Canvas or SVG
- [ ] Paints are plotted as dots/markers on the wheel based on their hue and lightness
- [ ] Hue determines the angular position (0-360 degrees)
- [ ] Lightness determines the radial position (lighter = closer to center)
- [ ] The wheel is responsive and scales to the viewport
- [ ] Paint markers show a tooltip or popover with paint name and brand on hover/tap
- [ ] The wheel loads paint data from the database
- [ ] `npm run build` and `npm run lint` pass with no errors

## Routes

| Route           | Description           |
| --------------- | --------------------- |
| `/` or `/wheel` | Main color wheel view |

## Key Files

| Action | File                                                         | Description                                  |
| ------ | ------------------------------------------------------------ | -------------------------------------------- |
| Create | `src/components/color-wheel/color-wheel.tsx`                 | Main color wheel component                   |
| Create | `src/components/color-wheel/paint-marker.tsx`                | Individual paint dot on the wheel            |
| Create | `src/modules/color/color-math.ts`                            | HSL to polar coordinate conversion utilities |
| Create | `src/app/(main)/page.tsx` or `src/app/(main)/wheel/page.tsx` | Page hosting the wheel                       |

## Implementation

### 1. Color math utilities

Functions to convert HSL values to polar coordinates for wheel placement:

- `hslToPosition(hue, saturation, lightness, radius)` — returns `{ x, y }` for placing a paint on the wheel
- Hue maps to angle, lightness maps to distance from center

### 2. Color wheel component

A Canvas or SVG-based wheel with:

- Background gradient showing the color spectrum (hue around the circumference)
- Paint markers rendered as small colored circles at their computed positions
- Responsive sizing via container queries or viewport units

### 3. Paint markers

Each marker represents a paint, rendered with its hex color as background. On hover/tap, shows paint name, brand, and product line.

### 4. Data loading

Server component fetches all paints (or paginated subset) with their HSL values and passes to the wheel component.

## Notes

- Consider Canvas for performance with thousands of paints; SVG for simpler interactivity with fewer paints.
- The wheel is the core visual differentiator of the app — performance and visual clarity are critical.
- Metallic paints may need a distinct marker style (e.g., shimmer effect or different shape).

## Implementation Plan

All color wheel code lives in a new domain module: `src/modules/color-wheel/`. Components belong there, not in `src/components/color-wheel/` as originally noted in Key Files.

The wheel uses a CSS `conic-gradient` + `radial-gradient` background (no canvas library needed) with an SVG overlay for interactive paint markers. An SVG `viewBox="-500 -500 1000 1000"` with `width="100%" height="100%"` handles responsiveness without JavaScript resize tracking.

### Step 1 — Color wheel type

Create `src/modules/color-wheel/types/color-wheel-paint.ts`:

- `ColorWheelPaint` — lightweight projection of paint data needed by the wheel: `id`, `name`, `hex`, `hue`, `saturation`, `lightness`, `is_metallic`, `brand_name`, `product_line_name`
- Used by the service method, SVG component, and tooltip

### Step 2 — Color math utility

Create `src/modules/color-wheel/utils/hsl-to-position.ts`:

- `hslToPosition(hue, lightness, maxRadius)` → `{ x: number; y: number }`
- Hue maps to angle: `theta = (hue - 90) * (Math.PI / 180)` (−90° puts hue 0° at the top)
- Lightness maps to radius: `r = (1 - lightness / 100) * maxRadius` (100% lightness = center, 0% = outer edge)
- Returns `{ x: r * Math.cos(theta), y: r * Math.sin(theta) }` in SVG coordinate space

### Step 3 — Paint service method

Add `getColorWheelPaints(): Promise<ColorWheelPaint[]>` to `src/modules/paints/services/paint-service.ts`:

- Selects `id, name, hex, hue, saturation, lightness, is_metallic` plus `product_lines!inner(name, brands!inner(name))`
- Filters `is_discontinued = false`
- Orders by `hue` ascending
- Maps to `ColorWheelPaint[]` (flattens brand_name and product_line_name from nested join)
- Must also import `ColorWheelPaint` from the color-wheel types file

### Step 4 — PaintMarker component

Create `src/modules/color-wheel/components/paint-marker.tsx`:

- **Props:** `paint: ColorWheelPaint`, `cx: number`, `cy: number` (pre-computed SVG position), `onHover: (paint: ColorWheelPaint | null, event: MouseEvent) => void`
- Renders an SVG `<circle>` at `(cx, cy)` with `r={5}`, `fill={paint.hex}`, stroke for contrast
- Metallic paints: render an SVG `<polygon>` (diamond shape) instead of a circle, same fill
- Calls `onHover(paint, event)` on `onMouseEnter`, `onHover(null, event)` on `onMouseLeave`
- No tooltip logic here — marker is a pure presentation element

### Step 5 — ColorWheel component

Create `src/modules/color-wheel/components/color-wheel.tsx` as a `'use client'` component:

- **Props:** `paints: ColorWheelPaint[]`
- State: `hoveredPaint: ColorWheelPaint | null`, `tooltipPos: { x: number; y: number }`
- Container structure:
  ```
  <div className="relative aspect-square w-full max-w-2xl mx-auto">
    <div className="absolute inset-0 rounded-full [wheel background gradient]" />
    <svg viewBox="-500 -500 1000 1000" width="100%" height="100%" className="absolute inset-0">
      {paints.map(paint => <PaintMarker ... />)}
    </svg>
    {hoveredPaint && <TooltipPopover paint={hoveredPaint} pos={tooltipPos} />}
  </div>
  ```
- Wheel background uses two layered CSS gradients (via Tailwind `[background:...]` escape or inline style):
  1. `radial-gradient(circle, rgba(255,255,255,0.85) 0%, transparent 65%)` — lightness zone (white center)
  2. `conic-gradient(hsl(0deg,70%,50%), hsl(60deg,70%,50%), hsl(120deg,70%,50%), hsl(180deg,70%,50%), hsl(240deg,70%,50%), hsl(300deg,70%,50%), hsl(360deg,70%,50%))` — hue spectrum
- Computes each paint's SVG position by calling `hslToPosition(paint.hue, paint.lightness, 450)` during render
- Tooltip renders as an absolutely positioned div (top/left from `tooltipPos`) showing paint name, brand name, and product line name; uses existing `card` styles
- `handleHover(paint, event)`: converts the mouse event's `clientX/Y` to container-relative coords via `getBoundingClientRect`, stores in `tooltipPos`

### Step 6 — Home page

Update `src/app/page.tsx` to a server component that:

1. Imports `createServerClient` from `@/lib/supabase/server` and `createPaintService` from the paint service server wrapper
2. Calls `paintService.getColorWheelPaints()` to fetch all non-discontinued paints
3. Passes the result to `<ColorWheel paints={paints} />`
4. Wraps in a `<main>` with full-viewport height and centered layout

### Affected Files

| Action | File | Description |
|--------|------|-------------|
| Create | `src/modules/color-wheel/types/color-wheel-paint.ts` | `ColorWheelPaint` type |
| Create | `src/modules/color-wheel/utils/hsl-to-position.ts` | HSL → SVG position math |
| Create | `src/modules/color-wheel/components/paint-marker.tsx` | Individual paint dot (SVG circle/diamond) |
| Create | `src/modules/color-wheel/components/color-wheel.tsx` | Main wheel client component |
| Modify | `src/modules/paints/services/paint-service.ts` | Add `getColorWheelPaints()` method |
| Modify | `src/app/page.tsx` | Fetch paints and render `ColorWheel` |

### Risks & Considerations

- **Performance**: With thousands of paints, SVG can degrade. If the paint count exceeds ~2,000, consider clustering nearby markers by hue band or adding a paint-count threshold that switches to a density heatmap.
- **Lightness mapping**: Pure whites (lightness ≈ 95-100%) and pure blacks (lightness ≈ 0-5%) cluster at center and outer edge respectively. These zones may look sparse — consider capping radius to 90% of max to leave a white gutter.
- **Tooltip positioning**: The tooltip must not overflow the viewport. Add bounds-clamping when computing tooltip top/left from mouse coords.
- **Metallic marker shape**: The diamond polygon needs to be sized consistently with the circle radius so both read at the same visual weight.
