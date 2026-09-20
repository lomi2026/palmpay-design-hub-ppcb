# PPCB deployment

Application: `palmpay-design-hub-builder`. Current release procedure: [PPCB release standard](../../docs/19-PPCB-RELEASE-STANDARD.md). Use the verified commit in the dedicated PPCB workspace and reconcile the latest managed revision before every release; historical commit IDs below are not current release candidates.

The user selected isolated testing and Owner-managed DingTalk access. This source keeps the formal Next.js/NestJS/Prisma architecture and latest approved visual and direct-publication behavior.

## Runtime

- PPCB and Render use `node:24-bookworm-slim`; the project requires Node.js >=24. PPCB retains the platform-maintainer-provided Debian OpenSSL installation required by Prisma. The user requested reverting the Node.js 22 experiment on 2026-09-17.
- The PPCB Dockerfile deliberately uses one build stage. Dependency manifests are copied and installed before application source, so a small code-only change can reuse the dependency layer when the PPCB builder cache is available. Application builds, traced-runtime packaging and development-file cleanup remain in the same final layer. This avoids the PPCB/Kaniko context loss seen when a later named stage tried to resolve `/workspace/src/package.json`, while keeping the assembled application runtime at about 88 MB before base-image overhead.

- One immutable image contains the testing and production Next.js builds. Next.js basePath is compiled, so the runtime selects the matching prebuilt output using the platform-injected database schema. No rebuilding occurs during promotion.
- The external listener uses `PORT` and routes to loopback-only Web/API processes. It removes development/bearer authentication and generates a runtime-only internal secret. Identity comes from the trusted PPCB gateway.
- Missing identity is rejected. Existing organization/team scopes and disabled/deleted-user enforcement remain. Effective permissions are the intersection of stored Hub role grants and PPCB application grants.
- The configured Owner identity maps to the documented legacy Owner email. Other PPCB users receive a stable employee identity key and a reserved internal email key. Legacy employee mappings must be reviewed before migration; email alone never links arbitrary incoming users.
- Both environments apply migrations and idempotent organization/role/permission defaults, followed by the approved bundled content import using target-environment identity mappings. Cover import failures are logged without blocking startup; release acceptance must separately confirm that required covers were imported. Health alone does not certify migration completeness.
- The schema is validated against the selected application and used by Prisma queries, raw SQL, seeding and migrations. Each pooled connection receives its own search_path; SSL is disabled as required by PPCB.
- `/healthz` requires a responding database and Next.js process. It is a liveness/readiness check, not evidence that attachments or data migration have passed.
- PPCB environments use the platform private-OSS business-file contract. The backend requests one-object upload URLs, confirms completed uploads, stores only the returned PPCB `fileId`, and requests short-lived download URLs after application authorization. Browser code never receives the runtime token or OSS credentials.
- The 48-content migration includes the five READY cover images actually referenced by published content. Startup verifies the bundled bytes and SHA-256 values, uploads them idempotently to the target environment's private storage, and links them after the content import. The published set has no other attachment relations or case-evidence files.
- Bundled cover discovery is anchored to the compiled migration module rather than the process working directory, because PPCB launches the seed from `/app/apps/api` while the immutable files live under `/app/deployment/ppcb/content-files`.
- Local development keeps the local storage driver. The legacy R2 adapter remains available for the original hosting environment during cutover, but the PPCB image sets `FILE_STORAGE_DRIVER=ppcb` and does not require R2 configuration.
- The published PPCB file contract does not expose object deletion. Removing an attachment revokes its application reference immediately, while the private orphan remains platform-internal until PPCB lifecycle cleanup is available.

## Required runtime secrets

No R2 or OSS access key is required in PPCB. The platform injects `PPCB_MESSAGE_API_URL` and the backend-only `PPCB_MESSAGE_SERVICE_TOKEN`; the application must not persist, log or expose either value. The existing PPCB internal identity secret handling remains unchanged.

If the original hosting environment remains online during acceptance, keep its existing R2 configuration there until the PPCB testing and production file workflows pass. Remove or disable the original R2 service only after production acceptance and backup confirmation.

## Release gates

1. Run type checks, lint, permission tests, integration tests, builds and migration validation locally. Do not use a PPCB build to discover an issue that local checks can catch.
2. Commit the verified release changes, then run `pnpm ppcb:package`. The command creates a ZIP from the committed revision only and includes source, lockfile, workspace manifests, Dockerfile and this deployment directory. The selected paths omit legacy snapshots and general documentation. Inspect the actual archive to ensure no .env*, dependencies, generated output, private configurations or backups are tracked under the selected paths.
3. Download the latest managed PPCB source revision and use its revision ID as `baseRevision`. Complete source preflight once, then publish the generated ZIP to testing once.
4. Use `app_test_request` for real runtime health/pages/API and temporary isolated CRUD. Validate browser navigation, uploads/downloads, signed URL expiry and denied access. After a confirmed failure, stop and report; fix and republish only within renewed user authorization.
5. For migration changes, re-inventory the explicitly approved source scope, identity mapping, foreign keys and file checksums. The recorded approved set is 48 contents and five referenced covers, not the entire historical backup or all nine exported objects. Keep raw backups and exports outside Git.
6. Verify testing files and production configuration separately. Preserve the original hosting/storage until production acceptance and explicit retirement authorization; do not copy testing drafts into production.
7. Obtain production confirmation after the tested release and migration impact are reviewable. Promote the exact tested image, verify production behavior and record remaining acceptance gaps.

The archive script checks tracked release changes and ZIP integrity, but does not detect omitted untracked files or perform a complete sensitive-content scan. Apply the additional package gates in the release standard.

## Fast release path for small code changes

Small code changes still require a new immutable image; PPCB does not currently expose a file-level hot patch path. Use this sequence:

1. Complete the change and all relevant local acceptance checks.
2. Commit the exact verified tree and run `pnpm ppcb:package`.
3. Preflight and publish the archive to the isolated testing environment.
4. Test the changed feature plus health, login, permissions and file upload/download when affected.
5. After explicit production confirmation, promote the exact tested image with `app_promote_test_to_production`. Promotion does not rebuild or re-upload source.

Content, cover and attachment updates made through the application do not require a code release. Batch related code fixes into one verified testing build instead of publishing each file separately.

## Historical platform attempt: restored Node.js 24 (2026-09-17)

The attempt records below were superseded by the successful September 20 release documented in `docs/05-CURRENT-STATUS.md`. Their revisions and next actions must not be reused without current verification.

Restored Node.js >=24 and node:24-bookworm-slim as requested, preserving the platform administrator OpenSSL dependency. Used large build profile based on the administrator-confirmed prior OOM. Both submitted archives passed preflight; both builds failed before application compilation with Dockerfile line 4 unknown-instruction/single-quote errors. The second archive has a normal RUN on line 4 and no quote-only instruction; changing the install command to a single line did not help. PPCB-1028 tracks suspected build-preparation Dockerfile corruption; the actual transformed file has not been inspected.

Final build: BUILD-MU4ZHZD2-797CEDC4EA; operation: OP-MU4ZHZD2-DB25F7DA0F; revision: REV-MU4ZHZD2-991262EB5D; archive SHA-256: ea67b6eb21bd5077ee2126cd18d6c1190889e8bb551194c69c70bfcd40136139. No testing runtime, production promotion, original data migration or R2 shutdown completed. Query live status and obtain latest managed source before retrying.

## Historical platform attempt: Node.js 22 (2026-09-15)

Local Node.js 22.23.2 / pnpm 11.7.0 verification passed: API 81/81 (zero skips), Web 50/50, both frontend builds, API build, lint, type checks and local Prisma migration deployment. This does not prove Linux Alpine compatibility.

PPCB preflight passed for archive `aec09d85a025cbfc204d42d73e55eedca32f970b19d7aefd2a631fda6d6fd087`. Testing build BUILD-MU2BGAMU-22000292A7 / OP-MU2BGAMV-56E7E763AA pulled and unpacked node:22-alpine, then FAILED at the first shell execution with `fork/exec /bin/sh: exec format error`, before any application command or apk installation. Suspected image/build CPU architecture mismatch is tracked by PPCB-1023. Latest managed revision: REV-MU2BGAMV-ED849D8DE9. Query current status and download/verify latest source before retrying.

## Previous platform attempt: Node.js 24 (2026-09-15)

Final archive passed preflight and entered testing build BUILD-MU2A0UIF-02D36B4B2F (operation OP-MU2A0UIF-84DE741012). Source checksum: 270de3180f14b0360d325c736c5bbbd9be058a5b6da6c66fbd8bef835808ba39. The build FAILED at base-image retrieval with MANIFEST_UNKNOWN for node:24-bookworm-slim, before executing application build commands. Cache request: PPCB-1021. Latest managed source revision: REV-MU2A0UIF-DDC78ABC6E, platform commit eea7987082a32e571b26ed1ef496be80ff32614a. Download and verify the platform source before further source updates and provide baseRevision when republishing.

PPCB-1020 records an earlier upload delay; subsequent transfer completed. Do not treat that historical issue as a current upload failure. No PPCB testing runtime, production deployment or business-data migration has completed.
