-- Fix existing users with invalid roles before applying enum constraint
UPDATE "users" SET "role" = 'MANAGER' WHERE "role" NOT IN ('MANAGER', 'STAFF') OR "role" IS NULL;

-- Now apply the enum constraint (this migration should run after the enum is created)
-- The enum should already exist from previous migration
