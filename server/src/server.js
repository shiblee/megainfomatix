/**
 * Process entry point: verifies the database, runs migrations (if enabled),
 * starts the HTTP server and shuts down gracefully.
 */
const config = require('./config/env');
const app = require('./app');
const { db, checkConnection, closeConnection } = require('./config/db');

const start = async () => {
  try {
    await checkConnection();
    console.log(`[db] Connected (${db.client.config.client})`);

    if (config.db.autoMigrate) {
      const [, applied] = await db.migrate.latest();
      if (applied.length) console.log(`[db] Applied migrations: ${applied.join(', ')}`);
    }
  } catch (error) {
    console.error('[db] Database initialisation failed:', error.message);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`[server] ${config.env} server running on http://localhost:${config.port}`);
  });

  server.on('error', (error) => {
    const reason = error.code === 'EADDRINUSE' ? `port ${config.port} is already in use` : error.message;
    console.error(`[server] Failed to start: ${reason}`);
    process.exit(1);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await closeConnection();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start();
