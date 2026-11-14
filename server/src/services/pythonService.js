/**
 * Gateway to the Python monitoring/analysis layer. Two transports, chosen by config:
 *
 *   HTTP  PYTHON_SERVICE_URL=http://127.0.0.1:8000   long-running FastAPI service (`main.py serve`)
 *   CLI   PYTHON_BIN=/path/to/venv/bin/python        runs `main.py query <operation>` on demand
 *                                                    (shared hosting, where background services aren't allowed)
 *
 * Node stays the single public API; Python is internal only.
 */
const { execFile } = require('child_process');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

// operation name -> HTTP route on the Python service
const HTTP_ROUTES = {
  health: { method: 'GET', path: '/health' },
  'monitoring-snapshot': { method: 'GET', path: '/monitoring/snapshot' },
  'analysis-summary': { method: 'GET', path: '/analysis/summary' },
  'reports-latest': { method: 'GET', path: '/reports/latest' },
  'reports-generate': { method: 'POST', path: '/reports' },
};

const transport = () => {
  if (config.python.serviceUrl) return 'http';
  if (config.python.bin) return 'cli';
  return null;
};

const isConfigured = () => Boolean(transport());

const toApiError = (status, detail) => new ApiError(status >= 500 ? 502 : status, detail || 'Python service request failed');

const callHttp = async (operation) => {
  const { method, path } = HTTP_ROUTES[operation];
  let response;
  try {
    response = await fetch(`${config.python.serviceUrl}${path}`, {
      method,
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(config.python.timeoutMs),
    });
  } catch (error) {
    throw ApiError.badGateway(`Python analytics service is unreachable: ${error.message}`);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, payload?.detail);
  return payload;
};

const callCli = (operation) =>
  new Promise((resolve, reject) => {
    execFile(
      config.python.bin,
      ['src/main.py', 'query', operation],
      { cwd: config.python.appDir, timeout: config.python.timeoutMs, maxBuffer: 20 * 1024 * 1024 },
      (error, stdout, stderr) => {
        let result;
        try {
          result = JSON.parse(stdout);
        } catch {
          const reason = error?.killed ? 'timed out' : (stderr || error?.message || 'no output').trim().split('\n').pop();
          return reject(ApiError.badGateway(`Python analytics failed: ${reason}`));
        }
        return result.ok ? resolve(result.data) : reject(toApiError(result.status, result.detail));
      },
    );
  });

const call = (operation) => {
  if (!HTTP_ROUTES[operation]) throw new Error(`Unknown Python operation: ${operation}`);
  const mode = transport();
  if (!mode) {
    throw ApiError.serviceUnavailable('Python analytics is not configured (set PYTHON_SERVICE_URL or PYTHON_BIN)');
  }
  return mode === 'http' ? callHttp(operation) : callCli(operation);
};

const checkHealth = async () => {
  if (!isConfigured()) return 'not_configured';
  try {
    await call('health');
    return 'ok';
  } catch {
    return 'unreachable';
  }
};

module.exports = {
  isConfigured,
  call,
  checkHealth,
};
