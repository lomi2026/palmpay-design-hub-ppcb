-- Retain historical review/audit records, but remove all operational review privileges.
DELETE FROM "permissions" WHERE "code" LIKE 'review.%' OR "code" IN ('content.publish', 'content.submit');
-- Former reviewers retain ordinary member access in exactly the same scopes.
INSERT INTO "user_roles" ("id", "user_id", "role_id", "scope_type", "scope_id")
SELECT md5(ur."id"::text || ':member')::uuid, ur."user_id", m."id", ur."scope_type", ur."scope_id"
FROM "user_roles" ur JOIN "roles" r ON r."id" = ur."role_id" CROSS JOIN "roles" m
WHERE r."code" = 'reviewer' AND m."code" = 'member'
ON CONFLICT ("user_id", "role_id", "scope_type", "scope_id") DO NOTHING;
DELETE FROM "roles" WHERE "code" = 'reviewer';
UPDATE "content_versions" SET "version_status" = 'DRAFT'
WHERE "version_status" IN ('IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED');
UPDATE "contents" SET "status" = 'DRAFT'
WHERE "status" IN ('IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED');
