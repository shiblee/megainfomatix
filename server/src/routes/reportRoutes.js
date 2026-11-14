const express = require('express');
const { forward } = require('../controllers/pythonController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET  /api/reports/latest -> most recently generated report
// POST /api/reports        -> generate a new report now
router.get('/latest', forward('/reports/latest', { message: 'Latest report fetched successfully' }));
router.post('/', forward('/reports', { method: 'POST', message: 'Report generated successfully', statusCode: 201 }));

module.exports = router;
