import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { getPeriodRange, getPreviousPeriodRange, lastNMonths, type PeriodKey } from "@/lib/period";
import { percentChange } from "@/lib/finance";
import { getAccountBalances } from "./accounts";
import { getPortfolioSummary } from "./investments";
import { CHART_COLORS } from "@/lib/constants";

export async function getNetWorthSeries(userId: string, months = 12) {
  const [accounts, transactions] = await Promise.all([
    prisma.financialAccount.findMany({ where: { userId }, select: { id: true, initialBalance: true, type: true } }),
    prisma.transaction.findMany({
      where: { userId, status: "PAID" },
      select: { financialAccountId: true, transferToAccountId: true, kind: true, amount: true, date: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const range = lastNMonths(months);
  const initialTotal = accounts.reduce((s, a) => s + toNumber(a.initialBalance), 0);

  return range.map(({ end, label }) => {
    let total = initialTotal;
    for (const tx of transactions) {
      if (tx.date > end) continue;
      const amount = toNumber(tx.amount);
      switch (tx.kind) {
        case "INCOME":
        case "ADJUSTMENT":
          total += amount;
          break;
        case "EXPENSE":
        case "INVESTMENT":
          total -= amount;
          break;
        case "TRANSFER":
          break;
      }
    }
    return { month: label, value: Math.round(total * 100) / 100 };
  });
}

export async function getIncomeVsExpenseSeries(userId: string, months = 6) {
  const range = lastNMonths(months);
  const results = await Promise.all(
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
      return {
        month: label,
        receitas: toNumber(income._sum.amount),
        despesas: toNumber(expense._sum.amount),
      };
    })
  );
  return results;
}

export async function getCategoryBreakdown(userId: string, start: Date, end: Date) {
  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: start, lte: end }, categoryId: { not: null } },
    _sum: { amount: true },
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId!).filter(Boolean) } },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return grouped
    .map((g, i) => {
      const category = categoryMap.get(g.categoryId!);
      return {
        categoryId: g.categoryId,
        name: category?.name ?? "Outros",
        color: category?.color ?? CHART_COLORS[i % CHART_COLORS.length],
        value: toNumber(g._sum.amount),
      };
    })
    .sort((a, b) => b.value - a.value);
}

export async function getDashboardSummary(userId: string, period: PeriodKey) {
  const { start, end } = getPeriodRange(period);
  const prev = getPreviousPeriodRange(period);

  const [
    accountBalances,
    accounts,
    incomeSum,
    expenseSum,
    prevIncomeSum,
    prevExpenseSum,
    receivable,
    payable,
    cardDebts,
    portfolio,
    goals,
    netWorthSeries,
    incomeVsExpense,
    categoryBreakdown,
  ] = await Promise.all([
    getAccountBalances(userId),
    prisma.financialAccount.findMany({ where: { userId, archived: false } }),
    prisma.transaction.aggregate({
      where: { userId, kind: "INCOME", status: "PAID", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, kind: "INCOME", status: "PAID", date: { gte: prev.start, lte: prev.end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: prev.start, lte: prev.end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, kind: "INCOME", status: { in: ["PENDING", "OVERDUE"] } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, kind: "EXPENSE", status: { in: ["PENDING", "OVERDUE"] } },
      _sum: { amount: true },
    }),
    prisma.debt.aggregate({
      where: { userId, type: "CREDIT_CARD", isPaidOff: false },
      _sum: { remainingAmount: true },
    }),
    getPortfolioSummary(userId),
    prisma.goal.findMany({ where: { userId, isCompleted: false }, orderBy: { createdAt: "desc" }, take: 4 }),
    getNetWorthSeries(userId, 12),
    getIncomeVsExpenseSeries(userId, 6),
    getCategoryBreakdown(userId, start, end),
  ]);

  const liquidAccounts = accounts.filter((a) => a.type !== "INVESTMENT");
  const investmentAccounts = accounts.filter((a) => a.type === "INVESTMENT");

  const availableBalance = liquidAccounts.reduce((s, a) => s + (accountBalances.get(a.id) ?? 0), 0);
  const investedInAccounts = investmentAccounts.reduce((s, a) => s + (accountBalances.get(a.id) ?? 0), 0);
  const totalBalance = availableBalance + investedInAccounts + portfolio.totalValue;

  const income = toNumber(incomeSum._sum.amount);
  const expense = toNumber(expenseSum._sum.amount);
  const prevIncome = toNumber(prevIncomeSum._sum.amount);
  const prevExpense = toNumber(prevExpenseSum._sum.amount);

  return {
    period,
    totalBalance,
    availableBalance,
    investedInAccounts,
    portfolioValue: portfolio.totalValue,
    income,
    expense,
    result: income - expense,
    incomeChange: percentChange(income, prevIncome),
    expenseChange: percentChange(expense, prevExpense),
    receivable: toNumber(receivable._sum.amount),
    payable: toNumber(payable._sum.amount),
    cardBills: toNumber(cardDebts._sum.remainingAmount),
    goals,
    netWorthSeries,
    incomeVsExpense,
    categoryBreakdown,
    savingsRate: income > 0 ? (income - expense) / income : 0,
  };
}
