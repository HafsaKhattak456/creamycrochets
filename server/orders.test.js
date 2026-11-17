import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { installOrders } from './orders.js';
test('orders use current prices, reject unavailable items, deduplicate retries and protect customer data', async () => {
  const saved = [], product = { id: 1, name: 'Panda', price: 650, colors: ['Black & white'] };
  const collection = {
    async findOne(filter) { return saved.find(o => o.requestKey === filter.requestKey); },
    async insertOne(order) { order._id = new ObjectId(); saved.push(order); return { insertedId: order._id }; },
    find() { return { sort() { return this; }, skip() { return this; }, limit() { return this; }, async toArray() { return saved; } }; },
    async updateOne(filter, update) { const row = saved.find(o => o._id.equals(filter._id)); if (!row) return { matchedCount: 0 }; Object.assign(row, update.$set); return { matchedCount: 1 }; }
  };
  const db = { collection(name) { return name === 'orders' ? collection : { async findOne({ id }) { return id === 1 ? product : null; } }; } };
  const app = express(); app.use(express.json());
  installOrders(app, db, (req, res, next) => req.get('Authorization') === 'Bearer test' ? next() : res.status(401).json({ message: 'Login required' }));
  app.use((err, req, res, next) => res.status(err.status || 500).json({ message: err.message }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const body = { customer: { name: 'Test Customer', phone: '03021234567', address: 'Test address Karachi', city: 'Karachi' }, paymentMethod: 'COD', notes: '', items: [{ id: 1, color: 'Black & white', qty: 2, price: 1 }] };
  const key = randomUUID();
  const create = (data = body, requestKey = key) => fetch(url + '/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey }, body: JSON.stringify(data) });
  try {
    assert.equal((await fetch(url + '/admin/orders')).status, 401);
    assert.equal((await create({ ...body, customer: { ...body.customer, city: 'Lahore' } })).status, 400);
    product.available = false; assert.equal((await create()).status, 409); product.available = true;
    const created = await create(); assert.equal(created.status, 201); const result = await created.json(); assert.equal(result.subtotal, 1300); assert.equal(result.status, 'Pending'); assert.equal(result.customer, undefined);
    assert.equal((await create()).status, 200); assert.equal(saved.length, 1);
    assert.equal((await create({ ...body, notes: 'Changed' })).status, 409);
    const headers = { Authorization: 'Bearer test', 'Content-Type': 'application/json' };
    const list = await fetch(url + '/admin/orders', { headers }); assert.equal(list.status, 200); assert.equal((await list.json()).orders.length, 1);
    assert.equal((await fetch(`${url}/admin/orders/${saved[0]._id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'Invalid' }) })).status, 400);
    assert.equal((await fetch(`${url}/admin/orders/${saved[0]._id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'Confirmed' }) })).status, 200); assert.equal(saved[0].status, 'Confirmed');
    assert.equal((await fetch(`${url}/admin/orders/${saved[0]._id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Cancelled' }) })).status, 401);
    const invalidColour = { ...body, items: [{ id: 1, color: 'Red', qty: 1 }] }; assert.equal((await create(invalidColour, randomUUID())).status, 409);
  } finally { await new Promise(r => server.close(r)); }
});
