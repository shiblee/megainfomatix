const express = require('express');
const { forward } = require('../controllers/pythonController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/monitoring -> latest monitoring snapshot from the Python layer
router.get('/', forward('/monitoring/snapshot', { message: 'Monitoring snapshot fetched successfully' }));

module.exports = router;
