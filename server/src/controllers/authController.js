const authService = require('../services/authService');
const userService = require('../services/userService');
const { sendSuccess } = require('../utils/response');

const register = async (req, res) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, result, { message: 'Account created successfully', statusCode: 201 });
};

const login = async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, result, { message: 'Logged in successfully' });
};

const me = async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  return sendSuccess(res, user, { message: 'Current user fetched successfully' });
};

module.exports = {
  register,
  login,
  me,
};
