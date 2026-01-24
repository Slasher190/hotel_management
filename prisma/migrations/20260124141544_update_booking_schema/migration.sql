/*
  Warnings:

  - A unique constraint covering the columns `[visitorRegistrationNumber]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RoomCategory" AS ENUM ('ROOM', 'HALL');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "adults" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "billDate" TIMESTAMP(3),
ADD COLUMN     "billNumber" TEXT,
ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "guestAddress" TEXT,
ADD COLUMN     "guestGstNumber" TEXT,
ADD COLUMN     "guestMobile" TEXT,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "visitorRegistrationNumber" SERIAL;

-- AlterTable
ALTER TABLE "room_types" ADD COLUMN     "category" "RoomCategory" NOT NULL DEFAULT 'ROOM',
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_visitorRegistrationNumber_key" ON "bookings"("visitorRegistrationNumber");
