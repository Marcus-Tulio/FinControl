import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export async function listInvestments(userId: string) {
  const investments = await prisma.investment.findMany({
    where: { userId },
    include: { movements: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return investments.map((inv) => {
    const invested = inv.movements
      .filter((m) => m.type === "CONTRIBUTION")
      .reduce((s, m) => s + toNumber(m.amount), 0);
    const withdrawn = inv.movements
      .filter((m) => m.type === "WITHDRAWAL")
      .reduce((s, m) => s + toNumber(m.amount), 0);
    const dividends = inv.movements
      .filter((m) => m.type === "DIVIDEND")
      .reduce((s, m) => s + toNumber(m.amount), 0);

    const currentValue = toNumber(inv.quantity) * toNumber(inv.currentPrice);
    const netInvested = invested - withdrawn;
    const profit = currentValue - netInvested;
    const profitPercent = netInvested > 0 ? profit / netInvested : 0;

    return { ...inv, invested, withdrawn, dividends, currentValue, netInvested, profit, profitPercent };
  });
}

export async function getInvestmentById(userId: string, id: string) {
  const inv = await prisma.investment.findFirst({
    where: { id, userId },
    include: { movements: { orderBy: { date: "desc" } } },
  });
  if (!inv) return null;

  const invested = inv.movements
    .filter((m) => m.type === "CONTRIBUTION")
    .reduce((s, m) => s + toNumber(m.amount), 0);
  const withdrawn = inv.movements
    .filter((m) => m.type === "WITHDRAWAL")
    .reduce((s, m) => s + toNumber(m.amount), 0);
  const dividends = inv.movements
    .filter((m) => m.type === "DIVIDEND")
    .reduce((s, m) => s + toNumber(m.amount), 0);
  const currentValue = toNumber(inv.quantity) * toNumber(inv.currentPrice);
  const netInvested = invested - withdrawn;
  const profit = currentValue - netInvested;
  const profitPercent = netInvested > 0 ? profit / netInvested : 0;

  return { ...inv, invested, withdrawn, dividends, currentValue, netInvested, profit, profitPercent };
}

export async function getPortfolioSummary(userId: string) {
  const investments = await listInvestments(userId);
  const totalValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalInvested = investments.reduce((s, i) => s + i.netInvested, 0);
  const totalProfit = totalValue - totalInvested;
  const totalDividends = investments.reduce((s, i) => s + i.dividends, 0);

  const byType = new Map<string, number>();
  for (const inv of investments) {
    byType.set(inv.type, (byType.get(inv.type) ?? 0) + inv.currentValue);
  }

  return {
    investments,
    totalValue,
    totalInvested,
    totalProfit,
    totalProfitPercent: totalInvested > 0 ? totalProfit / totalInvested : 0,
    totalDividends,
    allocation: Array.from(byType.entries()).map(([type, value]) => ({ type, value })),
  };
}
