# Checkout and order tracking update

Copy this update's contents into your existing creamycrochets project, accepting replacements. Stop both servers first. Keep your .git folder, database, public photos, server/uploads, server/data and local configuration files.

Root terminal: `npm run dev -- --port 5173 --strictPort`

Second terminal: `cd server` then `npm start`.

Use your existing account. The backend automatically creates an orders collection and unique request-key/order-number indexes. Products and admins are not reset.

## Customer test

1. Add a product to your bag and click Continue to checkout.
2. Enter your name, Pakistani mobile number, full Karachi address, payment preference, and optional customisation notes. Use fake test details for testing.
3. Submit once. The website saves a Pending order, displays its order number and estimated product subtotal, and clears the purchased bag. Delivery charges remain unconfirmed and no payment is collected.
4. Follow up on WhatsApp if desired. Saving an order does not automatically send a WhatsApp message. WhatsApp confirmation is a separate customer action.

Prices, colours and availability are checked on the server. No stock is reserved. Custom sizes and starting prices require seller confirmation. Card and JazzCash are preferences only, with no online payment processing. Custom-design requests outside the product bag still use the existing WhatsApp request form and are not saved as orders in this update.

## Admin test

Open /admin and log in. The Orders section shows customer details, items, payment preference and status. Change status through Pending, Confirmed, Preparing, Dispatched, Delivered or Cancelled as appropriate. Refresh orders to see the current database records. Orders are paginated 20 per page. Status updates do not mark payment as collected or send notifications.

Only authenticated admins can list orders or change status. There is no public order lookup endpoint. Customer names, phone numbers and addresses are stored only in MongoDB, not Git or products.json. Do not export orders or admins to your public repository.

Repeated submissions from the same checkout page reuse a request key so retries cannot create a second order. On network failure, keep the page open and retry with identical details. Closing/reloading the page starts a new checkout; contact the seller if you are unsure whether an earlier request saved. Do not submit again merely because WhatsApp was not sent.

Keep uploaded photos backed up alongside MongoDB. Existing availability and upload features are preserved. This is a local development setup; browser testing with your actual MongoDB remains necessary. Automated backend tests use test doubles and do not access customer records.

After verifying locally:
```bash
git add .
git commit -m "Add checkout and admin order tracking"
git push
```
