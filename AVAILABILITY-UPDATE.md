# Availability update

Stop both terminals and copy the update ZIP contents into your existing creamycrochets project folder, replacing matching files. Preserve your .git folder, public photos, server/uploads, server/data/products.json, and local .env files. No database reset is required.

Root terminal:
```bash
npm install
npm run dev -- --port 5173 --strictPort
```
Backend terminal:
```bash
cd server
npm install
npm start
```

Use your existing login at http://localhost:5173/admin. Edit a product, uncheck Available for orders, and save. Refresh the shop: its card shows Unavailable, and Add to bag is disabled. Recheck and save to restore availability. Products without the new field remain available by default. The admin table also shows availability.

Test an old bag: add a product while available, mark it unavailable in the admin dashboard in a second tab, then prepare the order in the first tab. The backend checks current MongoDB data and blocks the draft. Remove unavailable items using the minus button (until quantity reaches zero). Preparing an order also updates current prices and validates colour choices. If the backend is offline, an order draft cannot be prepared. This check is not a stock reservation: the seller still confirms availability in WhatsApp.

Changes in the bag clear any previously prepared draft. Product details, new products and photo uploads still work. Uploaded photo files stay in server/uploads and are ignored by Git; back them up with MongoDB.

After testing, optionally re-export products.json and run:
```bash
git add .
git commit -m "Add product availability and order availability checks"
git push
```

Tests: from server, run `node --test *.test.js`. Backend tests use test doubles and do not modify your local MongoDB data. The build and backend tests were run; verify the browser flow above on your laptop.
