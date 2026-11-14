/**
 * Central environment configuration.
 * Loads server/.env once and exposes a typed, validated config object.
 * Every other module should import config from here instead of reading process.env.
 */
const path = require('path');
const dotenv = require('dotenv');

const SERVER_DIR = path.resolve(__dirname, '../..');
const ROOT_DIR = path.resolve(SERVER_DIR, '..');

// Existing process env vars (e.g. set by Docker/CI/tests) take precedence over .env.
dotenv.config({ path: path.join(SERVER_DIR, '.env') });

const toList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toBool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

// Accepts "http://host:port" or a bare "host:port" (as provided by Render's fromService.hostport).
const normalizeServiceUrl = (value) => {
  const url = String(value || '').trim().replace(/\/+$/, '');
  if (!url) return '';
  return /^https?:\/\//.test(url) ? url : `http://${url}`;
};

const env = process.env.NODE_ENV || 'development';

const config = Object.freeze({
  env,
  isProduction: env === 'production',
  isTest: env === 'test',
  port: Number(process.env.PORT) || 5050,
  rootDir: ROOT_DIR,
  serverDir: SERVER_DIR,
  clientUrls: toList(process.env.CLIENT_URL || 'http://localhost:3000'),
  db: Object.freeze({
    url: process.env.DATABASE_URL || 'sqlite:///data/megainfomatix.db',
    ssl: toBool(process.env.DB_SSL, false),
    autoMigrate: toBool(process.env.DB_AUTO_MIGRATE, env !== 'production'),
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  }),
  // Python layer: HTTP service (PYTHON_SERVICE_URL) or on-demand CLI (PYTHON_BIN), e.g. on shared hosting.
  python: Object.freeze({
    serviceUrl: normalizeServiceUrl(process.env.PYTHON_SERVICE_URL),
    bin: process.env.PYTHON_BIN || '',
    appDir: path.resolve(ROOT_DIR, process.env.PYTHON_APP_DIR || 'python'),
    timeoutMs: Number(process.env.PYTHON_SERVICE_TIMEOUT_MS) || 60000,
  }),
  // Production on a single domain: Node also serves the built React app (client/dist).
  serveClient: toBool(process.env.SERVE_CLIENT, false),
  clientDistDir: path.resolve(ROOT_DIR, process.env.CLIENT_DIST_DIR || 'client/dist'),
  trustProxy: toBool(process.env.TRUST_PROXY, false),
  // Redirect other hostnames (e.g. www.) to this one. Empty = no redirect.
  canonicalHost: (process.env.CANONICAL_HOST || '').trim().toLowerCase(),
});

const PLACEHOLDER_SECRETS = new Set(['', 'replace_with_secure_secret', 'change_me']);

if (PLACEHOLDER_SECRETS.has(config.jwt.secret)) {
  if (config.isProduction) {
    throw new Error('JWT_SECRET must be set to a strong, unique value in production.');
  }
  if (!config.isTest) {
    console.warn('[config] JWT_SECRET is not set or uses a placeholder; set a real value in server/.env.');
  }
}

module.exports = config;
