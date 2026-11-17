import { randomUUID, createHash } from 'node:crypto';
import { ObjectId } from 'mongodb';
export const orderStatuses = ['Pending', 'Confirmed', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled'];
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
export function installOrders(app, db, requireAdmin) {
  const orders = db.collection('orders');
  const attempts = new Map();
  const cleanup = setInterval(() => { for (const [key, value] of attempts) if (value.until < Date.now()) attempts.delete(key); }, 60000); cleanup.unref();
  app.post('/api/orders', async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store');
      const key = req.get('Idempotency-Key');
      if (!key || !/^[a-f\d-]{36}$/i.test(key)) throw fail('Invalid checkout request. Refresh and try again.');
      const body = req.body || {}, customer = body.customer || {};
      const text = (value, min, max, label) => { if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw fail(`Enter a valid ${label}.`); return value.trim(); };
      const name = text(customer.name, 2, 100, 'name');
      const phone = text(customer.phone, 10, 25, 'phone number');
      if (!/^(?:\+92|0092|0)3\d{9}$/.test(phone.replace(/[\s()-]/g, ''))) throw fail('Enter a Pakistani mobile number, e.g. 03021234567.');
      const address = text(customer.address, 10, 500, 'Karachi delivery address');
      if (customer.city !== 'Karachi') throw fail('Delivery is currently available only in Karachi.');
      if (!['COD', 'Card', 'JazzCash'].includes(body.paymentMethod)) throw fail('Choose a payment method.');
      const notes = body.notes === undefined || body.notes === '' ? '' : text(body.notes, 1, 1500, 'customisation notes');
      if (!Array.isArray(body.items) || !body.items.length || body.items.length > 100) throw fail('Your bag must contain 1–100 items.');
      const normalized = { customer: { name, phone, address, city: 'Karachi' }, paymentMethod: body.paymentMethod, notes, items: body.items.map(row => {
        if (!row || !['number', 'string'].includes(typeof row.id) || String(row.id).length > 100 || !Number.isInteger(row.qty) || row.qty < 1 || row.qty > 99 || typeof row.color !== 'string' || row.color.length > 80) throw fail('Invalid item or quantity.');
        return { id: row.id, color: row.color, qty: row.qty };
      }) };
      const requestHash = createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
      const existing = await orders.findOne({ requestKey: key });
      if (existing) { if (existing.requestHash !== requestHash) throw fail('This checkout was already submitted with different details. Start a new checkout.', 409); return res.json({ orderNumber: existing.orderNumber, status: existing.status, subtotal: existing.subtotal }); }
      let rate = attempts.get(req.ip); if (!rate || rate.until < Date.now()) { rate = { count: 0, until: Date.now() + 3600000 }; attempts.set(req.ip, rate); }
      if (++rate.count > 20) throw fail('Too many order attempts. Please try again later.', 429);
      const items = [], quantities = new Map();
      for (const row of normalized.items) {
        const identity = JSON.stringify([row.id, row.color]); const qty = (quantities.get(identity) || 0) + row.qty; quantities.set(identity, qty);
        if (qty > 99) throw fail('Maximum quantity is 99 per colour.');
        const product = await db.collection('products').findOne({ id: row.id });
        if (!product || product.available === false) throw fail(`${product?.name || 'An item'} is no longer available. Update your bag.`, 409);
        if (!product.colors?.includes(row.color)) throw fail(`${product.name}: choose a current colour option.`, 409);
        if (!Number.isFinite(product.price) || product.price <= 0) throw fail('A product price needs seller confirmation.', 409);
        items.push({ productId: product.id, name: product.name, color: row.color, qty: row.qty, unitPrice: product.price, starting: !!product.starting });
      }
      const subtotal = items.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.qty, 0) / 100;
      const order = { ...normalized, items, subtotal, deliveryCharge: null, paymentStatus: 'Not collected', status: 'Pending', orderNumber: `CC-${randomUUID().toUpperCase()}`, requestKey: key, requestHash, createdAt: new Date(), updatedAt: new Date() };
      try { await orders.insertOne(order); } catch (err) {
        if (err.code !== 11000) throw err;
        const saved = await orders.findOne({ requestKey: key });
        if (!saved || saved.requestHash !== requestHash) throw fail('Checkout conflict. Please contact the seller.', 409);
        return res.json({ orderNumber: saved.orderNumber, status: saved.status, subtotal: saved.subtotal });
      }
      res.status(201).json({ orderNumber: order.orderNumber, status: order.status, subtotal });
    } catch (err) { next(err); }
  });
  app.get('/api/admin/orders', requireAdmin, async (req, res, next) => {
    try {
      const page = Number(req.query.page || 1); if (!Number.isInteger(page) || page < 1 || page > 100000) throw fail('Invalid page.');
      const list = await orders.find({}, { projection: { requestKey: 0, requestHash: 0 } }).sort({ createdAt: -1 }).skip((page - 1) * 20).limit(21).toArray();
      res.json({ orders: list.slice(0, 20), hasMore: list.length > 20, page });
    } catch (err) { next(err); }
  });
  app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res, next) => {
    try {
      if (!/^[a-f\d]{24}$/i.test(req.params.id) || !orderStatuses.includes(req.body?.status)) throw fail('Choose a valid order and status.');
      const filter = { _id: new ObjectId(req.params.id) };
      const result = await orders.updateOne(filter, { $set: { status: req.body.status, updatedAt: new Date() } });
      if (!result.matchedCount) throw fail('Order not found.', 404);
      res.json({ status: req.body.status });
    } catch (err) { next(err); }
  });
}
