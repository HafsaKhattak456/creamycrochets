# Admin dashboard tabs

Stop the frontend terminal. Copy src/Admin.jsx and src/admin.css from this update into the src folder of your EXISTING creamycrochets Git project, accepting replacement of Admin.jsx. Do not create a separate working project. No backend, database, Vite proxy, image uploads, or requestKey changes are needed.

From the project root, start `npm run dev`. Keep the backend running in its existing terminal; if stopped, run `cd server` and `npm start` in a second terminal.

Open /admin on your laptop or phone and sign in with your existing account.

- Products is the initial section, with the current collection count, photos, prices, availability, Add product, and Edit.
- Orders loads the existing order management component when first opened.
- Custom Requests loads the existing quote/status management component when first opened.
- Switching sections hides rather than resets visited sections, preserving unsaved forms and page selections for the current login session.
- On narrow screens, product rows become cards. Controls use touch-friendly sizing and forms use larger input text.
- API calls continue using relative /api URLs and uploaded photos use /uploads, preserving your mobile proxy setup.

The production build passed. Check all three sections on laptop and phone, including saving an edit, an order status and a quote. No live database or browser session was accessed during this layout update.

Save to Git after testing:
```bash
git add src/Admin.jsx src/admin.css ADMIN-TABS-UPDATE.md
git commit -m "Organise admin dashboard into themed responsive tabs"
git push
```

This update ZIP contains only the two frontend files and this guide. It does not include or overwrite any .git folder, server/uploads, product exports, credentials or database records.
