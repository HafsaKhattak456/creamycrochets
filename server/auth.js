import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { photoUpload, savePhoto } from './product-media.js';
const derive = promisify(scrypt);
export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const key = await derive(password, salt, 64, { N: 32768, maxmem: 64 * 1024 * 1024 });
  return { salt, hash: key.toString('hex') };
}
export async function verifyPassword(password, record) {
  const actual = await hashPassword(password, record.salt);
  const expected = Buffer.from(record.hash, 'hex');
  const received = Buffer.from(actual.hash, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}
const digest = token => createHash('sha256').update(token).digest('hex');
export function validateProduct(body) {
      const fields = {};
      const limits = { name: 150, description: 3000, size: 200 };
      for (const [field, limit] of Object.entries(limits)) {
        if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > limit) throw Object.assign(new Error(`${field} is required and must be at most ${limit} characters.`), { status: 400 });
        fields[field] = body[field].trim();
      }
      if (!['Keychains', 'Crochet Toys', 'Custom Clothing', 'Matching Accessories'].includes(body.category)) throw Object.assign(new Error('Choose a valid category.'), { status: 400 });
      if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price <= 0 || body.price > 1000000 || Math.abs(body.price * 100 - Math.round(body.price * 100)) > 0.000001) throw Object.assign(new Error('Price must be between 0.01 and 1,000,000, with at most two decimal places.'), { status: 400 });
      if (!Array.isArray(body.colors) || !body.colors.length || body.colors.length > 20 || body.colors.some(c => typeof c !== 'string' || !c.trim() || c.trim().length > 80)) throw Object.assign(new Error('Enter 1–20 colour options, each at most 80 characters.'), { status: 400 });
      if (typeof body.starting !== 'boolean') throw Object.assign(new Error('Starting price must be true or false.'), { status: 400 });
      Object.assign(fields, { category: body.category, price: body.price, colors: [...new Set(body.colors.map(c => c.trim()))], starting: body.starting });
  return fields;
}
export function installAuth(app, db) {
  const admins = db.collection('admins');
  const sessions = new Map();
  const attempts = new Map();
  const cleanup = setInterval(() => {
    for (const [key, value] of sessions) if (value.expires <= Date.now()) sessions.delete(key);
    for (const [key, value] of attempts) if (value.expires <= Date.now()) attempts.delete(key);
  }, 60000);
  cleanup.unref();
  app.post('/api/admin/login', async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store');
      const key = req.ip;
      let entry = attempts.get(key);
      if (!entry || entry.expires <= Date.now()) { entry = { count: 0, expires: Date.now() + 15 * 60000 }; attempts.set(key, entry); }
      if (++entry.count > 10) return res.status(429).json({ message: 'Too many attempts. Try again in 15 minutes.' });
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 256) return res.status(400).json({ message: 'Enter your email and password.' });
      const admin = await admins.findOne({ email: email.trim().toLowerCase() });
      const fallback = { salt: '00000000000000000000000000000000', hash: '00'.repeat(64) };
      const valid = await verifyPassword(password, admin || fallback);
      if (!admin || !valid) return res.status(401).json({ message: 'Incorrect email or password.' });
      const token = randomBytes(32).toString('hex');
      sessions.set(digest(token), { email: admin.email, expires: Date.now() + 60 * 60000 });
      res.json({ token, email: admin.email });
    } catch (err) { next(err); }
  });
  const requireAdmin = (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const token = req.get('Authorization')?.replace(/^Bearer /, '');
    const session = token && sessions.get(digest(token));
    if (!session || session.expires <= Date.now()) return res.status(401).json({ message: 'Please log in again.' });
    req.admin = session;
    next();
  };
  app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ email: req.admin.email }));
  app.post('/api/admin/products', requireAdmin, photoUpload, async (req, res, next) => {
    let photo;
    try {
      let body;
      try { body = JSON.parse(req.body.product); } catch { throw Object.assign(new Error('Invalid product details.'), { status: 400 }); }
      const fields = validateProduct(body || {});
      photo = await savePhoto(req.file);
      const product = { ...fields, id: randomUUID(), image: photo.path };
      const result = await db.collection('products').insertOne(product);
      res.status(201).json({ ...product, _id: result.insertedId });
    } catch (err) { if (photo) await photo.cleanup(); next(err); }
  });
  app.put('/api/admin/products/:id/photo', requireAdmin, photoUpload, async (req, res, next) => {
    let photo;
    try {
      if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw Object.assign(new Error('Invalid product ID.'), { status: 400 });
      const filter = { _id: new ObjectId(req.params.id) };
      const collection = db.collection('products');
      if (!await collection.findOne(filter)) return res.status(404).json({ message: 'Product not found.' });
      photo = await savePhoto(req.file);
      const result = await collection.updateOne(filter, { $set: { image: photo.path } });
      if (!result.matchedCount) { await photo.cleanup(); return res.status(404).json({ message: 'Product not found.' }); }
      res.json(await collection.findOne(filter));
    } catch (err) { if (photo) await photo.cleanup(); next(err); }
  });
  app.get('/api/admin/products', requireAdmin, async (req, res, next) => {
    try { res.json(await db.collection('products').find({}).sort({ id: 1 }).toArray()); } catch (err) { next(err); }
  });
  app.post('/api/admin/logout', requireAdmin, (req, res) => {
    sessions.delete(digest(req.get('Authorization').slice(7)));
    res.json({ message: 'Logged out' });
  });
  app.put('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
    try {
      if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ message: 'Invalid product ID.' });
      const body = req.body || {};
      const fields = validateProduct(body);
      const filter = { _id: new ObjectId(req.params.id) };
      const result = await db.collection('products').updateOne(filter, { $set: fields });
      if (!result.matchedCount) return res.status(404).json({ message: 'Product no longer exists. Refresh the catalog.' });
      res.json(await db.collection('products').findOne(filter));
    } catch (err) { next(err); }
  });
}
