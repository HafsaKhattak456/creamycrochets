import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { hashPassword, verifyPassword, installAuth } from './auth.js';
test('admin login protects catalog, rejects wrong passwords, revokes logout and limits attempts', async () => {
  const record = { email: 'test@example.com', ...await hashPassword('test-only-password') };
  assert.equal(await verifyPassword('wrong', record), false);
  const db = { collection(name) { return name === 'admins' ? { async findOne({ email }) { return email === record.email ? record : null; } } : { find() { return { sort() { return { async toArray() { return [{ id: 1, name: 'Panda' }]; } }; } }; } }; } };
  const app = express(); app.use(express.json()); installAuth(app, db);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/admin`;
  const login = (password, email = record.email) => fetch(`${base}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  try {
    assert.equal((await fetch(`${base}/products`)).status, 401);
    assert.equal((await login('wrong')).status, 401);
    assert.equal((await login('wrong', 'missing@example.com')).status, 401);
    const response = await login('test-only-password'); assert.equal(response.status, 200);
    const { token } = await response.json(); const headers = { Authorization: `Bearer ${token}` };
    const products = await fetch(`${base}/products`, { headers }); assert.equal(products.status, 200); assert.equal((await products.json())[0].name, 'Panda');
    assert.equal((await fetch(`${base}/logout`, { method: 'POST', headers })).status, 200);
    assert.equal((await fetch(`${base}/products`, { headers })).status, 401);
    for (let i = 0; i < 7; i++) await login('wrong');
    assert.equal((await login('test-only-password')).status, 429);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
