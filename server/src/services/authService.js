/**
 * Authentication business logic: password hashing, credential checks, JWT handling.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;

const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

const verifyToken = (token) => jwt.verify(token, config.jwt.secret);

const register = async ({ name, email, password }) => {
  if (await User.findByEmail(email)) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });
  return { user, token: signToken(user) };
};

const login = async ({ email, password }) => {
  const row = await User.findByEmailWithPassword(email);
  const valid = row && (await bcrypt.compare(password, row.password_hash));

  if (!valid) throw ApiError.unauthorized('Invalid email or password');
  if (!row.is_active) throw ApiError.forbidden('This account is disabled');

  const user = User.toPublic(row);
  return { user, token: signToken(user) };
};

module.exports = {
  register,
  login,
  signToken,
  verifyToken,
};
