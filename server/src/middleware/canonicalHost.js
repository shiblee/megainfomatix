/**
 * Production: one address for every page — https and a single hostname
 * (e.g. www.megainfomatix.com -> https://megainfomatix.com). API calls are never redirected.
 */
const config = require('../config/env');

const canonicalHost = (req, res, next) => {
  if (!config.canonicalHost || req.path.startsWith('/api/')) return next();

  const proto = req.get('x-forwarded-proto') || req.protocol;
  if (req.hostname !== config.canonicalHost || proto !== 'https') {
    return res.redirect(301, `https://${config.canonicalHost}${req.originalUrl}`);
  }
  return next();
};

module.exports = canonicalHost;
