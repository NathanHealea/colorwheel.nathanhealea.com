'use client'

import { SearchIcon, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import type { ColorWheelPaint } from '@/modules/color-wheel/types/color-wheel-paint'
import { paintSwatchBackground } from '@/modules/paints/utils/paint-swatch-background'

/**
 * Searchable combobox for selecting a paint from a live-filtered dropdown.
 *
 * Displays a search input; as the user types, up to `maxResults` matching paints
 * appear in a dropdown. Selecting a paint calls `onSelect` and clears the input.
 * The X button clears the query without triggering `onSelect`.
 *
 * @remarks
 * Arrow keys move the highlight, Enter commits it, Escape closes the panel. The
 * highlight is state rather than DOM focus so the caret stays in the text field;
 * `aria-activedescendant` reports the current row to assistive tech.
 *
 * @param props.paints - Full paint list to filter against.
 * @param props.onSelect - Called with the chosen {@link ColorWheelPaint} on selection.
 * @param props.placeholder - Placeholder text for the search input.
 * @param props.maxResults - Maximum number of dropdown results (default: 8).
 */
export function SchemePaintCombox({
  paints,
  onSelect,
  placeholder = 'Search paints by name…',
  maxResults = 8,
  initialQuery = '',
}: {
  paints: ColorWheelPaint[]
  onSelect: (paint: ColorWheelPaint) => void
  placeholder?: string
  maxResults?: number
  /** Pre-fills the search query, e.g. when a selection is cleared mid-typing. */
  initialQuery?: string
}) {
  const [query, setQuery] = useState(initialQuery)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const [selectedPaint, setSelectedPaint] = useState<ColorWheelPaint | null>(null)

  const results =
    query.length > 0
      ? paints.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, maxResults)
      : []

  function handleSelect(paint: ColorWheelPaint) {
    onSelect(paint)
    setSelectedPaint(paint)
    setQuery(paint.name)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleClear() {
    setQuery('')
    setSelectedPaint(null)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }

    if (results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current + 1 >= results.length ? 0 : current + 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1))
      return
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      handleSelect(results[activeIndex])
    }
  }

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <div ref={containerRef} className="combobox">
      <InputGroup>
        <InputGroupAddon>
          {selectedPaint ? (
            <span
              className="inline-block size-5 shrink-0 rounded-swatch border border-rule"
              style={paintSwatchBackground(selectedPaint.hex, selectedPaint.paint_type, selectedPaint.is_metallic)}
              aria-hidden="true"
            />
          ) : (
            <SearchIcon className="size-4" />
          )}
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          placeholder={placeholder}
          value={query}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(e.target.value.length > 0)
            setActiveIndex(-1)
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton aria-label="Clear search" title="Clear" size="icon-xs" onClick={handleClear}>
              <X className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      {open && results.length > 0 && (
        <div className="combobox-panel">
          <ul className="combobox-list" id={listboxId} role="listbox">
            {results.map((paint, index) => (
              <li
                key={paint.id}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn('combobox-item', index === activeIndex && 'combobox-item-active')}
                onClick={() => handleSelect(paint)}
                onMouseMove={() => setActiveIndex(index)}
              >
                <span
                  className="inline-block size-5 shrink-0 rounded-swatch border border-rule"
                  style={paintSwatchBackground(paint.hex, paint.paint_type, paint.is_metallic)}
                  aria-hidden="true"
                />
                <span className="truncate">{paint.name}</span>
                <span className="combobox-item-meta">{paint.brand_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
