import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { ObjectId } from 'mongodb';
import { installAuth, hashPassword } from './auth.js';
test('product edits require login, validate input and preserve IDs and photos', async () => {
  let product = { _id: new ObjectId(), id: 1, image: '/products/crochet-panda.png', name: 'Panda' };
  const admin = { email: 'edit@example.com', ...await hashPassword('test-only-password') };
  const db = { collection(name) { return name === 'admins' ? { async findOne() { return admin; } } : {
    async updateOne(filter, update) { if (!filter._id.equals(product._id)) return { matchedCount: 0 }; product = { ...product, ...update.$set }; return { matchedCount: 1 }; },
    async findOne() { return product; }
  }; } };
  const app = express(); app.use(express.json()); installAuth(app, db);
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const url = `http://127.0.0.1:${server.address().port}/api/admin`;
  const data = { name: 'Updated Panda', category: 'Crochet Toys', price: 700, size: 'Hand-sized', description: 'Updated description', colors: ['Black & white', 'Custom colours'], starting: false, image: 'should-not-change', id: 999 };
  let token;
  const put = (body, id = product._id.toHexString()) => fetch(`${url}/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  try {
    assert.equal((await put(data)).status, 401);
    const login = await fetch(`${url}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: admin.email, password: 'test-only-password' }) }); token = (await login.json()).token;
    assert.equal((await put({ ...data, price: -1 })).status, 400);
    assert.equal((await put({ ...data, colors: [] })).status, 400);
    assert.equal((await put(data, 'invalid')).status, 400);
    assert.equal((await put(data, new ObjectId().toHexString())).status, 404);
    const response = await put(data); assert.equal(response.status, 200);
    const saved = await response.json(); assert.equal(saved.price, 700); assert.equal(saved.name, 'Updated Panda'); assert.equal(saved.id, 1); assert.equal(saved.image, '/products/crochet-panda.png');
  } finally { await new Promise(r => server.close(r)); }
});
