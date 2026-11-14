/**
 * Consistent JSON response envelope used by every endpoint.
 *
 * Success: { success: true,  message, data, meta? }
 * Error:   { success: false, message, errors? }
 */
const sendSuccess = (res, data = null, { message = 'Success', statusCode = 200, meta } = {}) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const sendError = (res, statusCode = 500, message = 'Something went wrong', errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = {
  sendSuccess,
  sendError,
};
