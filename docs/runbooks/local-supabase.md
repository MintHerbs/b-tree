# Running Supabase locally with Docker

> Status: **Not yet implemented.** This runbook describes the workflow
> we are moving toward — none of the commands below will work until the
> repo gains a `supabase/` config directory and the migration tooling
> from [docs/architecture-update.md §4](../architecture-update.md#4-database-migrations-db-with-a-yaml-manifest)
> lands. Track progress in the issue that will be filed once Phase 2 of
> the migration plan begins.
>
> Until then, point the app at a hosted Supabase project (the values in
> your `.env`) and apply schema by pasting the contents of
> [supabase_messages_table.sql](../../supabase_messages_table.sql) into
> the Supabase SQL editor.

---

## 1. Why local Supabase

Today, every contributor — and every CI run — talks to the same shared
Supabase project. That has three problems:

- **Schema drift.** Anyone running migrations affects everyone else.
- **No offline development.** No internet, no `usePresence`, no chat,
  no AI quota counter.
- **Tests cannot mutate data freely.** Integration tests against the
  shared DB risk corrupting the dev environment.

The Supabase CLI ships a full local stack (Postgres, GoTrue auth,
Storage, Realtime, Studio UI) as Docker containers. Each contributor
gets an isolated copy that matches production semantics.

---

## 2. Prerequisites

- **Docker Desktop** (Windows / macOS) or Docker Engine (Linux),
  running.
- **Supabase CLI** ≥ 1.150 — install with:
  - macOS: `brew install supabase/tap/supabase`
  - Windows (Scoop): `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`
  - npm (cross-platform, dev-dependency): `npm i -D supabase`
- **At least 4 GB free RAM** — Supabase boots ~10 containers.
- **Ports free:** 54321 (Studio), 54322 (Postgres), 54323 (API), 54324
  (Inbucket / email testing), 54327 (Realtime).

Confirm with:

```bash
supabase --version
docker info
```

---

## 3. One-time project setup *(when this lands)*

From the repo root:

```bash
supabase init
```

This creates a `supabase/` directory at the repo root with `config.toml`
and an empty `migrations/` folder. Commit `supabase/config.toml`. Add
`supabase/.branches/`, `supabase/.temp/`, and `supabase/seed.sql`
(generated) to `.gitignore`.

Edit `supabase/config.toml` to match the project's needs:

```toml
[api]
port = 54323
schemas = ["public"]

[db]
port = 54322
major_version = 15

[realtime]
enabled = true

[studio]
enabled = true
port = 54321
```

---

## 4. Day-to-day workflow

### 4.1 Start the stack

```bash
supabase start
```

First run downloads the images (~1.5 GB). Subsequent runs take
10–20 s. When ready, the CLI prints:

```
API URL:        http://localhost:54323
DB URL:         postgresql://postgres:postgres@localhost:54322/postgres
Studio URL:     http://localhost:54321
anon key:       eyJ…           ← copy into .env.local
service_role:   eyJ…           ← server-only, never commit
```

### 4.2 Point the app at it

Create `.env.local` (which `.gitignore` will cover via the
`.env*.local` rule):

```bash
VITE_SUPABASE_URL=http://localhost:54323
VITE_SUPABASE_ANON_KEY=<anon key from `supabase start`>
# After Issue #12 lands, the Gemini key is server-only:
GEMINI_API_KEY=<your dev key>
```

`.env.local` overrides `.env` for Vite, so you can keep your hosted
credentials in `.env` and switch to local just by starting the stack.

### 4.3 Apply our migrations

Until tooling around `db/migrations.yaml` is built (see
[architecture-update.md §4.4](../architecture-update.md#44-application)),
load the SQL files manually in order:

```bash
for f in db/sql/*.sql; do
  psql postgresql://postgres:postgres@localhost:54322/postgres -f "$f"
done
```

Or paste each file into Studio → SQL Editor.

Once the helper script exists, the workflow becomes:

```bash
npm run db:migrate -- --env local
```

### 4.4 Inspect data

Open Studio at <http://localhost:54321>. Tables, RLS policies, and
realtime publications are all browseable.

### 4.5 Reset to a clean DB

```bash
supabase db reset
```

Drops every table and re-applies migrations from
`supabase/migrations/` (or, in our setup, re-runs the `db/sql/` loop).
Use this between integration test runs.

### 4.6 Stop the stack

```bash
supabase stop
```

Stops containers but preserves the data volume. Add `--no-backup` to
drop the data volume too.

---

## 5. Using local Supabase in tests *(planned)*

Once Vitest is in place ([Issue #9](https://github.com/MintHerbs/b-tree/issues/9)),
integration tests will:

1. Start the stack in CI via the `supabase/setup-cli` GitHub Action.
2. Apply migrations with `npm run db:migrate -- --env ci`.
3. Run a `tests/integration/setup.js` that resets the DB before each
   suite.
4. Read `VITE_SUPABASE_URL=http://localhost:54323` from a test-only
   `.env.test`.

The CI workflow will look approximately like:

```yaml
# .github/workflows/ci.yml (excerpt — full version per Issue #9)
- uses: supabase/setup-cli@v1
  with:
    version: latest
- run: supabase start
- run: npm run db:migrate -- --env ci
- run: npm test
- if: always()
  run: supabase stop --no-backup
```

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `supabase start` hangs on "Starting database…" | Port 54322 is in use | `lsof -i :54322` (macOS/Linux) or `netstat -ano \| findstr 54322` (Windows); stop the conflicting process or change the port in `config.toml` |
| `Error: Cannot connect to the Docker daemon` | Docker Desktop not running | Start Docker Desktop, wait for the whale icon to settle |
| Realtime subscription gets no events | Table not in `supabase_realtime` publication | Run `db/sql/0004_realtime_publications.sql` |
| App says "Invalid API key" | `.env.local` still points at hosted project | Restart `npm run dev` after editing `.env.local` — Vite only reads env at boot |
| Containers start but Studio is blank | Browser cached old origin | Hard reload (Ctrl+Shift+R / Cmd+Shift+R) |

---

## 7. What still needs to be built

This runbook describes a workflow that depends on work that has not
landed yet. Concretely:

- [ ] `supabase/config.toml` checked into the repo (`supabase init`)
- [ ] `db/sql/` populated with split migrations (architecture-update §4.2)
- [ ] `db/migrations.yaml` manifest (architecture-update §4.2)
- [ ] `npm run db:migrate` script that walks the manifest
- [ ] Vitest + integration-test scaffolding ([Issue #9](https://github.com/MintHerbs/b-tree/issues/9))
- [ ] CI workflow that runs against local Supabase

Until those land, this document is a target — not a working procedure.
The intent of publishing it now is so contributors know what the
local-dev story will look like, and so PRs that introduce these pieces
have a single place to update.
