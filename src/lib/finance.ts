import { differenceInCalendarMonths, isAfter, isBefore, startOfMonth } from "date-fns";
import { toNumber, type Numberish } from "./format";

export function goalMonthlyRequired(targetAmount: Numberish, currentAmount: Numberish, targetDate: Date | null): number {
  const remaining = toNumber(targetAmount) - toNumber(currentAmount);
  if (remaining <= 0) return 0;
  if (!targetDate) return remaining;

  const now = startOfMonth(new Date());
  const monthsLeft = Math.max(differenceInCalendarMonths(startOfMonth(targetDate), now), 1);
  return remaining / monthsLeft;
}

export function goalProgressPercent(targetAmount: Numberish, currentAmount: Numberish): number {
  const target = toNumber(targetAmount);
  if (target <= 0) return 0;
  return Math.min(toNumber(currentAmount) / target, 1);
}

export function budgetStatus(limitAmount: Numberish, spentAmount: Numberish) {
  const limit = toNumber(limitAmount);
  const spent = toNumber(spentAmount);
  const available = limit - spent;
  const percentUsed = limit > 0 ? spent / limit : 0;
  let level: "ok" | "warning" | "danger" = "ok";
  if (percentUsed >= 1) level = "danger";
  else if (percentUsed >= 0.8) level = "warning";
  return { limit, spent, available, percentUsed, level };
}

export function debtPayoffProjection(debt: {
  remainingAmount: Numberish;
  installmentAmount: Numberish;
  installmentsTotal: number | null;
  installmentsPaid: number;
  nextDueDate: Date | null;
}) {
  const remaining = toNumber(debt.remainingAmount);
  const installment = toNumber(debt.installmentAmount);
  const installmentsLeft = debt.installmentsTotal
    ? Math.max(debt.installmentsTotal - debt.installmentsPaid, 0)
    : installment > 0
      ? Math.ceil(remaining / installment)
      : 0;

  let payoffDate: Date | null = null;
  if (debt.nextDueDate && installmentsLeft > 0) {
    payoffDate = new Date(debt.nextDueDate);
    payoffDate.setMonth(payoffDate.getMonth() + (installmentsLeft - 1));
  }

  return { installmentsLeft, payoffDate };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}

export function isOverdue(dueDate: Date | null, status: string): boolean {
  if (!dueDate || status !== "PENDING") return false;
  return isBefore(dueDate, new Date()) && !isAfter(dueDate, new Date(8640000000000000));
}
