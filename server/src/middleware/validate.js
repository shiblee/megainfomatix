/**
 * Runs express-validator chains and rejects the request with 422 on failure.
 * Usage: router.post('/', validate(rules), controller)
 */
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (rules) => async (req, res, next) => {
  await Promise.all(rules.map((rule) => rule.run(req)));

  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((error) => ({ field: error.path, message: error.msg }));
  return next(ApiError.unprocessable('Validation failed', errors));
};

module.exports = validate;
