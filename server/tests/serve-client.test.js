/**
 * Production static serving + SEO status codes, against a temporary fake client build.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'mi-dist-'));
fs.mkdirSync(path.join(dist, 'assets'));
fs.writeFileSync(path.join(dist, 'index.html'), '<html><h1>Prerendered home</h1></html>');
fs.writeFileSync(path.join(dist, 'spa.html'), '<html><div id="root"></div></html>');
fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\n');
fs.writeFileSync(path.join(dist, 'assets', 'app-abc123.js'), 'console.log(1)');
fs.writeFileSync(path.join(dist, 'route-manifest.json'), JSON.stringify({ pages: { '/': 'index.html' }, app: ['/status'] }));

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite:///:memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.SERVE_CLIENT = 'true';
process.env.CLIENT_DIST_DIR = dist;

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { closeConnection } = require('../src/config/db');

after(() => {
  fs.rmSync(dist, { recursive: true, force: true });
  return closeConnection();
});

test('home serves the pre-rendered HTML, indexable', async () => {
  const res = await request(app).get('/').expect(200);
  assert.match(res.text, /Prerendered home/);
  assert.equal(res.headers['x-robots-tag'], undefined);
});

test('client-only route serves the shell with noindex', async () => {
  const res = await request(app).get('/status').expect(200);
  assert.match(res.text, /id="root"/);
  assert.equal(res.headers['x-robots-tag'], 'noindex');
});

test('unknown page returns a real 404 with noindex', async () => {
  const res = await request(app).get('/no-such-page').expect(404);
  assert.equal(res.headers['x-robots-tag'], 'noindex');
});

test('/index.html redirects to /', async () => {
  const res = await request(app).get('/index.html').expect(301);
  assert.equal(res.headers.location, '/');
});

test('static files and immutable assets', async () => {
  await request(app).get('/robots.txt').expect(200).expect('Content-Type', /text\/plain/);
  const res = await request(app).get('/assets/app-abc123.js').expect(200);
  assert.match(res.headers['cache-control'], /immutable/);
});

test('API routes are not swallowed by the client fallback', async () => {
  const res = await request(app).get('/api/unknown').expect(404);
  assert.equal(res.body.success, false);
});
