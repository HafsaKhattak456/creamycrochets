# Saved custom requests

Stop both servers and copy this update into your existing creamycrochets project, replacing matching files. Keep your .git folder, database, public photos, server/uploads, server/data and local configuration. This is an update, not a complete project.

Root terminal: `npm run dev -- --port 5173 --strictPort`

Second terminal: `cd server` then `npm start`.

No new dependencies or admin account are required. The backend automatically creates the customRequests collection and indexes. Existing orders, products and admins remain untouched.

## Customer test

Click Create a custom request on the homepage. Enter a test name, Pakistani mobile number, requested piece, colours/size/design notes, and optional preferred date. Submit to save a New request in MongoDB. The receipt includes its request number and a WhatsApp follow-up link. A preferred date is not a preparation-time promise. Delivery remains within Karachi.

Saving does not send WhatsApp automatically. The customer must open the link and send the message. The maker confirms design, quote and timing separately. No payment is collected, and no regular product order is automatically created.

Submission retries in the same open form use the same request key and return the same receipt. If the network fails, keep the form open and retry with identical details. Closing/reopening resets its key: contact the seller if you are uncertain whether an earlier request saved.

## Admin test

Use your existing login at /admin. Custom Requests appears below Orders. Refresh requests, review details, enter a quoted price (optional; blank means not quoted), choose New / Discussing / Accepted / Completed / Declined and save. Changes persist in MongoDB. Statuses record your workflow; the seller decides when to move between them. Saving a quote or status does not notify the customer, record payment, or convert the request to an order.

Records are paginated 20 per page. Only authenticated admins can view customer details and save quotes/statuses. There is no public lookup endpoint. Do not export customRequests, admins or orders into your public GitHub repository. products.json remains only a product snapshot.

After testing:
```bash
git add .
git commit -m "Save custom requests and manage quotes in admin"
git push
```

The production build and automated backend tests were checked. Backend tests use test doubles; complete the browser test above with your own local MongoDB. No remote GitHub push was performed automatically.
