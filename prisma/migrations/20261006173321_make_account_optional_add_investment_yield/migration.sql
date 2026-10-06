-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "yieldAnchorDate" TIMESTAMP(3),
ADD COLUMN     "yieldRate" DECIMAL(10,4);

-- AlterTable
ALTER TABLE "RecurringRule" ALTER COLUMN "financialAccountId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "financialAccountId" DROP NOT NULL;
