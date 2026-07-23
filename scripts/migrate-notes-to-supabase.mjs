#!/usr/bin/env node
// scripts/migrate-notes-to-supabase.mjs
//
// One-time (idempotent) import of every on-disk note into the Supabase `notes`
// table (E-005 / T-043, Phase A). Safe to re-run: rows are upserted on
// (module_id, path), so a second run is a no-op diff.
//
// Why "all on-disk notes" and not just the modules.js registry: the registry
// had drifted from disk (files present but unregistered, and vice versa).
// Importing from disk guarantees nothing is lost; titles (sidebar labels) come
// from the registry where available, else default to "<basename>.md".
//
// Connection: reads SUPABASE_DB_URL (preferred) or DATABASE_URL — the SAME
// variable scripts/db-migrate.mjs uses. Point it at the target database:
//   • local stack: postgresql://postgres:postgres@127.0.0.1:54322/postgres
//   • prod:        the project's pooler connection string
// Inserts are parameterized (no escaping pitfalls) and run as the connection
// role, which bypasses RLS for seeding.
//
// Usage:
//   SUPABASE_DB_URL=... node scripts/migrate-notes-to-supabase.mjs
//   SUPABASE_DB_URL=... node scripts/migrate-notes-to-supabase.mjs --dry-run

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import pg from 'pg'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const NOTES_ROOT = join(ROOT, 'src', 'content', 'notes')
const MODULES_JS = join(ROOT, 'src', 'components', 'layout', 'Sidebar', 'modules.js')

const { values: flags } = parseArgs({ options: { 'dry-run': { type: 'boolean', default: false } } })

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
if (!dbUrl) {
  console.error('Set SUPABASE_DB_URL (or DATABASE_URL) to the target database.')
  console.error('  local: postgresql://postgres:postgres@127.0.0.1:54322/postgres')
  process.exit(1)
}

const NOTE_ENTRY = /\{\s*filename:\s*'([^']+)'\s*,\s*label:\s*'([^']*)'\s*\}/g
const SUBFOLDERS_FIELD = /subfolders:\s*\[([^\]]*)\]/
const stripMd = (p) => String(p || '').replace(/\.md$/i, '')

/** Parse modules.js text into Map<moduleId, {labels: Map<pathNoMd,label>, subfolders: string[]}>. */
function parseRegistry(source) {
  const result = new Map()
  const ids = [...source.matchAll(/\bid:\s*'([^']+)'/g)]
  for (let i = 0; i < ids.length; i++) {
    const moduleId = ids[i][1]
    const block = source.slice(ids[i].index, i + 1 < ids.length ? ids[i + 1].index : source.length)
    const labels = new Map()
    for (const [, filename, label] of block.matchAll(NOTE_ENTRY)) labels.set(stripMd(filename), label)
    const sf = block.match(SUBFOLDERS_FIELD)
    const subfolders = sf ? [...sf[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : []
    if (!result.has(moduleId)) result.set(moduleId, { labels, subfolders })
  }
  return result
}

function walkMd(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walkMd(full, acc)
    else if (name.toLowerCase().endsWith('.md')) acc.push(full)
  }
  return acc
}

if (!existsSync(NOTES_ROOT)) {
  console.error(`No notes directory at ${NOTES_ROOT}`)
  process.exit(1)
}

const registry = parseRegistry(readFileSync(MODULES_JS, 'utf8'))
const files = walkMd(NOTES_ROOT)
const rows = []
let registered = 0
let unregistered = 0

for (const file of files) {
  const rel = relative(NOTES_ROOT, file).split(sep).join('/')
  const firstSlash = rel.indexOf('/')
  if (firstSlash === -1) continue
  const moduleId = rel.slice(0, firstSlash)
  const path = stripMd(rel.slice(firstSlash + 1))
  const base = path.split('/').pop()
  const label = registry.get(moduleId)?.labels.get(path)
  if (label) registered++
  else unregistered++
  rows.push({ moduleId, path, title: label || `${base}.md`, content: readFileSync(file, 'utf8') })
}

const folderRows = []
for (const [moduleId, { subfolders }] of registry) {
  for (const name of subfolders) folderRows.push({ moduleId, name })
}

console.log(`Discovered ${rows.length} notes (${registered} registered, ${unregistered} unregistered) and ${folderRows.length} explicit folders.`)
if (flags['dry-run']) {
  console.log('--dry-run set; not writing.')
  process.exit(0)
}

const client = new pg.Client({ connectionString: dbUrl })
await client.connect()
try {
  await client.query('begin')
  for (const r of rows) {
    await client.query(
      `insert into public.notes (module_id, path, title, content_md)
       values ($1, $2, $3, $4)
       on conflict (module_id, path) do update
         set title = excluded.title, content_md = excluded.content_md`,
      [r.moduleId, r.path, r.title, r.content]
    )
  }
  for (const f of folderRows) {
    await client.query(
      `insert into public.note_folders (module_id, name) values ($1, $2)
       on conflict (module_id, name) do nothing`,
      [f.moduleId, f.name]
    )
  }
  await client.query('commit')
  const { rows: countRows } = await client.query('select count(*)::int as n from public.notes')
  console.log(`Done. notes table now holds ${countRows[0].n} rows.`)
} catch (err) {
  await client.query('rollback').catch(() => {})
  console.error('Import failed (rolled back):', err.message)
  process.exit(1)
} finally {
  await client.end()
}
