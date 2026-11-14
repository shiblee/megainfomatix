/**
 * Production: serve the built React app (client/dist) from the API server, so the
 * site and its API share one domain (https://megainfomatix.com and /api).
 * Unknown non-API GET requests return index.html so React Router can handle them.
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('../config/env');

const serveClient = () => {
  const indexFile = path.join(config.clientDistDir, 'index.html');
  if (!fs.existsSync(indexFile)) {
    console.warn(`[client] SERVE_CLIENT is on but ${indexFile} was not found; build the client first.`);
    return (req, res, next) => next();
  }

  const router = express.Router();

  // Hashed build assets can be cached forever; index.html must always be revalidated.
  router.use('/assets', express.static(path.join(config.clientDistDir, 'assets'), { immutable: true, maxAge: '1y' }));
  router.use(express.static(config.clientDistDir, { index: false, maxAge: '1h' }));

  router.get(/^\/(?!api(\/|$)).*/, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });

  return router;
};

module.exports = serveClient;
