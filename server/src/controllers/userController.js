const userService = require('../services/userService');
const { sendSuccess } = require('../utils/response');

const getUsers = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { items, meta } = await userService.listUsers({ page, limit });
  return sendSuccess(res, items, { message: 'Users fetched successfully', meta });
};

const getUserById = async (req, res) => {
  const user = await userService.getUserById(Number(req.params.id));
  return sendSuccess(res, user, { message: 'User fetched successfully' });
};

module.exports = {
  getUsers,
  getUserById,
};
