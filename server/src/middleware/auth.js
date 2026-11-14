/**
 * Authentication & authorization middleware.
 *
 *   authenticate          -> requires a valid "Authorization: Bearer <jwt>" header
 *   authorize('admin')    -> additionally requires one of the given roles
 */
const ApiError = require('../utils/ApiError');
const authService = require('../services/authService');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed bearer token'));
  }

  try {
    const payload = authService.verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) return next(ApiError.forbidden());
    return next();
  };

module.exports = {
  authenticate,
  authorize,
};
