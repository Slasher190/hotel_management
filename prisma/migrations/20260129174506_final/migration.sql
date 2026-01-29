-- AlterTable
ALTER TABLE "food_orders" ADD COLUMN     "chefId" TEXT,
ADD COLUMN     "chefName" TEXT;

-- AddForeignKey
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
