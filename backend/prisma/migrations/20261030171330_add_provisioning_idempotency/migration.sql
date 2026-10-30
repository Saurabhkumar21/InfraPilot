-- 1. Add the column as nullable temporarily
ALTER TABLE "ProvisioningJob"
ADD COLUMN "idempotencyKey" TEXT;

-- 2. Backfill existing records with unique values
UPDATE "ProvisioningJob"
SET "idempotencyKey" = 'legacy-' || "id"::text
WHERE "idempotencyKey" IS NULL;

-- 3. Make the column required
ALTER TABLE "ProvisioningJob"
ALTER COLUMN "idempotencyKey" SET NOT NULL;