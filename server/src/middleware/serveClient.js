/**
 * Production: serve the built React app (client/dist) from the API server, so the
 * site and its API share one domain (https://megainfomatix.com and /api).
 *
 * SEO rules, driven by dist/route-manifest.json (written by client/scripts/prerender.mjs):
 *   - pre-rendered pages  -> their static HTML, 200, indexable
 *   - client-only routes  -> spa.html, 200, X-Robots-Tag: noindex
 *   - anything else       -> spa.html, 404, X-Robots-Tag: noindex (React shows "Page not found")
 *   - /index.html         -> 301 to /
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('../config/env');

const normalizePath = (urlPath) => (urlPath.length > 1 ? urlPath.replace(/\/+$/, '') : urlPath);

const loadManifest = (distDir) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(distDir, 'route-manifest.json'), 'utf8'));
  } catch {
    return { pages: { '/': 'index.html' }, app: [] }; // build without the prerender step
  }
};

const serveClient = (distDir = config.clientDistDir) => {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.warn(`[client] SERVE_CLIENT is on but ${distDir}/index.html was not found; build the client first.`);
    return (req, res, next) => next();
  }

  const manifest = loadManifest(distDir);
  const appRoutes = new Set(manifest.app);
  const shell = fs.existsSync(path.join(distDir, 'spa.html')) ? 'spa.html' : 'index.html';
  const router = express.Router();

  router.get('/index.html', (req, res) => res.redirect(301, '/'));

  // Hashed build assets can be cached forever; other static files for an hour.
  router.use('/assets', express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y' }));
  router.use(express.static(distDir, { index: false, maxAge: '1h' }));

  router.get(/^\/(?!api(\/|$)).*/, (req, res) => {
    const urlPath = normalizePath(req.path);
    const page = manifest.pages[urlPath];

    res.set('Cache-Control', 'no-cache');
    if (page) return res.sendFile(path.join(distDir, page));

    res.set('X-Robots-Tag', 'noindex');
    return res.status(appRoutes.has(urlPath) ? 200 : 404).sendFile(path.join(distDir, shell));
  });

  return router;
};

module.exports = serveClient;
