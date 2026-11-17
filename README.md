# creamycrochets
React + Bootstrap + custom CSS storefront prototype for a handmade crochet business.

## Run in VS Code
Install Node.js, open this folder in VS Code, and use the terminal:

```
npm install
npm run dev
```
Open the local URL printed in the terminal. To create a production build, run `npm run build`.

## Included
Responsive homepage, corrected transparent business logo, eight real creamycrochets products, searchable category filters, product details and colour choices, persistent local shopping cart, quantity controls, order draft generation, custom request draft generation, and FAQs.

## Before accepting real orders
Confirm the provisional starting prices for the cap, headband, and shoes. Add confirmed Instagram/WhatsApp details and production, shipping, payment, and returns policies. Drafts are browser-only: nothing is sent to the business. No customer database, login, payment processing, Express server, or MongoDB integration is included in this frontend milestone. Do not enter sensitive customer details in a shared browser.

## Next course milestone
Add an Express backend and MongoDB after requirements are agreed. Store products and orders on the server, validate requests, calculate totals server-side, and protect admin routes. Avoid using localStorage as a real order database.

## Running the project locally

Install Node.js, MongoDB Community Server, and MongoDB Compass.

### 1. Download the project

```bash
git clone https://github.com/HafsaKhattak456/creamycrochets.git
cd creamycrochets
```

### 2. Set up the database

Ensure the local MongoDB service is running.

In MongoDB Compass:
- Connect to mongodb://127.0.0.1:27017
- Create a database named creamycrochets.
- Create a collection named products.
- Import server/data/products.json into the empty collection once.

### 3. Start the backend

```bash
cd server
npm install
node create-admin.js
npm start
```

Choose your own admin email and password when prompted.
Run create-admin.js only once for your account.

### 4. Start the frontend

Open a second terminal in the main project folder:

```bash
npm install
npm run dev -- --port 5173 --strictPort
```

Shop: http://localhost:5173
Admin dashboard: http://localhost:5173/admin

Keep both terminals running.

Each teammate uses a separate local database. Product changes
on one laptop will not automatically appear on another.
