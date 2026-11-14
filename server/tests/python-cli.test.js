/**
 * Python CLI transport (PYTHON_BIN): Node runs `python src/main.py query <operation>`.
 * Skipped when the local Python venv has not been created.
 */
const fs = require('fs');
const path = require('path');

const pythonBin = path.resolve(__dirname, '../../python/venv/bin/python');
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite:///:memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.PYTHON_SERVICE_URL = '';
process.env.PYTHON_BIN = pythonBin;

const { test } = require('node:test');
const assert = require('node:assert/strict');

test('runs Python on demand via PYTHON_BIN', { skip: !fs.existsSync(pythonBin) && 'python/venv missing' }, async () => {
  const pythonService = require('../src/services/pythonService');

  assert.equal(await pythonService.checkHealth(), 'ok');

  const summary = await pythonService.call('analysis-summary');
  assert.deepEqual(summary.tables, []);

  assert.throws(() => pythonService.call('not-an-operation'), /Unknown Python operation/);
});
