-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('PERSONAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('FIXED', 'VARIABLE', 'EXTRAORDINARY');

-- AlterTable
ALTER TABLE "RecurringRule" ADD COLUMN     "expenseType" "ExpenseType";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "expenseType" "ExpenseType";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileType" "ProfileType" NOT NULL DEFAULT 'PERSONAL';
