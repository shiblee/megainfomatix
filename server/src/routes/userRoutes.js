const express = require('express');
const { param, query } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  ]),
  userController.getUsers,
);

router.get(
  '/:id',
  validate([param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')]),
  userController.getUserById,
);

module.exports = router;
