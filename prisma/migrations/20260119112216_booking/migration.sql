-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "additionalGuestCharges" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "additionalGuestCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isManual" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "passwordResetSecret" TEXT NOT NULL DEFAULT 'HOTEL_RESET_2024',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);
