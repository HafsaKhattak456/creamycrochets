import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import sharp from 'sharp';
import { ObjectId } from 'mongodb';
import { installAuth, hashPassword } from './auth.js';
import { uploadDirectory } from './product-media.js';
import { unlink } from 'node:fs/promises';
test('creation and photo replacement require authentication and valid images', async () => {
  const admin = { email: 'test@example.com', ...await hashPassword('test-password') };
  let saved; let imagePath;
  const db = { collection(name) { return name === 'admins' ? { async findOne() { return admin; } } : {
    async insertOne(product) { saved = { ...product, _id: new ObjectId() }; imagePath = product.image; return { insertedId: saved._id }; },
    async findOne(filter) { return saved && filter._id.equals(saved._id) ? saved : null; },
    async updateOne(filter, update) { saved = { ...saved, ...update.$set }; return { matchedCount: 1 }; }
  }; } };
  const app = express(); app.use(express.json()); installAuth(app, db); app.use((err, req, res, next) => res.status(err.status || 400).json({ message: err.message }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/api/admin`;
  const product = { name: 'Test bow', price: 600, size: 'Hand size', description: 'Test only', category: 'Keychains', colors: ['Blue'], starting: false };
  const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'pink' } }).png().toBuffer();
  let token;
  const send = (bytes, details = product, method = 'POST', path = '/products') => {
    const form = new FormData(); if (method === 'POST') form.append('product', JSON.stringify(details)); if (bytes) form.append('photo', new Blob([bytes], { type: 'image/png' }), 'test.png');
    return fetch(base + path, { method, headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  };
  try {
    assert.equal((await send(png)).status, 401);
    const login = await fetch(base + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: admin.email, password: 'test-password' }) }); token = (await login.json()).token;
    assert.equal((await send(null)).status, 400);
    assert.equal((await send(Buffer.from('fake image'))).status, 400);
    assert.equal((await send(png, { ...product, price: -1 })).status, 400);
    assert.equal((await send(Buffer.alloc(5 * 1024 * 1024 + 1))).status, 400);
    const created = await send(png); assert.equal(created.status, 201); const data = await created.json(); assert.equal(data.name, 'Test bow'); assert.match(data.image, /^\/uploads\/[\w-]+\.webp$/); assert.equal(typeof data.id, 'string');
    const replaced = await send(png, product, 'PUT', `/products/${data._id}/photo`); assert.equal(replaced.status, 200); const updated = await replaced.json(); assert.notEqual(updated.image, data.image);
    await unlink(new URL(updated.image.split('/').pop(), uploadDirectory));
  } finally { if (imagePath) await unlink(new URL(imagePath.split('/').pop(), uploadDirectory)).catch(() => {}); await new Promise(r => server.close(r)); }
});
