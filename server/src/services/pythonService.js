/**
 * HTTP client for the Python monitoring/analysis service (PYTHON_SERVICE_URL).
 * Node stays the single public API; Python is an internal service behind it.
 */
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

const isConfigured = () => Boolean(config.pythonServiceUrl);

const request = async (path, { method = 'GET', query, body } = {}) => {
  if (!isConfigured()) {
    throw ApiError.serviceUnavailable('Python analytics service is not configured (PYTHON_SERVICE_URL)');
  }

  const url = new URL(`${config.pythonServiceUrl}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => url.searchParams.set(key, value));

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(config.pythonServiceTimeoutMs),
    });
  } catch (error) {
    throw ApiError.badGateway(`Python analytics service is unreachable: ${error.message}`);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status >= 500 ? 502 : response.status, payload?.detail || 'Python service request failed');
  }

  return payload;
};

const checkHealth = async () => {
  if (!isConfigured()) return 'not_configured';
  try {
    await request('/health');
    return 'ok';
  } catch {
    return 'unreachable';
  }
};

module.exports = {
  isConfigured,
  request,
  checkHealth,
};
