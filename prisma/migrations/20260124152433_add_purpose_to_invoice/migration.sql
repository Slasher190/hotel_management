-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "visitorRegistrationNumber" DROP NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "purpose" TEXT;
