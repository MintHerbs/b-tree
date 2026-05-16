# db/

Database schema and migrations for the b-tree project's Supabase
backend. The shape of this directory follows
[docs/architecture-update.md §4](../docs/architecture-update.md).

```
db/
├── migrations.yaml     Ordered manifest — the source of truth for migration order
├── sql/                One numbered SQL file per migration
├── seeds/              Optional dev/test seed data (not applied automatically)
└── README.md           This file
```

## How it works

- `migrations.yaml` lists every migration in the order it must be
  applied. The numeric prefix on each SQL file (`0001_`, `0002_`, …)
  matches its `id:` in the manifest. The manifest is the ordering
  authority; the filenames are a convenience for humans browsing
  `sql/`.
- Each SQL file is written to be **idempotent** — re-running an applied
  migration is a no-op (`CREATE … IF NOT EXISTS`, guarded `DO` blocks,
  `DROP POLICY IF EXISTS` before `CREATE POLICY`, etc.). This makes it
  safe to re-apply the full manifest after pulling main.
- Each file addresses **one concern**: one table, one set of related
  policies, or one publication change.

## Current migrations

| id   | file                              | what it creates                                       |
|------|-----------------------------------|-------------------------------------------------------|
| 0001 | `sql/0001_init_messages.sql`      | `messages` table + RLS for the public chat            |
| 0002 | `sql/0002_init_sessions.sql`      | `sessions` table backing `usePresence` / chat upsert  |
| 0003 | `sql/0003_init_api_calls.sql`     | `api_calls` table for per-session Gemini quota        |
| 0004 | `sql/0004_realtime_publications.sql` | adds `messages` to the `supabase_realtime` publication |
| 0005 | `sql/0005_init_subjects.sql`      | `subjects` table (IT, Economics, …); admin-curated, public read |
| 0006 | `sql/0006_init_posts.sql`          | `posts` table — anonymous feed posts                  |
| 0007 | `sql/0007_init_post_votes.sql`     | `post_votes` + vote-count sync trigger                |
| 0008 | `sql/0008_init_post_flags.sql`     | `post_flags`, `flagged_posts_review`, auto-flag trigger |
| 0009 | `sql/0009_init_comments.sql`       | `comments` + depth-enforcement trigger                |
| 0010 | `sql/0010_init_comment_votes.sql`  | `comment_votes` + vote-count sync trigger             |
| 0011 | `sql/0011_init_polls.sql`          | `polls` + `poll_votes`                                |
| 0012 | `sql/0012_init_rate_limits.sql`    | `rate_limits` + `bot_blacklist`                       |
| 0013 | `sql/0013_social_rls.sql`          | RLS policies for all social tables                    |
| 0014 | `sql/0014_social_rpcs.sql`         | Server-side RPCs (session, rate limit, bot, soft-delete) |
| 0015 | `sql/0015_social_realtime.sql`     | Realtime publication for social tables                |

The tables these migrations declare already exist in the live Supabase
project — the migrations were extracted from the live schema so the
repo finally has a written record. Re-applying them against the live
project is a no-op.

## Applying migrations

Use the runner — [scripts/db-migrate.mjs](../scripts/db-migrate.mjs),
wrapped as `npm run db:migrate`:

```bash
npm run db:migrate                  # apply pending migrations
npm run db:migrate -- --status      # list applied vs pending, no writes
npm run db:migrate -- --dry-run     # show what would run, no writes
```

The runner reads `SUPABASE_DB_URL` from `.env` and `.env.local`
automatically (via Node's built-in `--env-file-if-exists`), so no
manual env export is needed. `.env.local` overrides `.env` for the
same keys — useful when you want to keep hosted credentials in `.env`
and switch to local just by setting `SUPABASE_DB_URL` in `.env.local`.

The runner applies anything not yet recorded in
`public.schema_migrations` on the target database (creating that
table on first run) and records each successful application. Each
migration runs in its own transaction — a failure rolls back both the
schema change and the bookkeeping row.

For a step-by-step local-dev walkthrough including Docker prereqs and
`.env.local`, see
[docs/runbooks/local-supabase.md](../docs/runbooks/local-supabase.md).

### Bookkeeping: `public.schema_migrations`

The runner maintains:

```
schema_migrations
  id          TEXT PRIMARY KEY     -- "0001", "0002", …
  file        TEXT                 -- "sql/0001_init_messages.sql"
  checksum    TEXT                 -- truncated SHA-256 of the SQL file
  applied_at  TIMESTAMPTZ          -- when this runner inserted the row
```

This table is **owned by the runner**, not by a SQL migration. Do not
add a `db/sql/00NN_schema_migrations.sql` — the runner bootstraps the
table itself, which avoids the chicken-and-egg of "how do you track
that the tracking table is applied?"

If you edit a migration file after it has been applied, the runner
will detect the checksum mismatch and refuse to proceed. The fix is
always: add a new migration, never edit the old one.

### Fallback: manual application

If for some reason you can't use the runner (e.g. running a one-off
fix against the hosted project from the Supabase dashboard), paste
each `db/sql/*.sql` file's contents into Supabase Studio → **SQL
Editor** in numeric order. The SQL files are idempotent, so this is
safe — but `schema_migrations` won't be updated, so the next runner
invocation against that database will re-run them (still a no-op,
just slower).

## Adding a new migration

1. Pick the next 4-digit `id` (one above the current max).
2. Create `sql/<id>_<short_snake_case_description>.sql`.
3. Make every statement idempotent.
4. Add a new entry under `migrations:` in `migrations.yaml` with:
   - `id` matching the filename prefix
   - `file` relative to `db/`
   - `description` one line
   - `author`, `created` (today's date), `applied_envs: []`
   - `related_issues:` if any
5. Bump `schema_version` at the top of `migrations.yaml`.
6. Apply the migration to dev. Update `applied_envs` to `[dev]`.
7. Commit both files.

**Never edit an already-applied migration.** If you need to change
schema, write a new migration that supersedes it.

## Conventions

- 4-digit zero-padded ids (`0001`, `0002`, …).
- File name: `<id>_<short_snake_case>.sql`.
- One table, one set of policies, or one publication change per file.
- Idempotent statements only (`IF NOT EXISTS`, `OR REPLACE`,
  `DROP IF EXISTS` before `CREATE`).
- Lowercase identifiers; ANSI SQL where possible; PostgreSQL-specific
  features (`DO $$ … $$`, `ALTER PUBLICATION`) only when necessary.
- Comments inside SQL files explain the **why**, not the **what** —
  the schema speaks for itself.

## Verification

After applying, sanity-check from `psql` or the SQL Editor:

```sql
-- Tables exist
SELECT table_name
FROM   information_schema.tables
WHERE  table_schema = 'public'
  AND  table_name IN ('messages', 'sessions', 'api_calls')
ORDER  BY table_name;

-- RLS is enabled on each
SELECT relname, relrowsecurity
FROM   pg_class
WHERE  relname IN ('messages', 'sessions', 'api_calls');

-- messages is published for realtime
SELECT pubname, schemaname, tablename
FROM   pg_publication_tables
WHERE  pubname = 'supabase_realtime'
  AND  tablename = 'messages';
```

## Seeds

`seeds/` carries optional sample data for local development. Seeds are
**not** part of the migration manifest and are never applied
automatically — load them by hand when you want them.
