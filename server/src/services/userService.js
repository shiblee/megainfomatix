/**
 * User business logic, independent of HTTP. Reusable by controllers, jobs, scripts.
 */
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const listUsers = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const [items, total] = await Promise.all([User.findAll({ limit, offset }), User.count()]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

module.exports = {
  listUsers,
  getUserById,
};
