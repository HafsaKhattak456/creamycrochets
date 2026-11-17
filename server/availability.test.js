import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { installOrderCheck } from './availability.js';
import { validateProduct } from './auth.js';
test('bag check rejects unavailable, removed and invalid options, uses current prices, and supports legacy products', async () => {
  const product = { id: 1, name: 'Panda', price: 650, colors: ['Black & white'] };
  const db = { collection() { return { async findOne({ id }) { return id === 1 ? product : null; } }; } };
  const app = express(); app.use(express.json()); installOrderCheck(app, db);
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const url = `http://127.0.0.1:${server.address().port}/api/products/check`;
  const check = (items = [{ id: 1, qty: 2, color: 'Black & white', price: 1 }]) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
  try {
    let response = await check(); assert.equal(response.status, 200); assert.equal((await response.json()).items[0].price, 650);
    product.available = false; assert.equal((await check()).status, 409);
    product.available = true; assert.equal((await check()).status, 200);
    assert.equal((await check([{ id: 99, qty: 1, color: 'Black & white' }])).status, 409);
    assert.equal((await check([{ id: 1, qty: 1, color: 'Red' }])).status, 409);
    assert.equal((await check([{ id: 1, qty: 0, color: 'Black & white' }])).status, 400);
    assert.equal((await check([])).status, 400);
    assert.throws(() => validateProduct({ available: 'false' }), /Availability/);
  } finally { await new Promise(r => server.close(r)); }
});
