# Sidebar Layout

**Epic:** UI & Layout
**Type:** Feature
**Status:** Todo

## Summary

A toggleable sidebar that contains Search, Brand Filter, Brand Ring Toggle, Header Stats, Color Scheme Mode, and Color Details. Responsive behavior differs between desktop and mobile.

## Acceptance Criteria

- [ ] Sidebar contains: Search, Brand Filter, Brand Ring Toggle, Header Stats, Color Scheme Mode, and Color Details
- [ ] Sidebar is toggleable (open/close)
- [ ] On desktop, the sidebar shrinks the size of the main viewing window (side-by-side layout)
- [ ] On mobile, the sidebar overlays the entire screen
- [ ] On mobile, an apply button makes the necessary changes and closes the menu

## Implementation Plan

### Current State

The app is in early stage: `page.tsx` owns only `zoom` and `pan` state, with a single `ColorWheel` component rendering fullscreen. No search, filters, brand toggles, color scheme mode, detail panel, or stats components exist yet. The sidebar feature creates the layout shell and placeholder sections for these future features.

### Step 1: Add sidebar state to `src/app/page.tsx`

Add `sidebarOpen` boolean state (default `true` on desktop, `false` on mobile). Add a toggle handler passed to both the sidebar and a toggle button.

### Step 2: Create `src/components/Sidebar.tsx`

New component that serves as the sidebar container/shell.

**Props:**
- `isOpen: boolean` — controls visibility
- `onClose: () => void` — callback to close the sidebar
- `children: React.ReactNode` — sidebar content sections

**Desktop behavior (md+ breakpoint, ≥768px):**
- Renders as a fixed-width panel (e.g., `w-80` / 320px) on the left side
- Uses flex layout so the main content area shrinks to fill remaining space
- Smooth width transition on open/close (CSS transition on width or transform)
- No backdrop/overlay

**Mobile behavior (<768px):**
- Renders as a full-screen overlay (`fixed inset-0 z-50`)
- Dark backdrop behind the panel
- Slide-in animation from the left
- Close button at the top
- "Apply" button fixed at the bottom — closes the sidebar

**Interior layout:**
- Scrollable content area (`overflow-y-auto`) with padding
- Organized into labeled sections with dividers

### Step 3: Update page layout in `src/app/page.tsx`

Restructure the JSX from fullscreen `ColorWheel` to a responsive flex layout:

```
<div className="flex h-screen w-screen overflow-hidden">
  <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar}>
    {/* placeholder sections */}
  </Sidebar>
  <main className="flex-1 relative">
    <ColorWheel ... />
    <SidebarToggleButton />
    {/* existing zoom/reset controls */}
  </main>
</div>
```

On desktop, the sidebar and main sit side-by-side in a flex row. On mobile, the sidebar is position-fixed overlay so it doesn't affect main content flow.

### Step 4: Create `src/components/SidebarToggleButton.tsx`

A small floating button (absolute positioned, top-left of main area) that opens the sidebar. Shows a hamburger/menu icon when sidebar is closed, or is hidden when the sidebar is open on desktop.

**Props:**
- `onClick: () => void`
- `isOpen: boolean`

### Step 5: Add placeholder sections inside the sidebar

Create lightweight placeholder components for each sidebar section. These will be replaced by real implementations in future features:

1. **Search** — text input with magnifying glass icon, non-functional placeholder
2. **Brand Filter** — list of brand names with checkboxes, non-functional
3. **Brand Ring Toggle** — single toggle switch, non-functional
4. **Header Stats** — static text showing paint count (from data), non-functional
5. **Color Scheme Mode** — radio/button group (Complementary, Split-Comp, Analogous, None), non-functional
6. **Color Details** — empty state message ("Select a paint to see details"), non-functional

Each section gets a heading label and a `<div>` wrapper. These can be inline in `Sidebar` or extracted to a `src/components/sidebar/` directory if they grow.

### Step 6: Update `src/app/globals.css` for transitions

Add transition utilities if needed for sidebar slide animation. Tailwind v4 should handle most of this with utility classes, but add any custom CSS for smooth open/close transitions.

### Step 7: Verify responsive behavior

- Desktop: sidebar open shrinks the wheel area, sidebar closed gives full width
- Mobile: sidebar overlays, apply button closes, main content is not affected
- Touch/scroll within sidebar doesn't interfere with ColorWheel zoom/pan

### Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/app/page.tsx` | Modify | Add sidebar state, restructure layout to flex, render Sidebar + toggle |
| `src/components/Sidebar.tsx` | Create | Sidebar container with responsive desktop/mobile behavior |
| `src/components/SidebarToggleButton.tsx` | Create | Floating toggle button for opening the sidebar |
| `src/app/globals.css` | Modify | Add transition/animation styles if needed |

### Risks & Considerations

- **ColorWheel resize:** The SVG uses `viewBox` for scaling so resizing the container should work naturally, but verify the wheel re-centers correctly when sidebar opens/closes.
- **Touch event conflicts:** On mobile, ensure sidebar scroll doesn't trigger ColorWheel pan/zoom. The overlay approach (fixed positioning) should isolate these.
- **Initial sidebar state:** Default open on desktop for discoverability, default closed on mobile to show the wheel first. Consider using a media query hook or CSS-only approach.
- **Performance:** Sidebar open/close transitions should use `transform` or `width` with `will-change` to stay on the compositor layer and avoid layout thrashing.
