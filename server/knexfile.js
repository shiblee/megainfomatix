// Used by the Knex CLI (npm run db:migrate / db:rollback / db:make-migration).
const { buildKnexConfig } = require('./src/config/db');

module.exports = buildKnexConfig();
