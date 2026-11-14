# MegaInfomatix

Production-oriented foundation for a three-layer application:

| Layer | Tech | Responsibility |
|---|---|---|
| `client/` | React 19, React Router 7, Vite | User interface |
| `server/` | Node.js, Express 5, Knex | Primary REST API, auth, validation, database access |
| `python/` | Python 3, pandas, SQLAlchemy, FastAPI | Data monitoring, analysis, reporting |

> **Status:** Phase 1 (technical foundation). The final **Index page** is delivered in Phase 2; the
> current home page is a temporary "Coming soon" placeholder.

## Architecture

```text
                 ┌────────────────────┐
                 │   React Frontend   │  :3000
                 └─────────┬──────────┘
                           │ REST (JSON, JWT)
                           ▼
                 ┌────────────────────┐
                 │ Node.js + Express  │  :5050   ← the only public API
                 └───────┬───────┬────┘
                         │       │ HTTP (internal, PYTHON_SERVICE_URL)
                         ▼       ▼
                  ┌──────────┐  ┌──────────────────┐
                  │ Database │◄─┤ Python Layer     │  :8000
                  └──────────┘  │ monitor/analyse/ │
                                │ report           │
                                └──────────────────┘
```

- The browser only talks to Node.js. Node authenticates requests and forwards
  `/api/monitoring`, `/api/analysis` and `/api/reports` to the Python service.
- Node.js **owns the schema** (Knex migrations). Python **reads** the same database.
- Python pipeline: `Data Source → Collection → Monitoring → Processing → Analysis → Report → API`.

## Project structure

```text
megainfomatix/
├── client/                         React frontend
│   ├── public/favicon.svg
│   ├── index.html                  Vite entry HTML
│   └── src/
│       ├── components/             Navbar, ProtectedRoute, Loader, SystemStatus
│       ├── config/                 env.js (VITE_* vars), navigation.js (nav items)
│       ├── context/                AuthContext (session state)
│       ├── hooks/                  useAuth, useAsync
│       ├── layouts/                MainLayout (navbar + <Outlet/> + footer)
│       ├── pages/                  Home (temporary), NotFound, ErrorPage
│       ├── routes/index.jsx        Route registry (add pages here)
│       ├── services/               api.js (HTTP client), authService, systemService
│       ├── styles/global.css       Design tokens + base styles (light/dark)
│       ├── utils/helpers.js
│       ├── App.jsx                 Providers + router
│       └── main.jsx
├── server/                         Node.js + Express API
│   ├── knexfile.js                 Knex CLI config
│   ├── tests/api.test.js
│   └── src/
│       ├── config/                 env.js (validated config), db.js (Knex connection)
│       ├── controllers/            auth, user, health, python (proxy)
│       ├── database/migrations/    Schema migrations
│       ├── middleware/             auth (JWT), validate, errorHandler
│       ├── models/User.js          Data access for users
│       ├── routes/                 index.js (module registry) + one file per module
│       ├── services/               auth, user, python (business logic)
│       ├── utils/                  response.js (JSON envelope), ApiError.js
│       ├── app.js                  Express app (middleware + routes)
│       └── server.js               Entry: DB check, migrations, listen, shutdown
├── python/                         Monitoring, analysis, reporting
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── tests/
│   └── src/
│       ├── config/config.py        Settings from .env
│       ├── database/db.py          SQLAlchemy engine, shared DATABASE_URL parsing
│       ├── monitoring/monitor.py   Metrics, change + anomaly detection, history
│       ├── analysis/analyzer.py    Statistical summaries, chart-ready datasets
│       ├── reports/report_generator.py
│       ├── api/app.py              Internal FastAPI service (called by Node)
│       ├── utils/helpers.py
│       ├── pipeline.py             End-to-end pipeline
│       └── main.py                 CLI: run | monitor | serve
├── data/                           SQLite database (created at runtime, git-ignored)
├── package.json                    Root scripts
└── .gitignore
```

## Prerequisites

- Node.js 20+ (developed on 24)
- npm 10+
- Python 3.11+ (developed on 3.14)

## Installation

One command from the project root:

```bash
npm run setup
```

Or step by step:

```bash
npm install                                  # root tools (concurrently)
npm install --prefix server
npm install --prefix client
cd python && python3 -m venv venv && source venv/bin/activate && pip install -r requirements-dev.txt
```

## Configuration

Each layer has its own `.env` (git-ignored) and a committed `.env.example`:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
cp python/.env.example python/.env
```

Then in `server/.env`, set **`JWT_SECRET`** to a long random value:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Variable | Layer | Default | Purpose |
|---|---|---|---|
| `PORT` | server | `5050` | API port. Not 5000, because macOS AirPlay Receiver uses that port. |
| `NODE_ENV` | server | `development` | `production` hides error details, requires a real `JWT_SECRET` |
| `CLIENT_URL` | server | `http://localhost:3000` | CORS origin(s), comma-separated |
| `DATABASE_URL` | server, python | `sqlite:///data/megainfomatix.db` | Shared database URL |
| `DB_SSL` | server | `false` | Enable TLS for PostgreSQL |
| `DB_AUTO_MIGRATE` | server | `true` (non-prod) | Apply migrations on start |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | server | — / `1d` | Token signing |
| `PYTHON_SERVICE_URL` | server | `http://localhost:8000` | Python over HTTP (`main.py serve`) |
| `PYTHON_BIN` | server | – | Python over CLI instead (runs `main.py query …` on demand; used in production) |
| `SERVE_CLIENT` / `TRUST_PROXY` / `CANONICAL_HOST` | server | off | Production: serve the React build, trust the proxy, redirect to one https host |
| `VITE_API_URL` | client | `http://localhost:5050/api` | API base URL used by the browser |
| `MONITORING_INTERVAL_SECONDS` | python | `60` | Scheduled monitoring interval |
| `ANOMALY_ZSCORE_THRESHOLD` | python | `3.0` | Anomaly sensitivity |
| `REPORTS_DIR` | python | `output/reports` | Where reports are written |
| `PYTHON_SERVICE_HOST` / `_PORT` | python | `127.0.0.1` / `8000` | Internal API bind address |

## Database configuration

The database engine is chosen by the `DATABASE_URL` scheme, so you can switch databases
without changing any code. Use the **same value** in `server/.env` and `python/.env`.

| Database | `DATABASE_URL` | Extra driver |
|---|---|---|
| SQLite (default) | `sqlite:///data/megainfomatix.db` (relative to project root) | none |
| PostgreSQL | `postgresql://user:pass@localhost:5432/megainfomatix` | Python: `pip install "psycopg[binary]"` |
| MySQL (production) | `mysql://user:pass@localhost:3306/megainfomatix` | included (`mysql2`, `PyMySQL`) |

Migrations:

```bash
npm run db:migrate                                              # apply (also runs automatically in dev)
npm run db:rollback --prefix server                             # undo last batch
npm run db:make-migration --prefix server -- add_orders_table   # new migration file
```

## Running

Everything at once (server + client + Python service):

```bash
npm run dev
```

Or each in its own terminal:

```bash
npm run server          # API         → http://localhost:5050/api
npm run client          # React app   → http://localhost:3000
npm run python:serve    # Python API  → http://localhost:8000 (docs at /docs)
```

Python batch / scheduled jobs:

```bash
npm run python:run                                           # full pipeline once → python/output/reports/
npm run python:monitor                                       # monitor every MONITORING_INTERVAL_SECONDS
cd python && venv/bin/python src/main.py monitor --once      # one snapshot
```

## API

All responses use one envelope:

```json
{ "success": true,  "message": "…", "data": { }, "meta": { } }
{ "success": false, "message": "…", "errors": [ { "field": "email", "message": "…" } ] }
```

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | – | API, database and Python service status |
| POST | `/api/auth/register` | – | `{ name, email, password }` → `{ user, token }` |
| POST | `/api/auth/login` | – | `{ email, password }` → `{ user, token }` |
| GET | `/api/auth/me` | ✔ | Current user |
| GET | `/api/users?page=&limit=` | ✔ | Paginated user list |
| GET | `/api/users/:id` | ✔ | Single user |
| GET | `/api/monitoring` | ✔ | Fresh monitoring snapshot (Python) |
| GET | `/api/analysis` | ✔ | Analysis summary (Python) |
| GET | `/api/reports/latest` | ✔ | Most recent report (Python) |
| POST | `/api/reports` | ✔ | Run the pipeline and generate a report (Python) |

Authenticated requests send `Authorization: Bearer <token>`.

Status codes: `200`/`201` success · `400` malformed JSON · `401` missing or invalid token ·
`403` forbidden · `404` not found · `409` duplicate · `422` validation ·
`502`/`503` Python service unreachable or not configured.

## Testing

```bash
npm test                         # server + python
npm test --prefix server         # API tests (node:test + supertest, in-memory SQLite)
npm run test:python              # pytest
npm run build                    # client production build as a smoke test
```

Manual smoke test with the server running:

```bash
curl http://localhost:5050/api/health

TOKEN=$(curl -s -X POST http://localhost:5050/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo","email":"demo2@example.com","password":"password123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')

curl http://localhost:5050/api/users     -H "Authorization: Bearer $TOKEN"
curl http://localhost:5050/api/analysis  -H "Authorization: Bearer $TOKEN"
```

## Extending the project

**New API module** (e.g. notifications):
1. `server/src/models/Notification.js`, `services/notificationService.js`,
   `controllers/notificationController.js`, `routes/notificationRoutes.js`
2. Register it with one line in `server/src/routes/index.js`.
3. Add a migration if the module needs tables: `npm run db:make-migration --prefix server -- create_notifications`.

**New page**:
1. `client/src/pages/MyPage.jsx`
2. Add the route in `client/src/routes/index.jsx` (inside the `ProtectedRoute` block if it requires sign-in).
3. Optionally add a link in `client/src/config/navigation.js`.
4. Put its API calls in `client/src/services/myFeatureService.js` using `api`.

**New metric or analysis**: extend `MonitoringService.collect_metrics()` or add a function in
`python/src/analysis/`, then expose it through `python/src/api/app.py` and a forwarding
route in Node.

## Phase 2: Index page

The final Index page replaces `client/src/pages/Home.jsx`. You can either replace that
component, or create a new page and point the `index: true` route in `client/src/routes/index.jsx`
at it. If the Index page needs its own full-screen shell, add it as a separate top-level route
with its own layout. Global theme tokens live in `client/src/styles/global.css`.

## SEO

Pre-rendered pages, meta tags, structured data, sitemap and robots.txt are generated on every build.
See [SEO.md](SEO.md) for how it works, how to change the wording and how to add pages that rank.

## Deployment

Production runs on GoDaddy cPanel hosting at **https://megainfomatix.com**, with one Node app serving the
React build and `/api`, MySQL, and Python run on demand plus a cron job. Deploy updates with `./scripts/deploy.sh`.
See [DEPLOYMENT.md](DEPLOYMENT.md).

## Notes

- Registration is currently open and every new user gets the `user` role. Restrict or seed an
  admin account before going to production; `authorize('admin')` middleware is ready to use.
- The Python service has no authentication of its own. Bind it to `127.0.0.1` or a private
  network, never to a public interface.
- On Windows, replace `venv/bin/python` in the root scripts with `venv\Scripts\python`.
