# Converting Images to WebP

## 1. Local images (public/, Icons/)

Convert all PNG, JPG, and JPEG files in `public/` and `Icons/` to WebP in place.

```bash
# Install dependency (one time)
npm install

# Create .webp files alongside originals (keeps .png/.jpg)
npm run convert:webp

# Optional: remove originals after you've updated code to use .webp
# Windows (PowerShell):
$env:DELETE_ORIGINALS="1"; npm run convert:webp
# macOS/Linux:
DELETE_ORIGINALS=1 npm run convert:webp
```

Then update your code to use the `.webp` paths (e.g. `camera-body-average.webp` instead of `camera-body-average.png`). When everything is updated, you can delete the old PNG/JPG files or run with `DELETE_ORIGINALS=1` to remove them during conversion.

---

## 2. Firebase Storage images (e.g. Canon Images)

Download and convert manually:

1. In [Firebase Console](https://console.firebase.google.com) → Storage → open the folder (e.g. **Canon Images**).
2. Download each PNG/JPG file.
3. Convert them to WebP on your machine:
   - Put the downloaded files in a folder and run `npm run convert:webp` from the project (point the script at that folder if needed), or
   - Use an online converter (e.g. [Squoosh](https://squoosh.app)) or a desktop tool.
4. In Storage, upload the new `.webp` files (same path/name with `.webp`).
5. **Update the website by updating the database (no code changes):**
   - Product images on the site come from Firestore: the `products` collection, field `imageUrl` (or `image`). The app already displays whatever URL is stored there.
   - For each Canon product: open the document in [Firebase Console](https://console.firebase.google.com) → Firestore → `products`, or use your **Admin** → Products and edit the product. Set `imageUrl` to the new WebP file URL from your **Canon-Webp** folder.
   - To get the URL for a file: Storage → Canon-Webp → click the file → copy the download URL (or use the link shown in the file details).
   - After you save the new URLs, the product cards, product detail page, search results, and order summary will show the WebP images automatically.

**Storage rules:** If you see "Unexpected 'match'" when saving rules in the Console, ensure every `match` is **inside** the `match /b/{bucket}/o { ... }` block. A valid example is in the project root: `storage.rules`.
