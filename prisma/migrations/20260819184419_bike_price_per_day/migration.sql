-- AlterTable: existing bikes get a day price derived from their hourly rate
-- (a full day is priced like five hours), then the default is dropped again.
ALTER TABLE "Bike" ADD COLUMN "pricePerDay" INTEGER NOT NULL DEFAULT 0;

UPDATE "Bike" SET "pricePerDay" = "pricePerHour" * 5 WHERE "pricePerDay" = 0;

ALTER TABLE "Bike" ALTER COLUMN "pricePerDay" DROP DEFAULT;
