import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

// ---------------------------------------------------------------------------
// Types for the JSON data structures
// ---------------------------------------------------------------------------

interface BrandJson {
  id: string
  name: string
  icon: string
  color: string
  types: string[]
}

interface ComparableJson {
  id: string
  name: string
}

interface PaintJson {
  id: string
  name: string
  hex: string
  type: string
  description: string
  comparable: ComparableJson[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, 'data')
const OUTPUT_FILE = resolve(__dirname, '..', 'supabase', 'seed.sql')

/** Brand website URLs (not present in the JSON data). */
const BRAND_WEBSITES: Record<string, string> = {
  citadel: 'https://www.games-workshop.com',
  'army-painter': 'https://thearmypainter.com',
  vallejo: 'https://acrylicosvallejo.com',
  'green-stuff-world': 'https://www.greenstuffworld.com',
  'ak-interactive': 'https://ak-interactive.com',
}

/** Paint file names keyed by brand slug. */
const PAINT_FILES: Record<string, string> = {
  citadel: 'citadel.json',
  'army-painter': 'army-painter.json',
  vallejo: 'vallejo.json',
  'green-stuff-world': 'green-stuff-world.json',
  'ak-interactive': 'ak-interactive.json',
}

// ---------------------------------------------------------------------------
// Color conversion helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: h * 360, s: s * 100, l: l * 100 }
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Convert a name string to a URL-safe slug. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Escape single quotes for SQL string literals. */
function esc(value: string): string {
  return value.replace(/'/g, "''")
}

/** Round a number to 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * ISCC-NBS sub-hues from the hues table (child rows with parent_id set,
 * seeded in migration 20260415). Each entry has the sub-hue slug and hex value
 * for RGB distance matching. The seed generator uses the closest sub-hue slug
 * to set `hue_id` on each paint (pointing to the sub-hue row).
 */
const COLOR_CATALOG: { slug: string; hex: string }[] = [
  // Red sub-hues
  { slug: 'vivid-red', hex: '#FF0000' },
  { slug: 'strong-red', hex: '#CF1717' },
  { slug: 'deep-red', hex: '#8A0F0F' },
  { slug: 'very-deep-red', hex: '#500B0B' },
  { slug: 'moderate-red', hex: '#BF4040' },
  { slug: 'dark-red', hex: '#6F2A2A' },
  { slug: 'very-dark-red', hex: '#361717' },
  { slug: 'light-greyish-red', hex: '#CCB3B3' },
  { slug: 'greyish-red', hex: '#996666' },
  { slug: 'dark-greyish-red', hex: '#584141' },
  { slug: 'blackish-red', hex: '#221C1C' },
  // Yellow-Red sub-hues
  { slug: 'vivid-yellow-red', hex: '#FF8C00' },
  { slug: 'strong-yellow-red', hex: '#CF7C17' },
  { slug: 'deep-yellow-red', hex: '#8A530F' },
  { slug: 'very-deep-yellow-red', hex: '#50310B' },
  { slug: 'moderate-yellow-red', hex: '#BF8640' },
  { slug: 'dark-yellow-red', hex: '#6F502A' },
  { slug: 'very-dark-yellow-red', hex: '#362817' },
  { slug: 'light-greyish-yellow-red', hex: '#CCC1B3' },
  { slug: 'greyish-yellow-red', hex: '#998266' },
  { slug: 'dark-greyish-yellow-red', hex: '#584E41' },
  { slug: 'blackish-yellow-red', hex: '#221F1C' },
  // Yellow sub-hues
  { slug: 'vivid-yellow', hex: '#FFFF00' },
  { slug: 'strong-yellow', hex: '#CFCF17' },
  { slug: 'deep-yellow', hex: '#8A8A0F' },
  { slug: 'very-deep-yellow', hex: '#50500B' },
  { slug: 'moderate-yellow', hex: '#BFBF40' },
  { slug: 'dark-yellow', hex: '#6F6F2A' },
  { slug: 'very-dark-yellow', hex: '#363617' },
  { slug: 'light-greyish-yellow', hex: '#CCCCB3' },
  { slug: 'greyish-yellow', hex: '#999966' },
  { slug: 'dark-greyish-yellow', hex: '#585841' },
  { slug: 'blackish-yellow', hex: '#22221C' },
  // Green-Yellow sub-hues
  { slug: 'vivid-green-yellow', hex: '#AAFF00' },
  { slug: 'strong-green-yellow', hex: '#91CF17' },
  { slug: 'deep-green-yellow', hex: '#618A0F' },
  { slug: 'very-deep-green-yellow', hex: '#39500B' },
  { slug: 'moderate-green-yellow', hex: '#95BF40' },
  { slug: 'dark-green-yellow', hex: '#586F2A' },
  { slug: 'very-dark-green-yellow', hex: '#2B3617' },
  { slug: 'light-greyish-green-yellow', hex: '#C4CCB3' },
  { slug: 'greyish-green-yellow', hex: '#889966' },
  { slug: 'dark-greyish-green-yellow', hex: '#505841' },
  { slug: 'blackish-green-yellow', hex: '#20221C' },
  // Green sub-hues
  { slug: 'vivid-green', hex: '#00FF00' },
  { slug: 'strong-green', hex: '#17CF17' },
  { slug: 'deep-green', hex: '#0F8A0F' },
  { slug: 'very-deep-green', hex: '#0B500B' },
  { slug: 'moderate-green', hex: '#40BF40' },
  { slug: 'dark-green', hex: '#2A6F2A' },
  { slug: 'very-dark-green', hex: '#173617' },
  { slug: 'light-greyish-green', hex: '#B3CCB3' },
  { slug: 'greyish-green', hex: '#669966' },
  { slug: 'dark-greyish-green', hex: '#415841' },
  { slug: 'blackish-green', hex: '#1C221C' },
  // Blue-Green sub-hues
  { slug: 'vivid-blue-green', hex: '#00FFFF' },
  { slug: 'strong-blue-green', hex: '#17CFCF' },
  { slug: 'deep-blue-green', hex: '#0F8A8A' },
  { slug: 'very-deep-blue-green', hex: '#0B5050' },
  { slug: 'moderate-blue-green', hex: '#40BFBF' },
  { slug: 'dark-blue-green', hex: '#2A6F6F' },
  { slug: 'very-dark-blue-green', hex: '#173636' },
  { slug: 'light-greyish-blue-green', hex: '#B3CCCC' },
  { slug: 'greyish-blue-green', hex: '#669999' },
  { slug: 'dark-greyish-blue-green', hex: '#415858' },
  { slug: 'blackish-blue-green', hex: '#1C2222' },
  // Blue sub-hues
  { slug: 'vivid-blue', hex: '#0000FF' },
  { slug: 'strong-blue', hex: '#1717CF' },
  { slug: 'deep-blue', hex: '#0F0F8A' },
  { slug: 'very-deep-blue', hex: '#0B0B50' },
  { slug: 'moderate-blue', hex: '#4040BF' },
  { slug: 'dark-blue', hex: '#2A2A6F' },
  { slug: 'very-dark-blue', hex: '#171736' },
  { slug: 'light-greyish-blue', hex: '#B3B3CC' },
  { slug: 'greyish-blue', hex: '#666699' },
  { slug: 'dark-greyish-blue', hex: '#414158' },
  { slug: 'blackish-blue', hex: '#1C1C22' },
  // Purple-Blue sub-hues
  { slug: 'vivid-purple-blue', hex: '#5500FF' },
  { slug: 'strong-purple-blue', hex: '#5417CF' },
  { slug: 'deep-purple-blue', hex: '#380F8A' },
  { slug: 'very-deep-purple-blue', hex: '#220B50' },
  { slug: 'moderate-purple-blue', hex: '#6A40BF' },
  { slug: 'dark-purple-blue', hex: '#412A6F' },
  { slug: 'very-dark-purple-blue', hex: '#211736' },
  { slug: 'light-greyish-purple-blue', hex: '#BBB3CC' },
  { slug: 'greyish-purple-blue', hex: '#776699' },
  { slug: 'dark-greyish-purple-blue', hex: '#494158' },
  { slug: 'blackish-purple-blue', hex: '#1E1C22' },
  // Purple sub-hues
  { slug: 'vivid-purple', hex: '#FF00FF' },
  { slug: 'strong-purple', hex: '#CF17CF' },
  { slug: 'deep-purple', hex: '#8A0F8A' },
  { slug: 'very-deep-purple', hex: '#500B50' },
  { slug: 'moderate-purple', hex: '#BF40BF' },
  { slug: 'dark-purple', hex: '#6F2A6F' },
  { slug: 'very-dark-purple', hex: '#361736' },
  { slug: 'light-greyish-purple', hex: '#CCB3CC' },
  { slug: 'greyish-purple', hex: '#996699' },
  { slug: 'dark-greyish-purple', hex: '#584158' },
  { slug: 'blackish-purple', hex: '#221C22' },
  // Red-Purple sub-hues
  { slug: 'vivid-red-purple', hex: '#FF0080' },
  { slug: 'strong-red-purple', hex: '#CF1773' },
  { slug: 'deep-red-purple', hex: '#8A0F4D' },
  { slug: 'very-deep-red-purple', hex: '#500B2E' },
  { slug: 'moderate-red-purple', hex: '#BF4080' },
  { slug: 'dark-red-purple', hex: '#6F2A4D' },
  { slug: 'very-dark-red-purple', hex: '#361726' },
  { slug: 'light-greyish-red-purple', hex: '#CCB3BF' },
  { slug: 'greyish-red-purple', hex: '#996680' },
  { slug: 'dark-greyish-red-purple', hex: '#58414D' },
  { slug: 'blackish-red-purple', hex: '#221C1F' },
  // Neutral sub-hues
  { slug: 'white', hex: '#FFFFFF' },
  { slug: 'near-white', hex: '#F5F5F5' },
  { slug: 'light-grey', hex: '#C0C0C0' },
  { slug: 'medium-grey', hex: '#808080' },
  { slug: 'dark-grey', hex: '#404040' },
  { slug: 'near-black', hex: '#1A1A1A' },
  { slug: 'black', hex: '#000000' },
  { slug: 'brown', hex: '#8B4513' },
  { slug: 'dark-brown', hex: '#3B2F2F' },
  { slug: 'light-brown', hex: '#D2B48C' },
  { slug: 'ivory', hex: '#FFFFF0' },
]

/** Pre-computed RGB values for each color in the catalog. */
const COLOR_CATALOG_RGB = COLOR_CATALOG.map((c) => ({
  slug: c.slug,
  ...hexToRgb(c.hex),
}))

/**
 * Finds the closest ISCC-NBS sub-hue to a given RGB value using Euclidean distance.
 *
 * @returns The slug of the closest sub-hue from the catalog.
 */
function findClosestColor(r: number, g: number, b: number): string {
  let bestSlug = 'medium-grey'
  let bestDist = Infinity

  for (const c of COLOR_CATALOG_RGB) {
    const dr = r - c.r
    const dg = g - c.g
    const db = b - c.b
    const dist = dr * dr + dg * dg + db * db
    if (dist < bestDist) {
      bestDist = dist
      bestSlug = c.slug
    }
  }

  return bestSlug
}

/**
 * Deduplicate slugs within a product line by appending the brand paint ID
 * suffix when collisions are detected.
 */
function deduplicateSlugs(
  paints: PaintJson[]
): Map<string, string> {
  // Group paints by (type, slug) to find collisions
  const byTypeAndSlug = new Map<string, PaintJson[]>()
  for (const paint of paints) {
    const key = `${paint.type}::${slugify(paint.name)}`
    const existing = byTypeAndSlug.get(key) ?? []
    existing.push(paint)
    byTypeAndSlug.set(key, existing)
  }

  // Build jsonId -> final slug mapping
  const result = new Map<string, string>()
  for (const [, group] of byTypeAndSlug) {
    if (group.length === 1) {
      result.set(group[0].id, slugify(group[0].name))
    } else {
      // Collision: append the brand paint ID to disambiguate
      for (const paint of group) {
        result.set(paint.id, `${slugify(paint.name)}-${paint.id}`)
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

function main(): void {
  const brands: BrandJson[] = JSON.parse(
    readFileSync(resolve(DATA_DIR, 'brands.json'), 'utf-8')
  )

  const lines: string[] = []

  lines.push('-- ==========================================================')
  lines.push('-- Seed data for paint tables')
  lines.push('-- Auto-generated by scripts/generate-seed.ts')
  lines.push('-- ==========================================================')
  lines.push('')

  // ------------------------------------------------------------------
  // 1. Brands
  // ------------------------------------------------------------------
  lines.push('-- ----------------------------------------------------------')
  lines.push('-- Brands')
  lines.push('-- ----------------------------------------------------------')
  lines.push('')

  for (const brand of brands) {
    const websiteUrl = BRAND_WEBSITES[brand.id] ?? null
    const websiteSql = websiteUrl ? `'${esc(websiteUrl)}'` : 'NULL'
    lines.push(
      `INSERT INTO public.brands (name, slug, website_url) VALUES ('${esc(brand.name)}', '${esc(brand.id)}', ${websiteSql});`
    )
  }
  lines.push('')

  // ------------------------------------------------------------------
  // 2. Product Lines (derived from unique types per brand)
  // ------------------------------------------------------------------
  lines.push('-- ----------------------------------------------------------')
  lines.push('-- Product Lines')
  lines.push('-- ----------------------------------------------------------')
  lines.push('')

  for (const brand of brands) {
    const paintFile = PAINT_FILES[brand.id]
    if (!paintFile) continue
    const paints: PaintJson[] = JSON.parse(
      readFileSync(resolve(DATA_DIR, 'paints', paintFile), 'utf-8')
    )

    const typesSeen = new Set<string>()
    for (const paint of paints) {
      if (!typesSeen.has(paint.type)) {
        typesSeen.add(paint.type)
        const typeSlug = slugify(paint.type)
        lines.push(
          `INSERT INTO public.product_lines (brand_id, name, slug) VALUES ((SELECT id FROM public.brands WHERE slug = '${esc(brand.id)}'), '${esc(paint.type)}', '${esc(typeSlug)}');`
        )
      }
    }
  }
  lines.push('')

  // ------------------------------------------------------------------
  // 3. Paints
  // ------------------------------------------------------------------
  lines.push('-- ----------------------------------------------------------')
  lines.push('-- Paints')
  lines.push('-- ----------------------------------------------------------')
  lines.push('')

  // Build a lookup: JSON id -> { uuid, brandSlug, paintSlug, typeSlug } for references
  const jsonIdLookup = new Map<
    string,
    { uuid: string; brandSlug: string; paintSlug: string; typeSlug: string }
  >()

  // Collect all comparable entries for step 4
  const references: Array<{
    sourceJsonId: string
    targetJsonId: string
  }> = []

  let totalPaints = 0

  for (const brand of brands) {
    const paintFile = PAINT_FILES[brand.id]
    if (!paintFile) continue
    const paints: PaintJson[] = JSON.parse(
      readFileSync(resolve(DATA_DIR, 'paints', paintFile), 'utf-8')
    )

    // Deduplicate slugs within this brand
    const slugMap = deduplicateSlugs(paints)

    lines.push(`-- ${brand.name} (${paints.length} paints)`)

    for (const paint of paints) {
      const paintSlug = slugMap.get(paint.id) ?? slugify(paint.name)
      const typeSlug = slugify(paint.type)
      const uuid = randomUUID()
      const { r, g, b } = hexToRgb(paint.hex)
      const { h, s, l } = rgbToHsl(r, g, b)
      const isMetallic =
        paint.type.toLowerCase().includes('metallic') ||
        paint.type.toLowerCase().includes('metal')
      const paintType = paint.type.toLowerCase()
      const closestColorSlug = findClosestColor(r, g, b)

      jsonIdLookup.set(paint.id, {
        uuid,
        brandSlug: brand.id,
        paintSlug,
        typeSlug,
      })

      lines.push(
        `INSERT INTO public.paints (id, brand_paint_id, product_line_id, name, slug, hex, r, g, b, hue, saturation, lightness, hue_id, is_metallic, is_discontinued, paint_type) VALUES ('${uuid}', '${esc(paint.id)}', (SELECT pl.id FROM public.product_lines pl JOIN public.brands br ON br.id = pl.brand_id WHERE br.slug = '${esc(brand.id)}' AND pl.slug = '${esc(typeSlug)}'), '${esc(paint.name)}', '${esc(paintSlug)}', '${esc(paint.hex)}', ${r}, ${g}, ${b}, ${round2(h)}, ${round2(s)}, ${round2(l)}, (SELECT id FROM public.hues WHERE slug = '${esc(closestColorSlug)}' AND parent_id IS NOT NULL LIMIT 1), ${isMetallic}, false, '${esc(paintType)}');`
      )

      // Collect references
      if (paint.comparable && paint.comparable.length > 0) {
        for (const comp of paint.comparable) {
          references.push({
            sourceJsonId: paint.id,
            targetJsonId: comp.id,
          })
        }
      }

      totalPaints++
    }
    lines.push('')
  }

  // ------------------------------------------------------------------
  // 4. Paint References
  // ------------------------------------------------------------------
  lines.push('-- ----------------------------------------------------------')
  lines.push(`-- Paint References (${references.length} cross-brand alternatives)`)
  lines.push('-- ----------------------------------------------------------')
  lines.push('')

  let refCount = 0
  for (const ref of references) {
    const source = jsonIdLookup.get(ref.sourceJsonId)
    const target = jsonIdLookup.get(ref.targetJsonId)

    if (!source || !target) {
      console.warn(
        `Warning: Could not resolve reference ${ref.sourceJsonId} -> ${ref.targetJsonId}, skipping`
      )
      continue
    }

    lines.push(
      `INSERT INTO public.paint_references (paint_id, related_paint_id, relationship, similarity_score) VALUES ('${source.uuid}', '${target.uuid}', 'alternative', NULL);`
    )
    refCount++
  }
  lines.push('')

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  lines.push(`-- ==========================================================`)
  lines.push(`-- Summary: ${brands.length} brands, ${totalPaints} paints, ${refCount} references`)
  lines.push(`-- ==========================================================`)

  writeFileSync(OUTPUT_FILE, lines.join('\n') + '\n', 'utf-8')
  console.log(`Seed file written to: ${OUTPUT_FILE}`)
  console.log(`  Brands: ${brands.length}`)
  console.log(`  Paints: ${totalPaints}`)
  console.log(`  References: ${refCount}`)
}

main()
