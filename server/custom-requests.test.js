import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { installCustomRequests, validateCustom } from './custom-requests.js';
test('custom requests validate input, deduplicate retries, protect records and save quotes/status', async () => {
  const rows = [];
  const db = { collection() { return {
    async findOne(filter) { return rows.find(r => r.requestKey === filter.requestKey); },
    async insertOne(row) { row._id = new ObjectId(); rows.push(row); },
    find() { return { sort() { return this; }, skip() { return this; }, limit() { return this; }, async toArray() { return rows.map(({ requestKey, requestHash, ...row }) => row); } }; },
    async updateOne(filter, update) { const row = rows.find(r => r._id.equals(filter._id)); if (!row) return { matchedCount: 0 }; Object.assign(row, update.$set); return { matchedCount: 1 }; }
  }; } };
  const app = express(); app.use(express.json()); installCustomRequests(app, db, (req, res, next) => req.get('Authorization') === 'Bearer test' ? next() : res.status(401).json({ message: 'Login required' }));
  app.use((err, req, res, next) => res.status(err.status || 500).json({ message: err.message }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const body = { name: 'Test Customer', phone: '03021234567', piece: 'Headband', details: 'Pink flowers, custom size', preferredDate: '' };
  const key = randomUUID(), headers = { Authorization: 'Bearer test', 'Content-Type': 'application/json' };
  const submit = data => fetch(base + '/custom-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(data) });
  const patch = (data, auth = headers) => fetch(`${base}/admin/custom-requests/${rows[0]._id}`, { method: 'PATCH', headers: auth, body: JSON.stringify(data) });
  try {
    assert.throws(() => validateCustom({ ...body, preferredDate: '2026-02-30' }), /date/);
    assert.equal((await submit({ ...body, phone: 'invalid' })).status, 400);
    const response = await submit(body); assert.equal(response.status, 201); const receipt = await response.json(); assert.equal(receipt.status, 'New'); assert.match(receipt.requestNumber, /^CR-/); assert.equal(receipt.phone, undefined); assert.equal(rows[0].quotedPrice, null);
    assert.equal((await submit(body)).status, 200); assert.equal(rows.length, 1);
    assert.equal((await submit({ ...body, details: 'A different design' })).status, 409);
    assert.equal((await fetch(base + '/admin/custom-requests')).status, 401);
    const list = await fetch(base + '/admin/custom-requests', { headers }); assert.equal(list.status, 200); const listed = await list.json(); assert.equal(listed.requests.length, 1); assert.equal(listed.requests[0].requestKey, undefined);
    assert.equal((await patch({ status: 'Discussing', quotedPrice: 700 }, { 'Content-Type': 'application/json' })).status, 401);
    assert.equal((await patch({ status: 'Discussing', quotedPrice: -1 })).status, 400);
    assert.equal((await patch({ status: 'Invalid', quotedPrice: 700 })).status, 400);
    assert.equal((await patch({ status: 'Discussing', quotedPrice: 700 })).status, 200); assert.equal(rows[0].quotedPrice, 700); assert.equal(rows[0].status, 'Discussing');
    assert.equal((await patch({ status: 'Accepted', quotedPrice: null })).status, 200); assert.equal(rows[0].quotedPrice, null);
  } finally { await new Promise(r => server.close(r)); }
});
