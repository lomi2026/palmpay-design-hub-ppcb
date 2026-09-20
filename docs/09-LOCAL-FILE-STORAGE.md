# Local Development File Storage

## Scope

This is the no-cost development fallback for attachment testing when Cloudflare R2 cannot be activated. It is not a production replacement for Cloudflare R2.

## Default configuration

The API defaults to `FILE_STORAGE_DRIVER=local`. Files are stored outside the repository at:

```text
/private/tmp/palmpay-design-intelligence-uploads
```

They are deliberately not committed to GitHub and are only available on this Mac. PostgreSQL continues to retain the attachment metadata, ownership, checksum and upload state.

## Security boundary

- Upload and download URLs are signed, file-specific and expire after five minutes by default.
- A local upload must match the upload intent's size and MIME type.
- Completion recalculates the SHA-256 checksum before an attachment becomes `READY`.
- A signed-in owner or a user with `content.edit_all` can request a download URL or delete the file.

## Optional environment settings

```dotenv
FILE_STORAGE_DRIVER="local"
LOCAL_STORAGE_PATH="/private/tmp/palmpay-design-intelligence-uploads"
FILE_STORAGE_SIGNING_SECRET=""
FILE_STORAGE_SIGNED_URL_TTL_SECONDS="300"
```

`LOCAL_STORAGE_SIGNING_SECRET` may be empty only for non-production development. It must be set before running the local driver in production, although production should use R2 instead.

## Moving to Cloudflare R2 later

When a payment method becomes available, follow `docs/08-CLOUDFLARE-R2-SETUP.md`, set `FILE_STORAGE_DRIVER="r2"`, add the R2 credentials to the ignored `apps/api/.env`, then restart the API. Existing local files do not transfer automatically; upload the required production attachments again or perform a deliberate migration.
