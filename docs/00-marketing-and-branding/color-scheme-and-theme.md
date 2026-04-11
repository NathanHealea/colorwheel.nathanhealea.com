# Color Scheme and Theme

**Epic:** Marketing & Branding
**Type:** Feature
**Status:** Todo
**Branch:** `v1/feature/color-scheme-and-theme`

## Summary

Define the Grimify brand color palette and configure the app's light/dark theme using CSS custom properties. Establish the visual identity that carries across all pages and components.

## Acceptance Criteria

- [ ] Brand primary, secondary, and accent colors are defined
- [ ] Light mode theme is configured with brand colors in `globals.css`
- [ ] Dark mode theme is configured with brand colors in `globals.css`
- [ ] Theme tokens use OKLch color format for perceptual consistency
- [ ] Color variables are documented in a `src/styles/variables.css` file
- [ ] All existing components render correctly with the updated theme
- [ ] `npm run build` and `npm run lint` pass with no errors

## Key Files

| Action | File | Description |
|---|---|---|
| Create | `src/styles/variables.css` | Brand color definitions and semantic tokens |
| Modify | `src/app/globals.css` | Update `:root` and `.dark` theme variables with brand colors |

## Implementation

### 1. Define brand color palette

Choose primary, secondary, and accent colors that reflect Grimify's identity as a miniature painting tool. Consider paint-related colors — e.g., a rich pigment hue for primary, a neutral for secondary, and a vibrant accent.

### 2. Create variables.css

Define brand colors as CSS custom properties in OKLch format. Include named brand colors and map them to semantic tokens (primary, secondary, accent, etc.).

### 3. Update globals.css

Replace the default shadcn neutral theme values in `:root` and `.dark` with the brand-specific colors. Import `variables.css`.

### 4. Verify

Check all existing components (buttons, cards, inputs) render correctly with the new theme in both light and dark modes.

## Notes

- The current theme is shadcn's default neutral palette — this feature replaces it with Grimify branding.
- Use OKLch for perceptual uniformity (consistent perceived brightness across hues).
- Reference the duckling project's `styles/variables.css` for the pattern of defining brand colors alongside semantic tokens.
