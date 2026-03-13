# Paint Range Data Expansion

**Epic:** Paint Information
**Type:** Enhancement
**Status:** Completed

## Summary

Standardize the three paint range reference documents (`citadel-paint-ranges.md`, `army-painter-paint-ranges.md`, `vallejo-paint-ranges.md`), fill hex values from community databases and estimation, and expand the app's static paint JSON files from 503 to ~1,000+ paints across 4 brands. This work must complete before the Supabase migration so the seed data is comprehensive.

### Current State

| Brand             | App Paints | App Types                      | Reference Doc Paints | Reference Doc Types                                                   |
| ----------------- | ---------- | ------------------------------ | -------------------- | --------------------------------------------------------------------- |
| Citadel           | 202        | Base, Layer, Edge, Contrast    | 331                  | Base, Layer, Contrast, Shade, Air, Dry, Spray, Technical              |
| Army Painter      | 183        | Warpaints (legacy), Speedpaint | 360+                 | Fanatic Standard, Fanatic Metallic, Fanatic Wash, Speedpaint, Effects |
| Vallejo           | 86         | Game Color                     | 350+                 | Model Color, Game Color, Xpress Color, Model Wash, Liquid Metal       |
| Green Stuff World | 32         | Acrylic                        | —                    | —                                                                     |

### Problems

1. **No hex values in reference docs** — All three docs catalog paint names but none have hex color codes, which the app requires (`{name, hex, type}`)
2. **Inconsistent doc structure** — Citadel has `| Name |`, Army Painter has `| Name | Color Description | Citadel Equivalent |`, Vallejo has `| Ref | Name | Spanish Name |`
3. **Stale app data** — Army Painter JSON uses discontinued Original Warpaints (93 paints) while Fanatic (180+ paints) is the current range
4. **Incomplete coverage** — Citadel missing 5 paint types, Vallejo missing 4 product lines (~290 paints)

## Acceptance Criteria

- [ ] All three reference docs use consistent table schema with `| Name | Hex | Hex Source |` columns
- [ ] Citadel reference doc has hex values for Base, Layer, Edge, Contrast, Shade, Air, Dry, Spray
- [ ] Army Painter reference doc has hex values for Fanatic Standard, Fanatic Metallic, Fanatic Wash, Speedpaint
- [ ] Vallejo reference doc has hex values for Model Color, Game Color (all sub-types), Xpress Color, Model Wash, Liquid Metal
- [x] `src/data/brands.json` types expanded for all 3 brands
- [x] `src/data/paints/citadel.json` expanded from 202 → ~305 paints
- [x] `src/data/paints/army-painter.json` replaced with Fanatic data, expanded from 183 → ~306 paints
- [x] `src/data/paints/vallejo.json` expanded from 86 → ~416 paints
- [x] `src/data/REFERENCES.md` updated with all new hex sources and estimation methodology
- [x] `npm run build` passes with no regressions
- [ ] New paints render correctly on the color wheel

## Implementation Plan

### Phase 1: Standardize Document Structure ✅

Add `| Hex | Hex Source |` columns to all three reference docs. Populate hex from existing app JSON where names match. No external research in this phase.

**Hex Source values:** `verified` (from HandWiki, Encycolorpedia, Redgrimm), `estimated` (from image sampling, color descriptions, or translucent paint approximation), `pending` (not yet researched)

#### Step 1.1 — Citadel ✅

- Change all tables from `| Name |` to `| Name | Hex | Hex Source |`
- Populate Hex from `src/data/paints/citadel.json` for Base (49), Layer (84), Edge (8), Contrast (61) = 202 paints → `verified` or `estimated`
- Add Edge section (8 paints in JSON but missing from reference doc)
- Split Technical into "Technical (Color)" (Blood for the Blood God, Nihilakh Oxide, Tesseract Glow, Nurgle's Rot, Typhus Corrosion) and "Technical (Utility)" (textures, mediums, varnishes — excluded from app)
- Mark Shade, Air, Dry, Spray hex as `pending`

#### Step 1.2 — Army Painter ✅

- Change Fanatic tables to `| Name | Hex | Hex Source | Color Description | Citadel Equivalent |`
- Change Speedpaint tables to `| Name | Hex | Hex Source | Color Description |`
- Populate Speedpaint hex from `src/data/paints/army-painter.json` (90 paints) → `estimated`
- Mark all Fanatic hex as `pending`
- Flag Effects/Auxiliary/Glow Effects/Mediums as excluded from color wheel

#### Step 1.3 — Vallejo ✅

- Change all tables to `| Ref | Name | Hex | Hex Source |`
- Populate Game Color Standard hex from `src/data/paints/vallejo.json` (86 paints) → `verified`
- Move Spanish Names to a separate reference section (reduces table width)
- Keep Citadel Equivalents in Game Color and Xpress Color tables
- Mark Auxiliary Products as excluded from color wheel

### Phase 2: Fill Hex by Name Matching (Low Effort, High Yield) ✅

Many paints share exact names across product lines. Transfer hex values at zero research cost.

#### Step 2.1 — Citadel Air → Base/Layer ✅

~40 of 45 Air paints share exact names with Base or Layer paints (Averland Sunset, Mephiston Red, Macragge Blue, etc.). Copy their `verified` hex values. Research ~5 unique Air paints separately.

#### Step 2.2 — Citadel Dry → Layer ✅

~15 of 24 Dry paints share names with Layer paints (Dawnstone, Hoeth Blue, Nurgling Green, etc.). Copy hex. Research ~9 unique Dry paints.

#### Step 2.3 — Citadel Spray → Base ✅

~9 of 11 Spray paints share names with Base paints (Mephiston Red, Macragge Blue, Leadbelcher, etc.). Copy hex. Exclude Munitorum Varnish (utility).

#### Step 2.4 — Army Painter Fanatic → Original Warpaints ✅

The reference doc has a Fanatic-to-Original mapping table (~50 entries). For each Fanatic paint that maps to an Original Warpaint with hex in the current JSON, transfer the hex. Mark as `estimated` (Fanatic is reformulated). Yields ~50-60 hex values.

**Estimated yield:** ~120 paints resolved, 0 external research needed.

### Phase 3: Fill Hex from External Sources (Medium Effort)

Research hex values from community databases already documented in `src/data/REFERENCES.md`.

#### Step 3.1 — Citadel Shade (19 paints) ⚠️ 12/19 filled

- Source: [Encycolorpedia Citadel](https://encycolorpedia.com/paints/games-workshop-citadel) (174 paints)
- Shades are translucent → mark as `estimated`
- 7 newer Shades not in Encycolorpedia (Berserker Bloodshade, Soulblight Grey, Tyran Blue, Kroak Green, Targor Rageshade, Mortarion Grime, Poxwalker) → deferred to Phase 4

#### Step 3.2 — Citadel remaining unique Dry/Air (~14 paints) ✅

- Source: Encycolorpedia, HandWiki

#### Step 3.3 — Vallejo Model Color (220 paints) — largest batch ✅

- Source: [Redgrimm Vallejo Model Color](https://redgrimm.github.io/paint-conversion/vallejo-model.html)
- Source: [Encycolorpedia Vallejo Model Color](https://encycolorpedia.com/paints/vallejo-model-color)
- Ref numbers (70.xxx) make matching reliable

#### Step 3.4 — Vallejo Game Color Metallic/Ink/Wash (29 paints) ✅

- Source: Encycolorpedia, Redgrimm
- Inks and Washes are translucent → mark as `estimated`

#### Step 3.5 — Vallejo Xpress Color (55+ paints) ✅

- Contrast-style (translucent) → mark as `estimated`
- Use Citadel equivalent hex from reference doc as starting estimates
- Source: Redgrimm if available

#### Step 3.6 — Army Painter Fanatic without Original equivalent (~60-80 paints) ⚠️ ~76 still pending

- Source: [Redgrimm Army Painter](https://redgrimm.github.io/paint-conversion/army-painter.html) — check for Fanatic names
- Source: [paint4models.com](https://www.paint4models.com/armypainter.html)
- Fallback: Derive from Color Description (e.g., "Vivid Turquoise" → approximate hex)
- Also used Citadel equivalent hex lookup as fallback — filled ~16 additional paints

**Actual yield:** ~340 paints resolved (vs ~300 estimated).

### Phase 4: Estimate Remaining Hex (Higher Effort)

For paints with no community hex data available.

#### Step 4.1 — Army Painter Fanatic Metallic (18 paints)

Estimate from metallic base hues (gold, silver, copper, bronze, iron). Use Citadel metallic equivalents where documented.

#### Step 4.2 — Army Painter Fanatic Washes (18 paints)

Translucent — estimate from Citadel Shade equivalents documented in reference doc.

#### Step 4.3 — Vallejo Model Wash (18 paints)

Estimate from color name and use case description in reference doc.

#### Step 4.4 — Vallejo Liquid Metal (8 paints)

Estimate from metallic base hues (Silver, Gold, Old Gold, Rich Gold, Red Gold, Green Gold, White Gold, Copper).

#### Step 4.5 — Citadel Technical color paints (5 paints)

Blood for the Blood God, Nihilakh Oxide, Tesseract Glow, Nurgle's Rot, Typhus Corrosion. Check Encycolorpedia or estimate.

#### Step 4.6 — GW Product Image Sampling (fallback)

The `warhammer-color.html` file has 296 JPG product images with color swatches in the lower-right corner. As a last resort, use Python + Pillow to sample the lower-right 12.5% of each image for dominant color. Product photos have lighting artifacts so this is the least accurate method.

**Estimated yield:** ~80 paints resolved.

### Phase 5: Update App Data Files

#### Step 5.1 — Update `src/data/brands.json`

| Brand        | Current Types               | New Types                                                                                                             |
| ------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Citadel      | Base, Layer, Edge, Contrast | Base, Layer, Edge, Contrast, Shade, Air, Dry, Spray                                                                   |
| Army Painter | Warpaints, Speedpaint       | Fanatic, Fanatic Metallic, Fanatic Wash, Speedpaint                                                                   |
| Vallejo      | Game Color                  | Model Color, Game Color, Game Color Metallic, Game Color Ink, Game Color Wash, Xpress Color, Model Wash, Liquid Metal |

#### Step 5.2 — Update `src/data/paints/citadel.json`

Add entries for Shade (19), Air (~45), Dry (~24), Spray (~10), Technical color (~5). Expected: 202 → ~305 paints.

#### Step 5.3 — Replace `src/data/paints/army-painter.json`

Replace Original Warpaints (93) with Fanatic Standard (~180) + Fanatic Metallic (18) + Fanatic Wash (18). Keep Speedpaint (90). Expected: 183 → ~306 paints.

#### Step 5.4 — Expand `src/data/paints/vallejo.json`

Add Model Color (~220), Xpress Color (~55), Game Color Metallic (9), Game Color Ink (12), Game Color Wash (8), Model Wash (18), Liquid Metal (8). Expected: 86 → ~416 paints.

#### Step 5.5 — Update `src/data/REFERENCES.md`

Document all new hex sources used in Phases 2-4. Add estimation methodology notes per paint type.

### Paint Types: Include vs Exclude

**Include on color wheel** (have a meaningful representative color):

| Brand        | Include                                                                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Citadel      | Base, Layer, Edge, Contrast, Shade, Air, Dry, Spray, Technical (5 color paints)                                                                             |
| Army Painter | Fanatic Standard, Fanatic Metallic, Fanatic Wash, Speedpaint Standard, Speedpaint Pastel, Speedpaint Metallic                                               |
| Vallejo      | Model Color Opaque, Model Color Metallic, Game Color Standard, Game Color Metallic, Game Color Ink, Game Color Wash, Xpress Color, Model Wash, Liquid Metal |

**Exclude from color wheel** (documented in reference docs but not added to app JSON):

| Brand        | Exclude                                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Citadel      | Technical textures (Astrogranite, Stirland Mud, etc.), mediums (Lahmian Medium, Contrast Medium), varnishes (Ardcoat, Stormshield) |
| Army Painter | Effects (Disgusting Slime, Dry Blood, etc.), Auxiliary (Stabilizer, Retarder, Primer), Glow Effects, Wash Medium                   |
| Vallejo      | Auxiliary Products (varnishes, mediums, thinners, putty, primers), Special FX, Fluorescent                                         |

### Affected Files

| File                                                  | Changes                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `docs/paint-information/citadel-paint-ranges.md`      | Add Hex + Hex Source columns, add Edge section, split Technical, populate hex |
| `docs/paint-information/army-painter-paint-ranges.md` | Add Hex + Hex Source columns, populate Fanatic hex, flag exclusions           |
| `docs/paint-information/vallejo-paint-ranges.md`      | Add Hex + Hex Source columns, move Spanish Names, populate hex                |
| `src/data/brands.json`                                | Expand types arrays for Citadel, Army Painter, Vallejo                        |
| `src/data/paints/citadel.json`                        | Add ~103 paints (Shade, Air, Dry, Spray, Technical color)                     |
| `src/data/paints/army-painter.json`                   | Replace Original Warpaints with Fanatic (~306 total)                          |
| `src/data/paints/vallejo.json`                        | Add ~330 paints (Model Color, Xpress, sub-types, Wash, Liquid Metal)          |
| `src/data/REFERENCES.md`                              | Document new hex sources and estimation methodology                           |

### Dependencies

This enhancement should complete **before** the [Paint Data Migration](./paint-data-migration.md) so that the Supabase seed migration includes the full expanded dataset.

### Risks & Considerations

- **Army Painter breaking change** — Replacing Original Warpaints with Fanatic changes paint names. Users with "owned" Original Warpaints in localStorage will lose those associations. Consider a migration helper or note in release.
- **Hex estimation quality** — Contrast, Speedpaint, Wash, and Ink paints are translucent. Hex values represent approximate color over white primer, not the paint itself. This is an accepted limitation documented in `REFERENCES.md`.
- **Duplicate paint names across types** — Citadel has paints like "Dawnstone" in both Layer, Dry, and Air. The app will have separate entries for each, differentiated by `type`. The color wheel may show overlapping dots for these.
- **Large data expansion** — Going from 503 to ~1,000+ paints roughly doubles the JSON payload (~100KB → ~200KB). Still well within localStorage limits (~5MB) and acceptable for initial load.
- **Green Stuff World** — Not addressed in this enhancement. GSW has only 32 estimated paints and no comprehensive reference doc yet. Can be expanded separately.
