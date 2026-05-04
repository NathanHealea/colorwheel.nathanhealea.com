# Palette Reorder — Drag and Drop

**Epic:** Color Palettes
**Type:** Feature
**Status:** Todo
**Branch:** `feature/palette-reorder`
**Merge into:** `v1/main`

## Summary

Let users reorder paints inside a palette by dragging rows in the builder. Order is persisted in the `palette_paints.position` column (already part of the schema). Drag-and-drop is keyboard accessible, works on touch, and tolerates network failure with optimistic UI + rollback.

## Acceptance Criteria

- [ ] Each row in the palette builder is draggable
- [ ] Dropping a row updates the visible order immediately (optimistic)
- [ ] The new order is persisted via a single server action; positions are renumbered to `0..N-1`
- [ ] If the persistence call fails, the list snaps back to its previous order and shows an error toast
- [ ] Keyboard reorder is supported: focus a row, press space to "lift", arrow keys to move, space to drop, escape to cancel
- [ ] Touch reorder works on a phone (long-press to start drag)
- [ ] The horizontal swatch strip on the read view reflects the saved order
- [ ] Drag handles are visually distinct on hover and accessible (`aria-grabbed` / `aria-roledescription="draggable"`)
- [ ] Reordering is disabled (rows non-draggable) on the read-only `/palettes/[id]` page
- [ ] `npm run build` and `npm run lint` pass with no errors

## Module additions

```
src/modules/palettes/
├── actions/
│   └── reorder-palette-paints.ts        NEW
├── components/
│   ├── (modify) palette-paint-list.tsx   wraps list in DnD context, handles state
│   ├── (modify) palette-paint-row.tsx    becomes a draggable item with a handle
│   └── palette-drag-handle.tsx           NEW — six-dot grip icon button
└── utils/
    └── reorder-array.ts                  NEW — pure helper, immutable splice
```

## Key Files

| Action | File                                                              | Description                                                              |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Create | `src/modules/palettes/actions/reorder-palette-paints.ts`          | Accepts a palette id + ordered paint position list, persists in one call |
| Create | `src/modules/palettes/components/palette-drag-handle.tsx`         | Visual grip; becomes the keyboard target                                 |
| Create | `src/modules/palettes/utils/reorder-array.ts`                     | `reorderArray(items, fromIndex, toIndex)` — pure                         |
| Modify | `src/modules/palettes/components/palette-paint-list.tsx`          | Wraps list in `<DndContext>`; owns local order state + persistence       |
| Modify | `src/modules/palettes/components/palette-paint-row.tsx`           | Renders the handle, applies `useSortable` transforms                     |
| Modify | `src/modules/palettes/services/palette-service.ts`                | `reorderPalettePaints(client, paletteId, orderedPaletteSlotIds)` helper  |
| Add    | `package.json`                                                    | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` deps          |

## Implementation

### 1. Library choice — dnd-kit

Use `@dnd-kit/core` + `@dnd-kit/sortable`. Reasons:

- First-class keyboard accessibility (`KeyboardSensor`) and built-in screen reader announcements
- Touch + pointer + keyboard sensors out of the box
- Active maintenance + small bundle (~15kb gzipped)
- Already a common React ecosystem default

Alternative considered: `react-beautiful-dnd` — unmaintained, larger, no first-class keyboard story. Skip.

### 2. Stable row identity

Drag-and-drop libraries need a stable per-row id. The `(palette_id, position)` PK rotates on reorder, so we don't use it as the DnD id.

Two options:

- **A** — Add a `slot_id uuid` column on `palette_paints` keyed off `gen_random_uuid()` and use that as the DnD id (and as the persistence key going forward). Stable across reorders.
- **B** — Use `paintId + positionAtMount` as the DnD id and persist by sending the new full ordered list of `paintId`s.

Pick **A**: tighter, supports duplicates of the same `paintId` cleanly, and gives later features (per-slot photos, per-slot notes) a stable foreign key target. Add the column in this feature's migration with a backfill that gives existing rows a fresh uuid each. Update the composite key model accordingly: keep the composite PK on `(palette_id, position)` for ordering integrity, but add a `UNIQUE (slot_id)` constraint so DnD ids stay unique application-wide.

### 3. Reorder action

`reorderPalettePaints(paletteId, orderedSlotIds: string[])`:

1. Verify ownership
2. In a transaction, update each slot's `position` to its new index in `orderedSlotIds`
   - Use a two-phase update or a temp negative-position trick to avoid violating the PK during the swap (e.g. `UPDATE … SET position = position - 1000` on all matching rows first, then re-set to final positions)
3. Validate that every slot id maps to a row in this palette and that no extra rows are missing — reject with a 400-style error otherwise
4. `revalidatePath('/palettes/{id}')` and `revalidatePath('/palettes/{id}/edit')`
5. Return `{ ok: true }` on success; the client trusts the optimistic update

### 4. List component changes

`palette-paint-list.tsx`:

- Becomes a client component (was already if managing remove)
- Wraps children in `<DndContext sensors={[Pointer, Touch, Keyboard]} onDragEnd={handleDragEnd}>` and `<SortableContext items={slotIds}>`
- Holds local `orderedSlots` state seeded from props; updates optimistically in `handleDragEnd`
- On `handleDragEnd`, computes the new order with `reorderArray` and triggers a `useTransition`-wrapped server action call
- On failure, restores the previous order and shows a toast
- Uses `KeyboardSensor` with `sortableKeyboardCoordinates` so arrow keys actually move the focused item

`palette-paint-row.tsx`:

- Calls `useSortable({ id: slot.id })` and applies `transform`/`transition` styles
- Adds `<PaletteDragHandle {...listeners} {...attributes} />` — the **handle** is what's draggable, not the whole row, so the click area still works for the link inside the row
- Adds `aria-roledescription="draggable"` and reflects `isDragging` state in styles

### 5. Visual affordance

- A six-dot grip icon (`grip-vertical` from lucide-react) on the left of every row
- On row hover, the handle lights up
- During drag, the row gets `shadow-lg` and `bg-base-200`
- The drop indicator is the default dnd-kit translation; no custom overlay needed for v1

### 6. Read view

`/palettes/[id]` keeps `palette-paint-list` but renders rows in the non-DnD variant (no handle, no SortableContext). Easiest split: keep one component with a `readOnly?: boolean` prop and only mount the DnD context when `!readOnly`.

### 7. Manual QA checklist

- Drag rows into a new order with the mouse — order persists across page refresh
- Reorder via keyboard (Tab to handle, Space to lift, Arrow keys, Space to drop) — same behavior
- Reorder with touch on a phone — works after long-press
- Trigger a server failure (e.g., network throttling, kill the dev server briefly) — order snaps back, toast shown
- Re-load the read-only `/palettes/{id}` view — swatch strip + paint list reflect the saved order
- Verify in DB that positions are `0..N-1` after the reorder
- `npm run build` + `npm run lint`

## Risks & Considerations

- **Position update non-atomicity**: Updating positions sequentially can violate the PK if a transient state has two rows at the same position. The two-phase update (move to negative offsets first, then to final positions) avoids this entirely. Document the trick in the action's JSDoc so future maintainers don't simplify it back into something broken.
- **`slot_id` migration**: Backfilling slot ids on existing palette_paints rows is cheap (gen_random_uuid for each), but the migration must run in a single transaction to avoid mid-flight gaps. If we ever ship `02-add-to-palette` before this feature, every new row will need a slot_id at insert — update the inserts in `02` to set it explicitly. (Until this feature lands, the column doesn't exist; coordinate sequencing.)
- **Optimistic UX**: The optimistic update lets users keep dragging quickly; the rollback path needs to handle the case where the user has already dragged again before the first response arrived. Easiest: queue calls and only roll back to the latest "successful" snapshot. Concretely — track the most recently confirmed order and roll back to that on failure.
- **Sensor conflicts**: dnd-kit's pointer sensor can conflict with row-level click handlers. Constrain the `useSortable` listeners to the handle (not the whole row).
- **Bundle size**: dnd-kit adds ~15kb gzipped. Worth it for full a11y + touch.

## Notes

- Sequencing: lands after `01-palette-management` (needs the row component to exist) and after `02-add-to-palette` (needs adds to behave so a populated list exists to reorder). The `slot_id` schema change ships in this feature's migration; update earlier migrations only if `02` reaches main first and the inserts need tweaking.
- The horizontal swatch strip used by `PaletteCard` and `PaletteDetail` reads from the same `paints` array; once positions persist, the strip naturally reflects the new order.
