# Admin login — local development

Your existing MongoDB products are preserved. This update does not import, delete, or replace products.

1. Extract this ZIP into a new folder and open that folder in VS Code. Keep the old folder as a backup.
2. Keep the MongoDB Windows service running. Compass itself can be closed.
3. Frontend terminal, from the project root: `npm install` then `npm run dev -- --port 5173 --strictPort`.
4. Backend terminal: `cd server`, `npm install`, then `node create-admin.js`.
5. Enter your own email and a unique password of 12–256 characters. Password input is hidden. There is no default password and no public registration endpoint. Repeating this command with the same email refuses to overwrite it.
6. Start the backend with `npm start`.
7. Open http://localhost:5173/admin and sign in. You should see your eight database products. The storefront is at http://localhost:5173/.

## What changed

- Passwords are salted and hashed with Node's scrypt, never stored in plaintext.
- The backend checks authentication on every admin endpoint. Changing the page URL does not grant access.
- Login is limited to 10 attempts per IP in 15 minutes, including successful attempts.
- Sessions expire after one hour, are revoked on logout, and are cleared when the backend restarts. The browser keeps the token in memory: refreshing the admin page requires login again.
- Product editing is available through the Edit button: name, category, price, size, colour options, description, and the starting-price checkbox. Changes require admin authentication and server validation. Product IDs and photos are preserved. New products, availability controls, and photo uploads are the next stage.
- Local development only. HTTPS and deployment-specific settings are required before hosting the authenticated backend online.

## Checks on your laptop

- Wrong password shows an error; correct credentials show the admin catalog.
-  /api/admin/products without authentication returns 401.
- Log out returns to the login form.
- The shop still loads your existing products through /api/products.
- Edit the panda description, save, then refresh the shop and open its details to confirm the change. Cancel leaves the database untouched. Keep your existing admin account; do not run create-admin.js again if it already exists.

Optional configuration: MONGODB_URI and MONGODB_DB environment variables override the local connection and database name. Both backend scripts use the same variables. No .env loader is needed for default local setup.
