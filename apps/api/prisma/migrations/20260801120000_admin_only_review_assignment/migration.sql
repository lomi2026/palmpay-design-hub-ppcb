-- Reviewer assignment is a governance action reserved for platform administrators.
INSERT INTO "permissions" (
  "id",
  "code",
  "module",
  "name",
  "description",
  "created_at",
  "updated_at"
)
VALUES (
  md5('palmpay:permission:review.assign')::uuid,
  'review.assign',
  'review',
  '分配审核人',
  '分配或重新分配待审核内容的审核人',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO UPDATE SET
  "module" = EXCLUDED."module",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT "roles"."id", "permissions"."id", CURRENT_TIMESTAMP
FROM "roles"
CROSS JOIN "permissions"
WHERE "roles"."code" = 'admin'
  AND "permissions"."code" = 'review.assign'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
