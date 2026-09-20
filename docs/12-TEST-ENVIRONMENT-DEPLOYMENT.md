# Test Environment Deployment

## Purpose and boundary

This is an internal acceptance environment, not the production environment.

- Web: Vercel project with root directory `apps/web`
- API: Render free Docker web service built from the repository root using `apps/api/Dockerfile`
- Database: a Render free PostgreSQL service created only for this test environment
- File storage: private Cloudflare R2 Bucket `palmpay-design-hub-test`
- Authentication: `AUTH_MODE=test`, a deliberately isolated, server-signed test session adapter

Do not use `AUTH_MODE=development` on any Internet-facing API. The development adapter trusts an HTTP header and is local-only by design. Do not use the test adapter in the future production environment; production requires OIDC/SSO.

## 1. Render API and PostgreSQL

1. In Render, choose **New +** then **Blueprint** and connect `lomi2026/palmpay-design-intelligence`, branch `codex/v1-project-handoff`.
2. Render reads the committed root `render.yaml`, creates the API and isolated PostgreSQL database, links `DATABASE_URL`, applies Prisma migrations at API start, then runs the one-time seed/bootstrap/catalog import hook.
3. During Blueprint creation, Render asks for the values marked `sync: false`: Vercel origin placeholder and the existing private R2 endpoint and credentials. Do not enter secrets into GitHub.
4. Choose the free instance options. This is suitable only for acceptance: the API sleeps after idle time and the free Render PostgreSQL database expires after 30 days.
5. After deployment is healthy, generate the public Render API URL and record it as `API_TEST_ORIGIN`.

The container startup path applies pending Prisma migrations and starts the API only. Seed, test-identity bootstrap and catalog imports belong to the Blueprint's idempotent initial deployment hook; do not add them to the container `CMD`. Render restarts a sleeping free instance through that command, so repeating all imports there materially delays every cold-start login.

The Blueprint supplies all non-secret variables and generates `TEST_AUTH_SESSION_SECRET` automatically. Supply only these values in Render's secret-value prompts:

```dotenv
WEB_ORIGIN="https://placeholder.invalid"
R2_ENDPOINT="https://<Cloudflare-account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="<Cloudflare R2 access key>"
R2_SECRET_ACCESS_KEY="<Cloudflare R2 secret key>"
```

Do not set `NEXT_PUBLIC_API_BASE_URL` on Render. It belongs to Vercel.

### Initial database data (run once)

The `render.yaml` initial deployment hook runs the following commands automatically after the API first becomes healthy. Run them only manually if the Render deployment log shows that the initial hook failed:

```bash
cd /app
pnpm --filter @palmpay/api prisma:seed
pnpm --filter @palmpay/api prisma:bootstrap:test
pnpm --filter @palmpay/api prisma:import:v9-1-projects
pnpm --filter @palmpay/api prisma:import:v9-1-ai-catalog
pnpm --filter @palmpay/api prisma:import:v9-1-design-assets
```

`prisma:bootstrap:test` creates or reactivates the configured administrator, makes that user the owner of the `palmpay-experience-design` team, and maintains the acceptance identities and organization-scoped roles below. It is idempotent and must be used only in the isolated test database.

The three v9-1 import commands are also idempotent. Their expected first-run totals are 33 AI projects, 6 AI Skills, 4 AI cases and 8 design assets. Do not use a local database dump as a cloud-test restore: it could include unrelated local identities and historical data.

## 2. Vercel web project

1. Import the same GitHub repository into Vercel.
2. Select branch `codex/v1-project-handoff`.
3. Set Root Directory to `apps/web`.
4. Enable source files outside the Root Directory if Vercel asks; the pnpm workspace lockfile is in the repository root.
5. Add both variables below for the Preview/Test environment, then deploy.

```dotenv
AUTH_MODE="test"
API_BASE_URL="https://<Render-API-domain>"
NEXT_PUBLIC_API_BASE_URL="https://<Render-API-domain>"
```

The server-only `API_BASE_URL` lets Next.js server components call the API. `NEXT_PUBLIC_API_BASE_URL` is used by browser-side upload code.

## 3. Exact-origin CORS updates

After Vercel creates the test URL:

1. Set Render `WEB_ORIGIN` to the exact HTTPS Vercel origin, with no trailing slash, then redeploy the API.
2. In R2 Bucket CORS, retain `http://localhost:3000` and add the exact Vercel test origin:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://<Vercel-test-domain>"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD", "DELETE"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 4. Test identity and acceptance

- `lomi2026@126.com` is the manager/administrator (`member`, `manager`, `admin`).
- `lomi2025@126.com` is the contributor (`member`).
- `lomi2024@126.com` is the reviewer (`reviewer`).
- All three are active members of the `palmpay-experience-design` team and sign in with their email address after the Vercel deployment is live.
- Passwordless email login is limited to this isolated acceptance environment. The API still resolves a pre-provisioned active user before issuing a short-lived signed session, and production must use enterprise OIDC/SSO.
- Verify member upload/submission, reviewer assignment/decision, administrator publication, signed attachment download and unauthorized-access rejection.

## 5. Production boundary

Never promote this database, passwordless test adapter, R2 Bucket or credentials directly to production. Production uses its own PostgreSQL database, production R2 Bucket and enterprise OIDC/SSO integration. The free Render PostgreSQL database expires after 30 days; export or discard this acceptance data before the expiry date.
