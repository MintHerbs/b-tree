# Running Supabase locally with Docker

> Status: **Working procedure** for everything below except §5 (CI
> integration) and the `npm run db:migrate` helper called out in §4.3
> and §7. The CLI is installed as a dev dependency, and the schema in
> [db/sql/](../../db/) can be applied to a local stack today.

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
  **running** — not just installed.
- **Supabase CLI** — already pinned in [package.json](../../package.json)
  as a dev dependency, invoked via `npx supabase`. No global install
  needed.
  - If you prefer a machine-wide CLI on Windows, Scoop also works:
    `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git && scoop install supabase`
    Do **not** run `npm i -g supabase` — Supabase explicitly does not
    support global npm installs.
- **At least 4 GB free RAM** — the local stack boots ~10 containers.
- **Ports free on `127.0.0.1`:** `54321` (API / PostgREST), `54322`
  (Postgres), `54323` (Studio), `54324` (Inbucket / email testing),
  `54327` (Realtime).

Confirm with:

```powershell
# PowerShell
npx supabase --version
docker info
```

```bash
# bash
npx supabase --version
docker info
```

---

## 3. One-time project setup

Already done — installing the `supabase` dev dependency emitted
`supabase/config.toml` (default settings, ports as listed in §2) and
`supabase/.gitignore`. Both are committed. Re-running
`npx supabase init` would prompt you to overwrite; don't.

The CLI also creates `supabase/.branches/` and `supabase/.temp/` at
runtime. They are covered by `supabase/.gitignore`, so they shouldn't
appear in `git status`.

**Important:** the Supabase CLI has its own `supabase/migrations/`
system. **We are not using it.** Our schema source of truth lives in
[db/sql/](../../db/) with a YAML manifest, per
[architecture-update.md §4](../architecture-update.md#4-database-migrations-db-with-a-yaml-manifest).
Don't run `supabase migration new` or `supabase db diff` — they will
create a parallel structure and confuse the source of truth.

---

## 4. Day-to-day workflow

### 4.1 Start the stack

```bash
npx supabase start
```

First run downloads the images (~1.5 GB). Subsequent runs take
10–20 s. When ready, the CLI prints something like:

```
API URL:         http://127.0.0.1:54321
GraphQL URL:     http://127.0.0.1:54321/graphql/v1
DB URL:          postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL:      http://127.0.0.1:54323
Inbucket URL:    http://127.0.0.1:54324
JWT secret:      …
anon key:        eyJ…                ← copy into .env.local
service_role key: eyJ…               ← server-only, never commit
```

### 4.2 Point the app at it

Create `.env.local` at the repo root (Vite reads it after `.env` and
overrides matching keys, so your hosted credentials in `.env` stay
intact):

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from `supabase start`>
# Once Issue #12 lands, the Gemini key becomes server-only:
GEMINI_API_KEY=<your dev key>
```

`VITE_SUPABASE_URL` is the **API URL** (`54321`), not the Studio URL
(`54323`). The browser client talks to PostgREST.

Restart `npm run dev` after editing `.env.local` — Vite reads env
once at boot.

### 4.3 Apply our migrations

Use the runner — [scripts/db-migrate.mjs](../../scripts/db-migrate.mjs)
via `npm run db:migrate`.

```bash
npm run db:migrate                  # apply pending migrations
npm run db:migrate -- --status      # list applied vs pending
npm run db:migrate -- --dry-run     # show what would run, no writes
npm run db:migrate -- --help
```

(The `--` is npm's required separator so the flags reach the script
instead of npm itself.)

The runner reads `SUPABASE_DB_URL` from `.env` and `.env.local` on
every invocation via Node's `--env-file-if-exists`. For local
development that variable should be:

```
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

(`.env` already has this line.) `.env.local` overrides `.env` for the
same keys, so you can keep hosted credentials in `.env` and put the
local URL in `.env.local` when you want to develop against the local
stack.

Each applied migration is recorded in `public.schema_migrations` on
the target database — re-running is fast (it skips what's already
applied) and editing an applied migration is detected as drift and
refused. See [db/README.md](../../db/README.md) for the bookkeeping
schema.

No host `psql` needed — the runner uses the `pg` node client over the
DB URL.

### 4.4 Inspect data

Open Studio at <http://127.0.0.1:54323>. Tables, RLS policies, and
realtime publications are all browseable.

### 4.5 Reset to a clean DB

```bash
npx supabase db reset
```

Drops every table and re-applies anything in `supabase/migrations/`
(which for us is empty — see §3). To re-seed our schema, re-run the
loop from §4.3 afterwards. Use this between integration test runs.

### 4.6 Stop the stack

```bash
npx supabase stop
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
4. Read `VITE_SUPABASE_URL=http://127.0.0.1:54321` from a test-only
   `.env.test`.

The CI workflow will look approximately like:

```yaml
# .github/workflows/ci.yml (excerpt — full version per Issue #9)
- uses: supabase/setup-cli@v1
  with:
    version: latest
- run: npx supabase start
- run: npm run db:migrate -- --env ci
- run: npm test
- if: always()
  run: npx supabase stop --no-backup
```

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `supabase start` hangs on "Starting database…" | Port `54322` is in use | PowerShell: `Get-NetTCPConnection -LocalPort 54322`; bash: `lsof -i :54322`; stop the conflicting process or override the port in `supabase/config.toml` |
| `Error: Cannot connect to the Docker daemon` | Docker Desktop not running | Start Docker Desktop, wait for the whale icon to settle |
| Realtime subscription gets no events | `messages` not in `supabase_realtime` publication on the local instance | Re-apply [db/sql/0004_realtime_publications.sql](../../db/sql/0004_realtime_publications.sql) |
| App says "Invalid API key" | `.env.local` still points at hosted project, or you used the Studio URL (`54323`) instead of the API URL (`54321`) | Fix `VITE_SUPABASE_URL`, then restart `npm run dev` — Vite only reads env at boot |
| Containers start but Studio is blank | Browser cached old origin | Hard reload (Ctrl+Shift+R / Cmd+Shift+R) |
| `npm run db:migrate` says "Drift detected" | A SQL file was edited after its migration was applied | Don't edit applied migrations. Add a new migration that supersedes it; commit; re-run. If this is a throwaway local DB, `npx supabase stop --no-backup && npx supabase start` and re-apply from scratch |
| `npm run db:migrate` errors `ECONNREFUSED 127.0.0.1:54322` | Local stack not started | `npx supabase start`, then re-run |

---

## 7. What still needs to be built

- [x] Supabase CLI installed as a dev dependency
- [x] [db/sql/](../../db/) populated with split migrations
- [x] [db/migrations.yaml](../../db/migrations.yaml) manifest
- [x] `supabase/config.toml` checked into the repo
- [x] `npm run db:migrate` walks the manifest and tracks applied state in `public.schema_migrations`
- [ ] Vitest + integration-test scaffolding ([Issue #9](https://github.com/MintHerbs/b-tree/issues/9))
- [ ] CI workflow that runs against local Supabase
