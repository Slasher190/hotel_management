-- AlterTable
ALTER TABLE "food_orders" ADD COLUMN     "invoiceId" TEXT;

-- AddForeignKey
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
