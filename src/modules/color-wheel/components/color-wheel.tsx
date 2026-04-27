'use client'

import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'

import type { ColorWheelHue } from '@/modules/color-wheel/types/color-wheel-hue'
import type { ColorWheelPaint } from '@/modules/color-wheel/types/color-wheel-paint'
import { hslToPosition } from '@/modules/color-wheel/utils/hsl-to-position'
import { indexToStartAngle, sectorPath } from '@/modules/color-wheel/utils/sector-path'
import { PaintMarker } from './paint-marker'

const OUTER_RADIUS = 450

/**
 * Interactive SVG color wheel displaying all paints mapped by hue and lightness.
 *
 * The wheel background is divided into Munsell hue sectors (colored with each
 * hue's representative hex) with ISCC-NBS sub-hue divider lines. A radial
 * gradient overlay represents the lightness dimension (white center fading
 * outward). Paint markers are positioned by hue (angle) and lightness (radius).
 *
 * @param paints - All paints to plot on the wheel.
 * @param hues - Top-level Munsell hues with nested ISCC-NBS children, used to
 *   draw sector fills and sub-divider lines.
 */
export function ColorWheel({ paints, hues }: { paints: ColorWheelPaint[]; hues: ColorWheelHue[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredPaint, setHoveredPaint] = useState<ColorWheelPaint | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  function handleHover(paint: ColorWheelPaint | null, event: MouseEvent<SVGElement>) {
    setHoveredPaint(paint)
    if (paint && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = Math.min(event.clientX - rect.left + 12, rect.width - 180)
      const y = Math.min(event.clientY - rect.top + 12, rect.height - 80)
      setTooltipPos({ x: Math.max(0, x), y: Math.max(0, y) })
    }
  }

  return (
    <div ref={containerRef} className="relative mx-auto aspect-square w-full max-w-2xl">
      <svg
        viewBox="-500 -500 1000 1000"
        width="100%"
        height="100%"
        aria-label="Color wheel showing paint collection"
      >
        <defs>
          <radialGradient id="lightness-overlay" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity={0.85} />
            <stop offset="70%" stopColor="white" stopOpacity={0} />
          </radialGradient>
          <clipPath id="wheel-clip">
            <circle cx="0" cy="0" r={OUTER_RADIUS} />
          </clipPath>
        </defs>

        {/* Munsell hue sectors */}
        {hues.map((hue, i) => {
          const start = indexToStartAngle(i, hues.length)
          const end = indexToStartAngle(i + 1, hues.length)
          return (
            <path
              key={hue.id}
              d={sectorPath(start, end, OUTER_RADIUS)}
              fill={hue.hex_code}
            />
          )
        })}

        {/* ISCC-NBS sub-hue divider lines */}
        {hues.map((hue, i) => {
          const sectorStart = indexToStartAngle(i, hues.length)
          const sectorWidth = 360 / hues.length
          return hue.children.map((_, j) => {
            if (j === 0) return null
            const angleDeg = sectorStart + (j / hue.children.length) * sectorWidth
            const angleRad = ((angleDeg - 90) * Math.PI) / 180
            const x = OUTER_RADIUS * Math.cos(angleRad)
            const y = OUTER_RADIUS * Math.sin(angleRad)
            return (
              <line
                key={`${hue.id}-${j}`}
                x1={0}
                y1={0}
                x2={x}
                y2={y}
                stroke="white"
                strokeWidth={0.5}
                strokeOpacity={0.3}
              />
            )
          })
        })}

        {/* Lightness overlay — white center fading outward */}
        <circle cx="0" cy="0" r={OUTER_RADIUS} fill="url(#lightness-overlay)" />

        {/* Paint markers */}
        {paints.map((paint) => {
          const { x, y } = hslToPosition(paint.hue, paint.lightness, OUTER_RADIUS)
          return (
            <PaintMarker
              key={paint.id}
              paint={paint}
              cx={x}
              cy={y}
              onHover={handleHover}
            />
          )
        })}
      </svg>

      {hoveredPaint && (
        <div
          className="card absolute z-10 max-w-[176px] border border-border bg-background px-3 py-2 text-sm shadow-md"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <p className="font-medium leading-tight">{hoveredPaint.name}</p>
          <p className="text-muted-foreground">{hoveredPaint.brand_name}</p>
          <p className="text-muted-foreground">{hoveredPaint.product_line_name}</p>
        </div>
      )}
    </div>
  )
}
