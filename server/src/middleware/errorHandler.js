/**
 * 404 handler + centralized error handler. Registered last in app.js.
 * Express 5 forwards errors thrown/rejected in async handlers here automatically.
 */
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const { sendError } = require('../utils/response');

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.message, err.errors);
  }

  // Malformed JSON body or payload too large (raised by express.json()).
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'Malformed JSON in request body');
  }
  if (err.type === 'entity.too.large') {
    return sendError(res, 413, 'Request body is too large');
  }

  console.error('[error]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = config.isProduction ? 'Internal server error' : err.message || 'Internal server error';
  const details = config.isProduction ? null : { stack: err.stack };

  return sendError(res, statusCode, message, details);
};

module.exports = {
  notFound,
  errorHandler,
};
