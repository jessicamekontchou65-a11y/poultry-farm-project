# Photo & video posts

Farmers and shopkeepers publish photos and videos on the community feed (`/platform`, and the buyer home feed) to promote their products. Everyone signed in can like and comment.

## Who can do what

| Action | Farmer / shopkeeper / admin | Buyer (customer) | Guest |
|---|---|---|---|
| Upload photos & videos | ✅ (up to 4 per post) | — | — |
| Link one of their own products to a post ("Buy" button) | ✅ | — | — |
| Text posts | ✅ | ✅ (questions, advice) | — |
| Like, comment, reply, save, share | ✅ | ✅ | read only |

The post shows the author's selling role (Farmer, Shopkeeper) rather than "Customer" when the account holds several roles.

## Uploads (`POST /api/media/upload`, multipart field `file`)

- **Formats** are checked from the file's bytes, not its name: JPG, PNG, WebP, GIF photos; MP4, MOV, WebM videos. HEIC photos are refused because browsers cannot display them.
- **Limits**: 8 MB per photo, 50 MB per video, 30 uploads per 10 minutes per client.
- **Storage**: `MEDIA_DIR` on disk (default `./uploads`, git-ignored), served at `/api/media/files/<random-name>` with range support (video seeking), `nosniff` and a 30-day cache. If `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are all set, files go to Cloudinary instead (signed upload, folder `poultryhub/posts`).
- Each upload is recorded as a `MediaAsset` owned by the uploader. A post can only use the uploader's own assets; deleting a post deletes its local files.

> On a server whose disk is wiped on redeploy (most PaaS), configure Cloudinary or mount a persistent volume for `MEDIA_DIR`.

## Posts (`POST /api/platform/posts`)

New fields: `mediaIds` (from the upload response, in display order), `asRole` (optional), `productId` / `farmId` / `shopId` (must belong to the author unless admin). Posts store `media: [{ url, kind: "image" | "video", mimeType }]`; `mediaUrls` still lists the images for older clients.

## Notifications

The author is notified (FR/EN) when someone comments on their post, and the first time each person likes it. Their own likes and comments do not notify them.

## Where sellers start

- **Plateforme** in the sidebar, then **Photo / Vidéo** in the composer.
- **Promouvoir (photos/vidéo)** on each approved product (farmer "My Products", shopkeeper shops page) opens the composer with that product already linked.
