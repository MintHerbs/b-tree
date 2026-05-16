# B+ Tree Visualizer & Teaching Tools

A multi-tool teaching app for computer-science students — B+ trees, ER
diagrams, algorithmic complexity, recurrence relations, propositional
logic, and semantic tableaux — with built-in real-time chat, presence,
and AI-assisted explanations.

> The repo is named after its original sole feature; the project has
> since grown into a small constellation of pedagogical tools.

## What's in the app

| Tool | Route | Notes |
|---|---|---|
| B+ Tree Visualizer        | `/tree`                | Animated insert/delete, step playback, pan/zoom canvas |
| ER Diagram Builder        | `/erd`                 | AI-generated schemas from natural-language descriptions (Gemini) |
| Complexity Analyzer       | `/algo/complexity`     | Pasted code → Big-O analysis. Spec: [docs/specs/complexity.md](docs/specs/complexity.md) |
| Recurrence Relation Solver| `/algo/recurrence`     | |
| Logical Equivalence Proof | `/logic/proof`         | Spec: [docs/specs/logic-tools.md](docs/specs/logic-tools.md) |
| Semantic Tableaux         | `/logic/tableaux`      | |
| Real-time chat + presence | global panel + DynamicIsland | Supabase Realtime. Spec: [docs/specs/presence-and-music.md](docs/specs/presence-and-music.md) |

## Stack

- **React 18** (JavaScript — no TypeScript in `src/`, see [docs/rules.md](docs/rules.md))
- **Vite 5** + **React Router v6**
- **CSS Modules** alongside each component, plus a small Tailwind utility layer
- **Supabase** (Postgres + Realtime + presence) — schema in [db/](db/), local-dev stack via `supabase` CLI
- **Google Gemini** for AI features (currently client-side; server proxy planned, see issue #12)
- **Vercel** for hosting

## Running locally

You need **Node ≥ 22.5** (uses Node's built-in `--env-file-if-exists`)
and **Docker Desktop** running (for the local Supabase stack).

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Then edit .env — see step 4 below for values

# 3. Start the local Supabase stack (Postgres + PostgREST + Realtime + Studio)
#    First run downloads ~1.5 GB of Docker images.
npx supabase start

# 4. Copy the URL/keys it prints into .env:
#    VITE_SUPABASE_URL=http://127.0.0.1:54321         (the "Project URL")
#    VITE_SUPABASE_ANON_KEY=sb_publishable_…          (the "Publishable" key)
#    SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
#
#    `npx supabase status` will reprint these any time.

# 5. Apply the database migrations to the local stack
npm run db:migrate

# 6. Start the Vite dev server
npm run dev
```

App will be at <http://localhost:5173>. Supabase Studio is at
<http://127.0.0.1:54323> for poking at the local data.

For the full local-dev workflow — including troubleshooting, migration
drift handling, and how the runner works — see
[docs/runbooks/local-supabase.md](docs/runbooks/local-supabase.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev`                       | Vite dev server with HMR |
| `npm run build`                     | Production build to `dist/` |
| `npm run preview`                   | Serve the production build locally |
| `npm run db:migrate`                | Apply pending DB migrations (reads `.env` and `.env.local` automatically) |
| `npm run db:migrate -- --status`    | List applied vs pending migrations |
| `npm run db:migrate -- --dry-run`   | Show what would run, no writes |

## Documentation

The canonical project docs live in [docs/](docs/):

- [docs/architecture-update.md](docs/architecture-update.md) — **target** project structure (the layout the codebase is migrating toward, in phases). Read this before adding files, moving things, or making structural decisions.
- [docs/documentation.md](docs/documentation.md) — current state of the codebase.
- [docs/design.md](docs/design.md) — colors, fonts, design tokens.
- [docs/rules.md](docs/rules.md) — coding conventions, naming, component structure.
- [docs/specs/](docs/specs/) — per-feature specifications.
- [docs/runbooks/](docs/runbooks/) — operational guides ([local-supabase.md](docs/runbooks/local-supabase.md), more to come).

Schema-of-record for the database lives in [db/](db/) — see
[db/README.md](db/README.md) for migration conventions and the
`schema_migrations` bookkeeping table.

## Contributing

Before adding files or moving things, check
[docs/architecture-update.md §3](docs/architecture-update.md) for the
organising principles. Short version:

- **Feature-first** — code that belongs to one feature lives under
  `src/features/<feature>/`, not flat in `src/components/`.
- **JavaScript only** in `src/` — no new `.tsx` files.
- **CSS Modules** alongside each component; no global stylesheets
  outside [src/styles/global.css](src/styles/global.css).
- **Server boundary** — anything with a secret or quota goes in `/api/`,
  not `src/`. Every `VITE_*` env var ships to the client.

## License

MIT — see [LICENSE.md](LICENSE.md).
