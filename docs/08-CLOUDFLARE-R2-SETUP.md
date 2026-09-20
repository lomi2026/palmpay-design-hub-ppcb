# Cloudflare R2 Attachment Setup

## Purpose

The API already has a protected R2 attachment boundary. This setup connects it to one private production bucket without placing Cloudflare credentials in the browser or in Git.

The browser receives a short-lived, operation-specific signed URL. PostgreSQL remains the source of truth for attachment metadata, checksum, upload state and ownership.

## 1. Create a private bucket

In Cloudflare Dashboard, open **Storage & databases → R2 → Overview → Create bucket**.

- Recommended name: `palmpay-design-hub`
- Keep the bucket private. Do not enable a public bucket or public development URL.
- Select the desired location/jurisdiction before creation. A jurisdictional bucket requires its matching endpoint.

## 2. Create least-privilege S3 credentials

In **R2 → Overview → Manage API Tokens**:

1. Create an Account API token or User API token.
2. Select **Object Read & Write**.
3. Select **Apply to specific buckets only** and choose the bucket created above.
4. Create the token and copy both **Access Key ID** and **Secret Access Key** immediately. Cloudflare shows the secret only once.

Do not send either value in chat, commit it, or put it in a frontend environment variable.

## 3. Add the values to the local API environment

Open the ignored file `apps/api/.env` and add the following values (replace the placeholders locally):

```dotenv
R2_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
R2_BUCKET="palmpay-design-hub"
R2_ACCESS_KEY_ID="<Access Key ID>"
R2_SECRET_ACCESS_KEY="<Secret Access Key>"
R2_SIGNED_URL_TTL_SECONDS="300"
```

For an EU or FedRAMP jurisdictional bucket, use Cloudflare's jurisdiction-specific endpoint instead of the default endpoint. Restart the API after saving the file.

## 4. Configure the bucket CORS policy

In the bucket **Settings → CORS Policy → Add CORS policy → JSON**, use this development rule:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD", "DELETE"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

When the web app gets a production origin, add that exact HTTPS origin to `AllowedOrigins`. Do not use `*` for a private design-content bucket.

## 5. Verify the protected flow

After the API is restarted, a signed-in workspace user with `content.create` can use this sequence:

1. `POST /api/files/upload-intents` with `originalName`, `mimeType`, `sizeBytes` and the file's Base64 SHA-256 checksum.
2. `PUT` the bytes directly to the returned R2 URL, using exactly the returned `Content-Type` header.
3. `POST /api/files/:id/complete` to verify the R2 object's size, MIME type and a server-calculated SHA-256 checksum before it becomes `READY`.
4. `GET /api/files/:id/download` to receive a short-lived signed download URL.
5. `DELETE /api/files/:id` to remove the R2 object and mark its PostgreSQL record deleted.

The current boundary is intentionally owner-or-`content.edit_all` only. Attaching a file to a formal content version will be added with the Phase 3 drafting/version workflow, so attachments cannot bypass versioned-content permissions.

## References

- [Cloudflare R2 S3 setup](https://developers.cloudflare.com/r2/get-started/s3/)
- [Cloudflare R2 token permissions](https://developers.cloudflare.com/r2/api/tokens/)
- [Cloudflare R2 CORS for presigned URLs](https://developers.cloudflare.com/r2/buckets/cors/)
