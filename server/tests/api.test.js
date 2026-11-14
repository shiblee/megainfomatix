/**
 * API smoke tests. Run with: npm test
 * Uses an in-memory SQLite database, so no external services are required.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite:///:memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.PYTHON_SERVICE_URL = '';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { db, closeConnection } = require('../src/config/db');

const credentials = { name: 'Test User', email: 'test@example.com', password: 'password123' };
let token;

before(() => db.migrate.latest());
after(() => closeConnection());

test('GET /api/health reports healthy', async () => {
  const res = await request(app).get('/api/health').expect(200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.database, 'ok');
  assert.equal(res.body.data.python, 'not_configured');
});

test('unknown routes return 404 JSON', async () => {
  const res = await request(app).get('/api/does-not-exist').expect(404);
  assert.equal(res.body.success, false);
});

test('register validates input', async () => {
  const res = await request(app).post('/api/auth/register').send({ email: 'bad' }).expect(422);
  assert.ok(res.body.errors.some((e) => e.field === 'password'));
});

test('register creates a user and returns a token', async () => {
  const res = await request(app).post('/api/auth/register').send(credentials).expect(201);
  assert.equal(res.body.data.user.email, credentials.email);
  assert.equal(res.body.data.user.password_hash, undefined);
  assert.ok(res.body.data.token);
});

test('register rejects duplicate email', async () => {
  await request(app).post('/api/auth/register').send(credentials).expect(409);
});

test('login rejects wrong password', async () => {
  await request(app).post('/api/auth/login').send({ ...credentials, password: 'wrong-pass' }).expect(401);
});

test('login returns a token', async () => {
  const res = await request(app).post('/api/auth/login').send(credentials).expect(200);
  token = res.body.data.token;
  assert.ok(token);
});

test('protected routes require a token', async () => {
  await request(app).get('/api/users').expect(401);
  await request(app).get('/api/users').set('Authorization', 'Bearer not-a-jwt').expect(401);
});

test('GET /api/auth/me returns the current user', async () => {
  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
  assert.equal(res.body.data.email, credentials.email);
});

test('GET /api/users returns a paginated list', async () => {
  const res = await request(app).get('/api/users?limit=5').set('Authorization', `Bearer ${token}`).expect(200);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.meta.total, 1);
});

test('GET /api/users/:id returns 404 for missing user', async () => {
  await request(app).get('/api/users/999').set('Authorization', `Bearer ${token}`).expect(404);
});

test('python-backed modules return 503 when PYTHON_SERVICE_URL is unset', async () => {
  await request(app).get('/api/monitoring').set('Authorization', `Bearer ${token}`).expect(503);
});
