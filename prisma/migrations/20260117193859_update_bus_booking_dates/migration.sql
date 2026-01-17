/*
  Warnings:

  - You are about to drop the column `bookingDate` on the `bus_bookings` table. All the data in the column will be lost.
  - Added the required column `fromDate` to the `bus_bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toDate` to the `bus_bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bus_bookings" DROP COLUMN "bookingDate",
ADD COLUMN     "fromDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "toDate" TIMESTAMP(3) NOT NULL;
