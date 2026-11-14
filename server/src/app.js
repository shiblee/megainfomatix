/**
 * Express application: middleware pipeline + route registration.
 * Kept separate from server.js so tests can import the app without opening a port.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const apiRoutes = require('./routes');
const canonicalHost = require('./middleware/canonicalHost');
const serveClient = require('./middleware/serveClient');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Behind Apache/Passenger or another proxy: trust X-Forwarded-* headers.
if (config.trustProxy) app.set('trust proxy', 1);

app.use(canonicalHost);
app.use(helmet());
app.use(cors({ origin: config.clientUrls, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (!config.isTest) app.use(morgan(config.isProduction ? 'combined' : 'dev'));

app.use('/api', apiRoutes);
if (config.serveClient) app.use(serveClient());

app.use(notFound);
app.use(errorHandler);

module.exports = app;
