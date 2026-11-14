const express = require('express');
const { forward } = require('../controllers/pythonController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/analysis -> analysis summary from the Python layer
router.get('/', forward('/analysis/summary', { message: 'Analysis summary fetched successfully' }));

module.exports = router;
