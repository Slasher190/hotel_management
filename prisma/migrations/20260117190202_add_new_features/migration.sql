/*
  Warnings:

  - You are about to drop the column `roomType` on the `rooms` table. All the data in the column will be lost.
  - Added the required column `roomTypeId` to the `rooms` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BusStatus" AS ENUM ('BOOKED', 'PENDING');

-- AlterEnum
ALTER TYPE "IdType" ADD VALUE 'VOTER_ID';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "additionalGuests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "mattresses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tariff" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "advanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "billDate" TIMESTAMP(3),
ADD COLUMN     "billNumber" TEXT,
ADD COLUMN     "companyCode" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "guestAddress" TEXT,
ADD COLUMN     "guestGstNumber" TEXT,
ADD COLUMN     "guestMobile" TEXT,
ADD COLUMN     "guestNationality" TEXT,
ADD COLUMN     "guestState" TEXT,
ADD COLUMN     "guestStateCode" TEXT,
ADD COLUMN     "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tariff" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "roomType",
ADD COLUMN     "roomTypeId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "RoomType";

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "gstin" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_bookings" (
    "id" TEXT NOT NULL,
    "busNumber" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "status" "BusStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bus_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_types_name_key" ON "room_types"("name");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
