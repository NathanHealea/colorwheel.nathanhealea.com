import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// Types for the JSON data structures
// ---------------------------------------------------------------------------

interface GradientGroupJson {
  name: string
  slug: string
  paintIds: string[]
}

interface GradientGroupsFile {
  brandSlug: string
  productLineSlug: string
  groups: GradientGroupJson[]
}

interface PaintJson {
  id: string
  name: string
  hex: string
  type: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url))
const INPUT_FILE = resolve(
  __dirname,
  'data',
  'paint-groups',
  'army-painter-fanatic.json'
)
const PAINTS_FILE = resolve(__dirname, 'data', 'paints', 'army-painter.json')
const MIGRATION_FILE = resolve(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '20260702000001_seed_army_painter_fanatic_gradient_groups.sql'
)
const SEED_FILE = resolve(__dirname, '..', 'supabase', 'seeds', 'gradient-groups.sql')

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Escape single quotes for SQL string literals. */
function esc(value: string): string {
  return value.replace(/'/g, "''")
}

/** WCAG relative luminance of a #RRGGBB hex color (0 = black, 1 = white). */
function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const channel = (offset: number): number => {
    const c = parseInt(h.slice(offset, offset + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

function main(): void {
  const file: GradientGroupsFile = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'))
  const paints: PaintJson[] = JSON.parse(readFileSync(PAINTS_FILE, 'utf-8'))
  const paintsById = new Map(paints.map((p) => [p.id, p]))

  const { brandSlug, productLineSlug, groups } = file

  // -------------------------------------------------------------------
  // Validate: every paint id resolves, no paint appears in two groups,
  // and each group's curated order runs dark -> light overall. Positions
  // in the data file are authoritative (they follow the official chart),
  // so local luminance inversions only warn — a reversed group fails.
  // -------------------------------------------------------------------
  const seen = new Set<string>()
  for (const group of groups) {
    if (group.paintIds.length < 2) {
      throw new Error(`Group "${group.slug}" has fewer than 2 paints`)
    }
    for (const id of group.paintIds) {
      if (!paintsById.has(id)) {
        throw new Error(`Group "${group.slug}" references unknown paint id "${id}"`)
      }
      if (seen.has(id)) {
        throw new Error(`Paint id "${id}" appears in more than one group`)
      }
      seen.add(id)
    }

    const luminances = group.paintIds.map((id) =>
      relativeLuminance(paintsById.get(id)!.hex)
    )
    if (luminances[0] > luminances[luminances.length - 1]) {
      throw new Error(
        `Group "${group.slug}" runs light -> dark; expected dark -> light order`
      )
    }
    for (let i = 1; i < luminances.length; i++) {
      if (luminances[i] < luminances[i - 1]) {
        const prev = paintsById.get(group.paintIds[i - 1])!
        const curr = paintsById.get(group.paintIds[i])!
        console.warn(
          `Warning: luminance inversion in "${group.slug}": ` +
            `${prev.name} (${prev.hex}) -> ${curr.name} (${curr.hex}); ` +
            `keeping official chart order`
        )
      }
    }
  }

  // -------------------------------------------------------------------
  // Build SQL statements. INSERT ... SELECT so rows are only inserted
  // when the referenced brand / product line / paint rows exist — the
  // migration no-ops on a fresh local database (paints arrive via
  // seed.sql after migrations) and takes effect wherever paints exist.
  // -------------------------------------------------------------------
  const lines: string[] = []

  lines.push('-- ----------------------------------------------------------')
  lines.push(`-- Gradient groups (${groups.length})`)
  lines.push('-- ----------------------------------------------------------')
  lines.push('')

  groups.forEach((group, index) => {
    lines.push(
      `INSERT INTO public.paint_gradient_groups (product_line_id, name, slug, position) SELECT pl.id, '${esc(group.name)}', '${esc(group.slug)}', ${index + 1} FROM public.product_lines pl JOIN public.brands br ON br.id = pl.brand_id WHERE br.slug = '${esc(brandSlug)}' AND pl.slug = '${esc(productLineSlug)}' ON CONFLICT (product_line_id, slug) DO NOTHING;`
    )
  })
  lines.push('')

  const memberCount = groups.reduce((n, g) => n + g.paintIds.length, 0)
  lines.push('-- ----------------------------------------------------------')
  lines.push(`-- Gradient group members (${memberCount}, position 1 = darkest)`)
  lines.push('-- ----------------------------------------------------------')
  lines.push('')

  for (const group of groups) {
    lines.push(`-- ${group.name}`)
    group.paintIds.forEach((paintId, index) => {
      lines.push(
        `INSERT INTO public.paint_gradient_group_members (group_id, paint_id, position) SELECT g.id, p.id, ${index + 1} FROM public.paint_gradient_groups g JOIN public.product_lines pl ON pl.id = g.product_line_id JOIN public.brands br ON br.id = pl.brand_id JOIN public.paints p ON p.product_line_id = pl.id AND p.brand_paint_id = '${esc(paintId)}' WHERE br.slug = '${esc(brandSlug)}' AND pl.slug = '${esc(productLineSlug)}' AND g.slug = '${esc(group.slug)}' ON CONFLICT DO NOTHING;`
      )
    })
    lines.push('')
  }

  const body = lines.join('\n')
  const summary = `-- Summary: ${groups.length} groups, ${memberCount} members`

  const migrationHeader = [
    '-- Seed Army Painter Fanatic gradient groups',
    '-- Auto-generated by scripts/generate-gradient-group-seed.ts — do not edit by hand.',
    '--',
    '-- Statements use INSERT ... SELECT so they only take effect where the',
    '-- Army Painter Fanatic paints already exist (e.g. production). On a fresh',
    '-- local database this migration no-ops; supabase/seeds/gradient-groups.sql',
    '-- (identical statements, run after seed.sql) covers local resets.',
    '',
  ].join('\n')

  const seedHeader = [
    '-- Seed Army Painter Fanatic gradient groups (local db reset)',
    '-- Auto-generated by scripts/generate-gradient-group-seed.ts — do not edit by hand.',
    '--',
    '-- Runs after seed.sql (see [db.seed] sql_paths in supabase/config.toml),',
    '-- once the Army Painter Fanatic paints exist. Identical statements ship in',
    '-- the 20260702000001 migration for environments seeded via migrations.',
    '',
  ].join('\n')

  // Local-only repair for a supabase/postgres image regression (17.6.1.140).
  // That image ships broken default privileges for objects created by the
  // `postgres` role (the role that runs migrations): tables lose
  // SELECT/INSERT/UPDATE/DELETE and functions lose EXECUTE for the API roles,
  // so PostgREST returns "permission denied" before RLS is even evaluated.
  // Appended to the seed file only (never the migration) — hosted Supabase
  // manages these grants itself. No-op on a healthy image.
  const grantsBlock = [
    '-- ----------------------------------------------------------',
    '-- Local API role grants repair (supabase/postgres 17.6.1.140 regression)',
    '-- ----------------------------------------------------------',
    '--',
    '-- That image ships broken default privileges for objects created by the',
    '-- `postgres` role (the role that runs migrations): tables lose',
    '-- SELECT/INSERT/UPDATE/DELETE and functions lose EXECUTE for the API roles',
    '-- (`anon`, `authenticated`, `service_role`), so PostgREST returns',
    '-- "permission denied" for every table before RLS is even evaluated.',
    '--',
    '-- Local only — hosted Supabase manages these grants itself and this file',
    '-- never runs there. On a healthy image every statement is a no-op.',
    '',
    'GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;',
    '',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;',
    'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;',
    'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;',
    '',
    'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public',
    '  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;',
    'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public',
    '  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;',
    'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public',
    '  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;',
    '',
    '-- Re-apply deliberate lockdowns that the blanket function grant above undoes.',
    '-- See 20260417000000_admin_profile_operations.sql: authenticated-only RPC.',
    'REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;',
  ].join('\n')

  writeFileSync(MIGRATION_FILE, `${migrationHeader}\n${body}\n${summary}\n`, 'utf-8')
  mkdirSync(dirname(SEED_FILE), { recursive: true })
  writeFileSync(
    SEED_FILE,
    `${seedHeader}\n${body}\n${summary}\n\n${grantsBlock}\n`,
    'utf-8'
  )

  console.log(`Migration written to: ${MIGRATION_FILE}`)
  console.log(`Seed file written to: ${SEED_FILE}`)
  console.log(`  Groups: ${groups.length}`)
  console.log(`  Members: ${memberCount}`)
}

main()
