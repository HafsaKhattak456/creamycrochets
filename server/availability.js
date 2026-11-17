export function installOrderCheck(app, db) {
  app.post('/api/products/check', async (req, res, next) => {
    try {
      const items = req.body?.items;
      if (!Array.isArray(items) || !items.length || items.length > 100) return res.status(400).json({ message: 'Your bag must contain 1–100 items.' });
      const checked = [], issues = [];
      for (const row of items) {
        if (!row || !['number', 'string'].includes(typeof row.id) || String(row.id).length > 100 || !Number.isInteger(row.qty) || row.qty < 1 || row.qty > 99 || typeof row.color !== 'string' || row.color.length > 80) return res.status(400).json({ message: 'Invalid bag item or quantity (maximum 99 per colour).' });
        const product = await db.collection('products').findOne({ id: row.id });
        if (!product) { issues.push('A product was removed from the catalog.'); continue; }
        if (product.available === false) { issues.push(`${product.name} is currently unavailable.`); continue; }
        if (!product.colors?.includes(row.color)) { issues.push(`${product.name}: please select a current colour option.`); continue; }
        checked.push({ ...product, color: row.color, qty: row.qty });
      }
      if (issues.length) return res.status(409).json({ message: issues.join(' ') });
      res.set('Cache-Control', 'no-store').json({ items: checked });
    } catch (err) { next(err); }
  });
}
