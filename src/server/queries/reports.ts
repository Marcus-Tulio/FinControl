import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { lastNMonths } from "@/lib/period";
import type { TransactionKind } from "@prisma/client";

export async function getSavingsRateSeries(userId: string, months = 12) {
  const range = lastNMonths(months);
  return Promise.all(
    range.map(async ({ start, end, label }) => {
      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, kind: "INCOME", status: "PAID", date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);
      const inc = toNumber(income._sum.amount);
      const exp = toNumber(expense._sum.amount);
      return { month: label, savingsRate: inc > 0 ? (inc - exp) / inc : 0, income: inc, expense: exp };
    })
  );
}

export async function getDebtsEvolution(userId: string, months = 12) {
  const [debts, payments] = await Promise.all([
    prisma.debt.findMany({ where: { userId } }),
    prisma.debtPayment.findMany({ where: { debt: { userId } }, orderBy: { date: "asc" } }),
  ]);

  const range = lastNMonths(months);
  const totalOriginal = debts.reduce((s, d) => s + toNumber(d.originalAmount), 0);

  return range.map(({ end, label }) => {
    const paidUpToDate = payments
      .filter((p) => p.date <= end)
      .reduce((s, p) => s + toNumber(p.amount), 0);
    return { month: label, remaining: Math.max(totalOriginal - paidUpToDate, 0) };
  });
}

export async function getInvestmentsEvolution(userId: string, months = 12) {
  const movements = await prisma.investmentMovement.findMany({
    where: { investment: { userId } },
    orderBy: { date: "asc" },
  });

  const range = lastNMonths(months);
  return range.map(({ end, label }) => {
    let total = 0;
    for (const m of movements) {
      if (m.date > end) continue;
      if (m.type === "CONTRIBUTION" || m.type === "DIVIDEND") total += toNumber(m.amount);
      if (m.type === "WITHDRAWAL") total -= toNumber(m.amount);
    }
    return { month: label, value: Math.max(total, 0) };
  });
}

export async function getReportByAccount(userId: string, start: Date, end: Date) {
  const accounts = await prisma.financialAccount.findMany({ where: { userId } });
  const results = await Promise.all(
    accounts.map(async (acc) => {
      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, financialAccountId: acc.id, kind: "INCOME", status: "PAID", date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, financialAccountId: acc.id, kind: "EXPENSE", status: "PAID", date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);
      return {
        accountId: acc.id,
        name: acc.name,
        income: toNumber(income._sum.amount),
        expense: toNumber(expense._sum.amount),
      };
    })
  );
  return results.filter((r) => r.income > 0 || r.expense > 0);
}

export async function getReportByCategory(userId: string, kind: TransactionKind, start: Date, end: Date) {
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, kind, status: "PAID", date: { gte: start, lte: end }, categoryId: { not: null } },
    _sum: { amount: true },
    _count: true,
  });
  const categories = await prisma.category.findMany({ where: { id: { in: grouped.map((g) => g.categoryId!).filter(Boolean) } } });
  const map = new Map(categories.map((c) => [c.id, c]));

  return grouped
    .map((g) => ({
      name: map.get(g.categoryId!)?.name ?? "Outros",
      color: map.get(g.categoryId!)?.color ?? "#6366f1",
      total: toNumber(g._sum.amount),
      count: g._count,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getTransactionsForExport(userId: string, start: Date, end: Date) {
  return prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: { category: true, financialAccount: true },
    orderBy: { date: "asc" },
  });
}
