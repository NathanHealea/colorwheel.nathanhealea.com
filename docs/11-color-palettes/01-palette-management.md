# Palette Management — Dashboard, Builder, and CRUD UI

**Epic:** Color Palettes
**Type:** Feature
**Status:** Todo
**Branch:** `feature/palette-management`
**Merge into:** `v1/main`

## Summary

Give authenticated users a complete CRUD experience for their palettes: a "My palettes" dashboard, a builder page with name/description editing and a paint list, a public detail/view page, and the ability to delete palettes. Adds the user-facing surface on top of the schema and module from `00-palette-schema.md`.

This feature delivers the **basic** builder (name, description, visibility, list of paints with remove/clear). Drag-and-drop reordering ships in `03-palette-reorder.md`; bulk-add and "save scheme as palette" ship in `02-add-to-palette.md`; the hue-locked HSL swap ships in `04-palette-hue-swap.md`.

## Acceptance Criteria

- [ ] `/palettes` lists the signed-in user's palettes as cards (name, swatch strip, paint count, updated date)
- [ ] `/palettes/new` creates an empty palette and redirects to its edit page
- [ ] `/palettes/[id]` is the read-only view; visible to anyone if `is_public`, owner-only otherwise
- [ ] `/palettes/[id]/edit` is the builder: edit name/description/visibility, view paints, remove a paint, clear the palette, delete the palette
- [ ] Both the read view and edit view render paints as a swatch strip plus a card list (paint name, brand, hex, optional per-slot note)
- [ ] An "empty palette" state on the read view explains how to add paints
- [ ] Deleting a palette confirms first, then redirects to `/palettes` with a toast
- [ ] Unauthenticated users hitting `/palettes`, `/palettes/new`, or `/palettes/{id}/edit` are redirected to `/sign-in?next={path}`
- [ ] `npm run build` and `npm run lint` pass with no errors

## Routes

| Route                  | Description                                                | Auth        |
| ---------------------- | ---------------------------------------------------------- | ----------- |
| `/palettes`            | "My palettes" dashboard (later also surfaces public feed)  | required    |
| `/palettes/new`        | Action route — creates a new empty palette and redirects   | required    |
| `/palettes/[id]`       | Read-only palette detail                                   | conditional |
| `/palettes/[id]/edit`  | Palette builder                                            | owner       |

`[id]/edit` enforces ownership in the route loader (404 if not owner). `[id]` 404s if neither the caller is the owner nor `is_public = true`.

## Module additions

```
src/modules/palettes/
├── actions/
│   ├── (existing) create-palette.ts
│   ├── (existing) update-palette.ts
│   ├── (existing) delete-palette.ts
│   └── remove-palette-paint.ts          NEW — single-slot removal action
├── components/
│   ├── palette-card.tsx                 NEW — dashboard tile
│   ├── palette-card-grid.tsx            NEW
│   ├── palette-detail.tsx               NEW — read-only view body
│   ├── palette-form.tsx                 NEW — name/description/visibility (per CLAUDE.md, only the <form>)
│   ├── palette-builder.tsx              NEW — orchestrates form + paint list + delete
│   ├── palette-paint-list.tsx           NEW — vertical list of palette paints with remove buttons
│   ├── palette-paint-row.tsx            NEW — single paint row (swatch, name, brand, note, remove)
│   ├── palette-swatch-strip.tsx         NEW — horizontal hex strip used by card + detail header
│   ├── palette-empty-state.tsx          NEW
│   └── delete-palette-button.tsx        NEW — confirm dialog + action
└── utils/
    └── format-palette-updated-label.ts  NEW — "Updated 3 days ago"
```

## Key Files

| Action  | File                                                                  | Description                                                                |
| ------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Create  | `src/app/palettes/page.tsx`                                           | Server component — loads user palettes, renders dashboard                  |
| Create  | `src/app/palettes/new/route.ts`                                       | Server route handler — calls `createPalette`, redirects to edit page       |
| Create  | `src/app/palettes/[id]/page.tsx`                                      | Read-only detail (auth-conditional)                                        |
| Create  | `src/app/palettes/[id]/edit/page.tsx`                                 | Builder wrapper — enforces owner, renders `<PaletteBuilder>`               |
| Create  | `src/modules/palettes/components/palette-card.tsx`                    | Tile with swatch strip, name, paint count, updated label                   |
| Create  | `src/modules/palettes/components/palette-card-grid.tsx`               | Responsive grid of `PaletteCard`s                                          |
| Create  | `src/modules/palettes/components/palette-detail.tsx`                  | Read view: header + swatch strip + paint list                              |
| Create  | `src/modules/palettes/components/palette-form.tsx`                    | `<form>` only — name, description, visibility toggle, save button          |
| Create  | `src/modules/palettes/components/palette-builder.tsx`                 | Composes form, paint list, delete button; subscribes to action state       |
| Create  | `src/modules/palettes/components/palette-paint-list.tsx`              | Maps `palette.paints` to rows                                              |
| Create  | `src/modules/palettes/components/palette-paint-row.tsx`               | Swatch + paint card linkout + remove button                                |
| Create  | `src/modules/palettes/components/palette-swatch-strip.tsx`            | Horizontal hex strip; truncates with "+N" badge past 16                    |
| Create  | `src/modules/palettes/components/palette-empty-state.tsx`             | "No paints yet — add some from any paint card or the scheme explorer"     |
| Create  | `src/modules/palettes/components/delete-palette-button.tsx`           | Button + dialog + form action                                              |
| Create  | `src/modules/palettes/actions/remove-palette-paint.ts`                | Removes a single slot, normalizes positions                                |
| Create  | `src/modules/palettes/utils/format-palette-updated-label.ts`          | Renders relative-time label                                                |
| Modify  | `src/components/site-nav` (or equivalent)                             | Add "Palettes" link to authenticated nav                                   |

## Implementation

### 1. Dashboard — `/palettes/page.tsx`

Server component. Reads the signed-in user's palettes via `listPalettesForUser`; redirects unauthenticated visitors to `/sign-in?next=/palettes`. Renders:

- Header: "My palettes" + a primary "New palette" button that POSTs to `/palettes/new`
- `PaletteCardGrid` of summaries
- Empty state when the user has zero palettes — single CTA "Create your first palette"

`PaletteCard` accepts a `PaletteSummary` (id, name, description, paintCount, swatchHexes (first 8), updatedAt, isPublic). The card links to `/palettes/{id}` for read-only and shows an "Edit" affordance only when the caller is the owner.

### 2. New palette — `/palettes/new/route.ts`

A POST-only route handler that:

1. Verifies the session
2. Calls `createPalette` with default name "Untitled palette"
3. Redirects to `/palettes/{id}/edit`

The dashboard's "New palette" button is a `<form action="/palettes/new" method="post">` so it works without JS.

### 3. Read view — `/palettes/[id]/page.tsx`

Server component:

1. Loads palette via `getPaletteById`
2. 404s if not found, or if not public and the caller isn't the owner
3. Renders `<PaletteDetail>`: header (name, description, owner attribution, public badge, "Edit" if owner), `PaletteSwatchStrip`, `PaletteEmptyState` when paint count is 0, otherwise a list of `PaletteCard`-style paint cards (reuse `CollectionPaintCard` from the collection module)

### 4. Builder — `/palettes/[id]/edit/page.tsx`

Server component that loads the palette and 404s if the caller isn't the owner. Renders `<PaletteBuilder palette={palette} />`.

`PaletteBuilder` is a client component that:

- Renders `<PaletteForm>` for name/description/visibility (uses `useActionState` against `updatePalette`)
- Renders `<PalettePaintList>` for the paints; each row has a "Remove" button that posts to `removePalettePaint`
- Renders `<DeletePaletteButton>` at the bottom (destructive, opens confirm dialog)
- Shows the empty state when paint count is 0 with the same "add from anywhere" copy as the read view

`PaletteForm` only contains the `<form>` element (per `CLAUDE.md`). The card layout (header, footer, save state) is composed in `PaletteBuilder`. `useActionState` is imported from `'react'`.

### 5. Remove + delete actions

`removePalettePaint(paletteId, position)`:

1. Verifies the caller owns the palette (RLS will enforce too — defense in depth)
2. Deletes the join row at `(palette_id, position)`
3. Calls `normalizePalettePositions` to re-index remaining rows
4. `revalidatePath('/palettes/{id}')` and `revalidatePath('/palettes/{id}/edit')`

`deletePalette` (already exists from `00-palette-schema.md`):

1. Confirms via `<DeletePaletteButton>`
2. Calls service, redirects to `/palettes`, flashes a toast

### 6. Visibility toggle

`is_public` flips between Private (default) and Public. Public palettes are reachable at `/palettes/{id}` without auth. The form copy makes this explicit ("Public palettes are visible to anyone with the link"). Sharing/discovery surfaces (browse all, community feed) live in later epics.

### 7. Navigation

Add a "Palettes" link to the authenticated site nav next to "Collection". Unauthenticated nav can link to a future public browse page; for now keep it owner-only.

### 8. Styling

Reuse existing daisyUI-style classes from `src/styles/`:

- `card` and `card-body` for `PaletteCard`
- `btn btn-primary` / `btn btn-ghost` for actions
- `badge badge-soft` for paint-count and visibility chips
- The swatch strip uses inline `background-color: {hex}` per cell with a fixed width — keep cells square at three sizes (sm 16px, md 28px, lg 40px)

### 9. Manual QA checklist

- Sign in, hit `/palettes` — empty state with CTA
- Click "New palette" — lands on `/palettes/{id}/edit`
- Edit name + description, toggle Public, save — values persist; dashboard card updates
- Sign out — `/palettes/{id}` for the public palette renders; the private palette 404s
- Sign back in, remove a paint — list shrinks, positions stay coherent (verify in DB)
- Delete a palette via the button — confirms, redirects, toast appears
- Hit `/palettes/{id}/edit` for someone else's palette — 404
- `npm run build` + `npm run lint` succeed

## Risks & Considerations

- **Owner check duplication**: RLS prevents data leaks at the database boundary, but we still 404 in the route loader to keep the URL surface clean and avoid leaking palette existence.
- **`/palettes/new` as POST-only**: Prevents accidental duplicate-create from refresh and avoids needing a separate "new palette" form page. The dashboard button uses a real `<form>` so it works without JS.
- **Card limits on swatch strip**: At ~16+ paints the strip overflows; truncate after 16 with a "+N" badge and rely on the detail page to show all of them.
- **Authentication redirects**: Use the existing redirect-with-`next` pattern from the auth module (e.g., `redirect('/sign-in?next=' + encodeURIComponent('/palettes/new'))`).
- **Per-slot `note`**: The schema has it; the row component renders it read-only here. Editing the note is part of `02-add-to-palette` (where rows are created/updated) — keeping this feature focused on the management shell.

## Notes

- "Add a paint" UI lives in `02-add-to-palette.md` — this feature deliberately does **not** include a paint picker on the builder; you add paints from a paint card, the paint detail page, or the scheme explorer.
- Reordering is gated to `03-palette-reorder.md` — the builder list is static-order in this feature.
- The dashboard query stays cheap because `listPalettesForUser` returns a flattened summary with up to 8 swatch hex codes; no per-card paint hydration.
