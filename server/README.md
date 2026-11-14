# Server — Node.js + Express

Primary REST API: authentication, validation, database access, and a gateway to the Python analytics service.

## Commands

```bash
npm install
npm run dev                 # watch mode (http://localhost:5050/api)
npm start                   # production start
npm test                    # API tests (in-memory SQLite)
npm run db:migrate          # apply migrations
npm run db:rollback
npm run db:make-migration -- <name>
```

## Request flow

```text
routes/<module>Routes.js   → validate() + authenticate
controllers/*Controller.js → HTTP in/out only (req → service → sendSuccess)
services/*Service.js       → business logic, throws ApiError
models/*.js                → database access via Knex (config/db.js)
middleware/errorHandler.js → converts every error into the JSON envelope
```

- Config is read **only** in `src/config/env.js`. Other modules import `config` and never read `process.env` directly.
- Throw `ApiError.notFound()`, `ApiError.conflict()` and similar anywhere. Express 5 forwards async errors automatically.
- Register new modules in `src/routes/index.js`.

See the root [README](../README.md) for environment variables, database options and the API reference.
