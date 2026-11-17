import { randomUUID, createHash } from 'node:crypto';
import { ObjectId } from 'mongodb';
export const customStatuses = ['New', 'Discussing', 'Accepted', 'Completed', 'Declined'];
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
export function validateCustom(body = {}) {
  const result = {};
  for (const [field, min, max] of [['name', 2, 100], ['phone', 10, 25], ['piece', 2, 100], ['details', 5, 2000]]) {
    if (typeof body[field] !== 'string' || body[field].trim().length < min || body[field].trim().length > max) throw fail(`Enter valid ${field} (${min}–${max} characters).`);
    result[field] = body[field].trim();
  }
  if (!/^(?:\+92|0092|0)3\d{9}$/.test(result.phone.replace(/[\s()-]/g, ''))) throw fail('Enter a Pakistani mobile number, e.g. 03021234567.');
  const date = body.preferredDate || '';
  if (typeof date !== 'string' || (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date))) throw fail('Enter a valid preferred date or leave it blank.');
  result.preferredDate = date;
  return result;
}
export function installCustomRequests(app, db, requireAdmin) {
  const collection = db.collection('customRequests'), rates = new Map();
  const timer = setInterval(() => { for (const [ip, value] of rates) if (value.until <= Date.now()) rates.delete(ip); }, 60000); timer.unref();
  app.post('/api/custom-requests', async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store');
      const requestKey = req.get('Idempotency-Key');
      if (!requestKey || !/^[a-f\d-]{36}$/i.test(requestKey)) throw fail('Invalid request key. Reopen the form.');
      const details = validateCustom(req.body || {});
      const requestHash = createHash('sha256').update(JSON.stringify(details)).digest('hex');
      const receipt = row => ({ requestNumber: row.requestNumber, status: row.status });
      const previous = await collection.findOne({ requestKey });
      if (previous) { if (previous.requestHash !== requestHash) throw fail('This request was already submitted with different details. Please contact the seller or start a new request.', 409); return res.json(receipt(previous)); }
      let rate = rates.get(req.ip); if (!rate || rate.until <= Date.now()) { rate = { count: 0, until: Date.now() + 3600000 }; rates.set(req.ip, rate); }
      if (++rate.count > 20) throw fail('Too many requests. Please try again later.', 429);
      const row = { ...details, requestKey, requestHash, requestNumber: `CR-${randomUUID().toUpperCase()}`, status: 'New', quotedPrice: null, createdAt: new Date(), updatedAt: new Date() };
      try { await collection.insertOne(row); } catch (err) {
        if (err.code !== 11000) throw err;
        const saved = await collection.findOne({ requestKey });
        if (!saved || saved.requestHash !== requestHash) throw fail('Request conflict. Please contact the seller.', 409);
        return res.json(receipt(saved));
      }
      res.status(201).json(receipt(row));
    } catch (err) { next(err); }
  });
  app.get('/api/admin/custom-requests', requireAdmin, async (req, res, next) => {
    try {
      const page = Number(req.query.page || 1); if (!Number.isInteger(page) || page < 1 || page > 100000) throw fail('Invalid page.');
      const rows = await collection.find({}, { projection: { requestKey: 0, requestHash: 0 } }).sort({ createdAt: -1 }).skip((page - 1) * 20).limit(21).toArray();
      res.json({ requests: rows.slice(0, 20), hasMore: rows.length > 20 });
    } catch (err) { next(err); }
  });
  app.patch('/api/admin/custom-requests/:id', requireAdmin, async (req, res, next) => {
    try {
      const { status, quotedPrice } = req.body || {};
      if (!/^[a-f\d]{24}$/i.test(req.params.id) || !customStatuses.includes(status)) throw fail('Choose a valid request and status.');
      if (quotedPrice !== null && (typeof quotedPrice !== 'number' || !Number.isFinite(quotedPrice) || quotedPrice <= 0 || quotedPrice > 1000000 || Math.abs(quotedPrice * 100 - Math.round(quotedPrice * 100)) > 0.000001)) throw fail('Quote must be empty or PKR 0.01–1,000,000 with at most two decimal places.');
      const result = await collection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status, quotedPrice, updatedAt: new Date() } });
      if (!result.matchedCount) throw fail('Custom request not found.', 404);
      res.json({ status, quotedPrice });
    } catch (err) { next(err); }
  });
}
