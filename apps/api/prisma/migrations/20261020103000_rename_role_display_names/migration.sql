-- Rename role display labels only. Stable role codes, assignments, scopes and
-- permission relations remain unchanged.
UPDATE "roles" SET "name" = '普通成员' WHERE "code" = 'member';
UPDATE "roles" SET "name" = '子管理员' WHERE "code" = 'manager';
