/**
 * API module registry. To add a module (e.g. notifications, settings):
 *   1. create routes/<module>Routes.js (+ controller/service/model as needed)
 *   2. add one line below
 */
const express = require('express');

const modules = [
  ['/health', require('./healthRoutes')],
  ['/auth', require('./authRoutes')],
  ['/users', require('./userRoutes')],
  ['/monitoring', require('./monitoringRoutes')],
  ['/analysis', require('./analysisRoutes')],
  ['/reports', require('./reportRoutes')],
];

const router = express.Router();
modules.forEach(([path, moduleRouter]) => router.use(path, moduleRouter));

module.exports = router;
