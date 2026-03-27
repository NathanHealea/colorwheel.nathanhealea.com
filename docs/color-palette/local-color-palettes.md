# Local Color Palettes

**Epic:** Color Palette
**Type:** Feature
**Status:** Todo

## Summary

Browser-local interim implementation of the Color Palette feature. Users can create, edit, and delete color palettes stored in localStorage via a Zustand store with persistence — no authentication, no Supabase, no server-side logic. Palettes live entirely in the browser, matching the existing pattern used by `useCollectionStore` for owned paints. The data model mirrors the full Supabase schema (UUIDs, timestamps, same field names) so palettes can be migrated to the cloud when authentication is implemented.

This feature adds a third sidebar tab ("Palettes") alongside Filters and Collection, a palette detail view for managing paints within a palette, and an "Add to Palette" action in the DetailPanel.

## Acceptance Criteria

- [ ] Palette types defined at `src/types/palette.ts` with fields matching the full feature schema (id, name, description, timestamps)
- [ ] `usePaletteStore` Zustand store at `src/stores/usePaletteStore.ts` with localStorage persistence
- [ ] Users can create a new palette (name required, description optional)
- [ ] Users can rename and update description of an existing palette
- [ ] Users can delete a palette (with confirmation dialog)
- [ ] Users can add a paint to a palette from the DetailPanel ("Add to Palette" button)
- [ ] Users can remove a paint from a palette
- [ ] Users can reorder paints within a palette (up/down buttons)
- [ ] Users can add an optional note to each paint in a palette (e.g., "base coat", "highlight")
- [ ] "Palettes" sidebar tab added to the vertical tab strip alongside Filters and Collection
- [ ] Palette list panel shows all palettes with name, paint count, and tag badges
- [ ] Palette detail view shows ordered paints with color swatch, name, brand, note, and owned indicator
- [ ] Each palette shows owned vs total count ("You own 5/8 paints")
- [ ] Users can create, edit, and delete local tags (name + optional color)
- [ ] Users can assign/remove tags on palettes
- [ ] `SidebarTab` type updated to include `'palettes'`
- [ ] All palette data persists across browser sessions via localStorage
- [ ] Empty state messaging when no palettes exist

## Implementation Plan

### Step 1: Create palette and tag types

**`src/types/palette.ts`** — New file defining the data model. Field names and structure match `docs/color-palette/color-palettes.md` and `docs/color-palette/tags.md` so data can be migrated to Supabase later. Uses `string` IDs (generated via `crypto.randomUUID()`) and ISO timestamp strings.

```typescript
export interface Palette {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface PalettePaint {
  id: string
  palette_id: string
  paint_id: string       // matches ProcessedPaint.id format
  position: number
  note: string | null
  added_at: string
}

export interface Tag {
  id: string
  name: string
  color: string | null
  created_at: string
}

export interface PaletteTag {
  palette_id: string
  tag_id: string
}

export interface PaletteWithPaints extends Palette {
  paints: PalettePaint[]
  tags: string[]         // tag IDs
}
```

### Step 2: Create the palette Zustand store

**`src/stores/usePaletteStore.ts`** — New Zustand store with `persist` middleware using localStorage (same pattern as `useCollectionStore`). Storage key: `'colorwheel-palettes'`.

**State:**
- `palettes: Palette[]`
- `palettePaints: PalettePaint[]`
- `tags: Tag[]`
- `paletteTags: PaletteTag[]`
- `activePaletteId: string | null` — currently viewed palette in sidebar

**Palette actions:**
- `createPalette(name, description?)` — generates UUID, sets timestamps, adds to array
- `updatePalette(id, { name?, description? })` — updates fields and `updated_at`
- `deletePalette(id)` — removes palette, its paints, and its tag associations
- `setActivePalette(id | null)` — sets which palette is shown in detail view

**Paint-in-palette actions:**
- `addPaintToPalette(paletteId, paintId, note?)` — creates PalettePaint at next position; no-op if paint already in palette
- `removePaintFromPalette(paletteId, paintId)` — removes entry, re-indexes positions
- `updatePaintNote(paletteId, paintId, note)` — updates the note field
- `movePaintInPalette(paletteId, paintId, direction: 'up' | 'down')` — swaps position with adjacent paint

**Tag actions:**
- `createTag(name, color?)` — generates UUID, adds to array
- `updateTag(id, { name?, color? })` — updates fields
- `deleteTag(id)` — removes tag and all palette-tag associations
- `addTagToPalette(paletteId, tagId)` — creates PaletteTag association
- `removeTagFromPalette(paletteId, tagId)` — removes association

**Selectors (exported functions):**
- `selectPalettesWithCounts(state)` — returns palettes with paint count and tag IDs
- `selectActivePaletteDetail(state)` — returns active palette with its paints and tags, ordered by position
- `selectPalettesForPaint(state, paintId)` — returns palettes that contain a given paint (for the "Add to Palette" UI)

### Step 3: Update SidebarTab type

**`src/types/paint.ts`** — Add `'palettes'` to the `SidebarTab` union type:

```typescript
export type SidebarTab = 'filters' | 'collection' | 'palettes'
```

### Step 4: Create PalettePanel component

**`src/components/PalettePanel.tsx`** — Main palette sidebar content shown when the "Palettes" tab is active. Two views controlled by `activePaletteId`:

**List view** (when `activePaletteId` is null):
- "Create Palette" button at top that opens an inline form (name input + optional description textarea + "Create" button)
- List of palette cards, each showing:
  - Palette name
  - Paint count badge
  - Tag badges (colored pills)
  - Owned count indicator ("3/5 owned") using `useCollectionStore`
  - Click to set `activePaletteId` and enter detail view
  - Delete button (small X) that triggers confirmation dialog
- Empty state: "No palettes yet. Create one to start organizing your paints."

**Detail view** (when `activePaletteId` is set):
- Back button ("← All Palettes") to return to list view
- Editable palette name (click to edit inline) and description
- Tag management row: existing tag badges with remove (X), "Add Tag" button that opens a dropdown of available tags or inline create
- Owned vs total count: "You own 3/5 paints"
- Ordered list of paints in the palette, each showing:
  - Color swatch (div with backgroundColor)
  - Paint name and brand (icon + name)
  - Owned indicator dot (green if in collection)
  - Note field (click to edit inline, placeholder "Add note...")
  - Up/down reorder buttons
  - Remove button (X icon)
- Empty paint list state: "No paints in this palette. Select a paint on the wheel and click 'Add to Palette'."

### Step 5: Add "Add to Palette" action in DetailPanel

**`src/components/DetailPanel.tsx`** — Add an "Add to Palette" button below the existing "Add to Collection" / "Remove from Collection" button. When clicked, shows a dropdown/popover listing the user's palettes with checkmarks for palettes that already contain this paint. Clicking a palette toggles the paint in/out of that palette.

Uses a Headless UI `Popover` or simple state-driven dropdown. If no palettes exist, the dropdown shows "No palettes — create one in the Palettes tab."

### Step 6: Wire up palette sidebar tab in page.tsx

**`src/app/page.tsx`** — Three changes:

1. Add a "Palettes" button to the vertical tab strip (after Collection), following the same pattern as the existing Filters and Collection buttons.

2. Add a third `<Sidebar>` instance for the palettes tab:
   ```tsx
   <Sidebar isOpen={effectiveTab === 'palettes'} onClose={closeSidebar} title='Palettes'>
     <PalettePanel processedPaints={processedPaints} />
   </Sidebar>
   ```

3. Import `PalettePanel`.

### Affected Files

| File | Changes |
|------|---------|
| `src/types/palette.ts` | New — Palette, PalettePaint, Tag, PaletteTag types |
| `src/types/paint.ts` | Update `SidebarTab` to include `'palettes'` |
| `src/stores/usePaletteStore.ts` | New — palette Zustand store with localStorage persistence |
| `src/components/PalettePanel.tsx` | New — palette list and detail sidebar panel |
| `src/components/DetailPanel.tsx` | Add "Add to Palette" button with palette picker dropdown |
| `src/app/page.tsx` | Add Palettes tab button, Sidebar instance, and PalettePanel import |

### Dependencies

- `useCollectionStore` — for owned paint indicators in palette views
- `ProcessedPaint` type and processed paint data — for resolving paint IDs to display info
- Headless UI — for dropdown/popover in "Add to Palette" UI (already installed)
- `crypto.randomUUID()` — available in all modern browsers, no polyfill needed

### Risks & Considerations

- **localStorage vs IndexedDB:** This plan uses localStorage (matching `useCollectionStore` pattern) rather than IndexedDB. localStorage has a ~5MB limit per origin, which is more than sufficient for palette data (paint IDs are short strings, palette count will be in the dozens). If storage needs grow, the Zustand persist middleware can be swapped to an IndexedDB adapter later without changing the store API.
- **Data migration path:** Field names and structure intentionally mirror the Supabase schema in `docs/color-palette/color-palettes.md`. When authentication is built, a one-time migration can read localStorage data and insert it into Supabase tables. The store can then be swapped to use Supabase as its backend.
- **Paint ID stability:** `PalettePaint.paint_id` uses the same composite ID format as `useCollectionStore` (brand-name-type). If paint IDs change (e.g., from `paint-data-migration.md`), both stores need updating.
- **No projects:** This interim feature is a flat palette list with no project grouping. Projects can be added as a separate local feature later or deferred to the Supabase implementation.
- **Tag scope:** Tags are global (not per-palette) and shared across all palettes. The local tag list is small enough that a flat array in the store is sufficient.
- **Sidebar width:** The existing sidebar is 320px (`w-80`). Palette detail with paint swatches, notes, and reorder buttons needs to fit this width. Use compact layouts (small swatches, truncated names, icon-only buttons).
