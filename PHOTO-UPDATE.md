# Apply this update to your existing project

Stop both terminals. Copy the src and server folders, .gitignore and this guide from the update ZIP into your existing creamycrochets folder, replacing matching files. Keep your .git folder, database, public folder and server/data/products.json. This update contains no database reset or credentials.

Main project terminal:
```bash
npm install
npm run dev -- --port 5173 --strictPort
```
Second terminal:
```bash
cd server
npm install
npm start
```
Use your existing admin login at http://localhost:5173/admin. Click Add product, complete every field, choose a photo and save. Refresh the shop to see the new listing. Edit supports optional photo replacement.

Photos: JPG, PNG or WebP; maximum 5 MB and 25 megapixels. The server validates and re-encodes images as WebP up to 1600 pixels. Original bundled photos still work. New product IDs are generated automatically; existing numeric IDs stay unchanged.

New photos are stored in server/uploads, while MongoDB stores their paths. Back up server/uploads with the database. This folder is ignored by Git; teammates need a separate copy of uploaded photos to use an updated database export. Old replaced photos are retained. Failed new-product database saves clean up their new image.

Editing details and replacing a photo use separate requests. If the photo fails after details save, the dashboard says so; retry or cancel to retain the old photo. If a network request fails, check the catalog before retrying new-product creation to avoid duplicates.

After verifying locally:
```bash
git status
git add .
git commit -m "Add admin product creation and photo uploads"
git push
```
No GitHub push has been performed automatically. No new admin account is needed. This is still the local development setup on ports 5173 and 5000.
