/**
 * Database connection (Knex query builder).
 *
 * The engine is chosen from DATABASE_URL, so switching databases is a config change:
 *   sqlite:///data/megainfomatix.db          -> SQLite file (path relative to project root)
 *   sqlite:////absolute/path/app.db          -> SQLite file (absolute path)
 *   sqlite:///:memory:                       -> in-memory SQLite (tests)
 *   postgresql://user:pass@host:5432/dbname  -> PostgreSQL (driver: pg)
 *   mysql://user:pass@host:3306/dbname       -> MySQL (driver: mysql2, install separately)
 *
 * The same URL format is understood by the Python layer (SQLAlchemy), so both
 * layers can share one DATABASE_URL.
 */
const fs = require('fs');
const path = require('path');
const knex = require('knex');
const config = require('./env');

const MIGRATIONS_DIR = path.join(config.serverDir, 'src', 'database', 'migrations');

const resolveSqliteFilename = (url) => {
  const rest = url.replace(/^sqlite:\/\//, '');
  if (rest === '' || rest === '/:memory:' || rest === ':memory:') return ':memory:';

  const filePath = rest.replace(/^\//, '');
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(config.rootDir, filePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  return absolute;
};

// Strip SQLAlchemy-style driver suffixes such as "postgresql+psycopg://".
const stripDriverSuffix = (url) => url.replace(/^(\w+)\+\w+:\/\//, '$1://');

const buildKnexConfig = (databaseUrl = config.db.url) => {
  const url = String(databaseUrl).trim();
  const base = {
    migrations: { directory: MIGRATIONS_DIR, tableName: 'knex_migrations' },
  };

  if (url.startsWith('sqlite:')) {
    return {
      ...base,
      client: 'better-sqlite3',
      connection: { filename: resolveSqliteFilename(url) },
      useNullAsDefault: true,
      pool: { min: 1, max: 1 },
    };
  }

  if (/^postgres(ql)?(\+\w+)?:\/\//.test(url)) {
    return {
      ...base,
      client: 'pg',
      connection: {
        connectionString: stripDriverSuffix(url).replace(/^postgres:/, 'postgresql:'),
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
      },
      pool: { min: 0, max: 10 },
    };
  }

  if (/^mysql(\+\w+)?:\/\//.test(url)) {
    return {
      ...base,
      client: 'mysql2',
      connection: stripDriverSuffix(url),
      pool: { min: 0, max: 10 },
    };
  }

  throw new Error(`Unsupported DATABASE_URL scheme: "${url.split(':')[0]}"`);
};

const db = knex(buildKnexConfig());

const checkConnection = async () => {
  await db.raw('SELECT 1');
  return true;
};

const closeConnection = () => db.destroy();

module.exports = {
  db,
  buildKnexConfig,
  checkConnection,
  closeConnection,
};
