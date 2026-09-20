-- New tags remain unavailable until an administrator explicitly enables them.
ALTER TABLE "tags" ALTER COLUMN "status" SET DEFAULT 'disabled';

-- Preserve the distinct MERGED lifecycle state while disabling every tag that
-- was previously available by default.
UPDATE "tags"
SET "status" = 'disabled'
WHERE "status" = 'active';
