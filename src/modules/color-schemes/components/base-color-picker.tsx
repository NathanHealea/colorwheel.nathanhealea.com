'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { ColorWheelPaint } from '@/modules/color-wheel/types/color-wheel-paint'
import { hexToHsl } from '@/modules/color-wheel/utils/hex-to-hsl'
import type { BaseColor } from '@/modules/color-schemes/types/base-color'

const HEX_RE = /^#?([0-9a-fA-F]{6})$/

type Mode = 'search' | 'custom'

/**
 * Dual-mode color picker for selecting a scheme base color.
 *
 * Supports two input modes toggled by a button group:
 * - **Search Paints** — filters the paint list by name and lets the user pick a paint.
 * - **Custom Color** — accepts a 6-digit hex value and derives HSL via {@link hexToHsl}.
 *
 * @param props.paints - Full paint list to search against.
 * @param props.value - Currently selected base color, or null.
 * @param props.onChange - Called with the new {@link BaseColor} when a selection is made.
 */
export function BaseColorPicker({
  paints,
  value,
  onChange,
}: {
  paints: ColorWheelPaint[]
  value: BaseColor | null
  onChange: (color: BaseColor) => void
}) {
  const [mode, setMode] = useState<Mode>('search')
  const [query, setQuery] = useState('')
  const [hexInput, setHexInput] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = query.length > 0
    ? paints
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
    : []

  function selectPaint(paint: ColorWheelPaint) {
    onChange({
      hue: paint.hue,
      saturation: paint.saturation,
      lightness: paint.lightness,
      hex: paint.hex,
      name: paint.name,
    })
    setQuery('')
    setOpen(false)
  }

  function handleHexChange(raw: string) {
    setHexInput(raw)
    const match = HEX_RE.exec(raw)
    if (!match) return
    const hex = `#${match[1].toLowerCase()}`
    const { h, s, l } = hexToHsl(hex)
    onChange({ hue: h, saturation: s, lightness: l, hex })
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const hexPreviewColor = (() => {
    const match = HEX_RE.exec(hexInput)
    return match ? `#${match[1]}` : null
  })()

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex gap-1">
        <Button
          className={mode === 'search' ? 'btn-primary' : 'btn-ghost'}
          onClick={() => setMode('search')}
        >
          Search Paints
        </Button>
        <Button
          className={mode === 'custom' ? 'btn-primary' : 'btn-ghost'}
          onClick={() => setMode('custom')}
        >
          Custom Color
        </Button>
      </div>

      {mode === 'search' && (
        <div ref={containerRef} className="relative">
          <Input
            type="text"
            placeholder="Search paints by name…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(e.target.value.length > 0)
            }}
            onFocus={() => query.length > 0 && setOpen(true)}
            autoComplete="off"
          />
          {open && results.length > 0 && (
            <ul className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-base-100 shadow-lg">
              {results.map((paint) => (
                <li key={paint.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-base-200"
                    onClick={() => selectPaint(paint)}
                  >
                    <span
                      className="inline-block size-5 shrink-0 rounded border border-border"
                      style={{ backgroundColor: paint.hex }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{paint.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {paint.brand_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {value && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className="inline-block size-4 rounded border border-border"
                style={{ backgroundColor: value.hex }}
                aria-hidden="true"
              />
              {value.name ?? value.hex}
            </p>
          )}
        </div>
      )}

      {mode === 'custom' && (
        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder="#RRGGBB"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            className="max-w-40 font-mono"
          />
          {hexPreviewColor && (
            <span
              className="inline-block size-8 rounded border border-border"
              style={{ backgroundColor: hexPreviewColor }}
              aria-label={`Preview: ${hexPreviewColor}`}
            />
          )}
        </div>
      )}
    </div>
  )
}
