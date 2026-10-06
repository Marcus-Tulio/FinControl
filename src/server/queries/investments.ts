import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

const AVG_DAYS_PER_MONTH = 30.4368;

/** Com rendimento definido, o preço cresce por juros compostos desde a última atualização (yieldAnchorDate). */
function projectedPrice(basePrice: number, yieldRate: number | null, anchorDate: Date | null): number {
  if (!yieldRate || !anchorDate) return basePrice;
  const monthsElapsed = (Date.now() - anchorDate.getTime()) / (1000 * 60 * 60 * 24 * AVG_DAYS_PER_MONTH);
  if (monthsElapsed <= 0) return basePrice;
  return basePrice * Math.pow(1 + yieldRate / 100, monthsElapsed);
}

function withComputed<T extends {
  quantity: unknown; currentPrice: unknown; yieldRate: unknown; yieldAnchorDate: Date | null;
  movements: { type: string; amount: unknown }[];
}>(inv: T) {
  const invested = inv.movements
    .filter((m) => m.type === "CONTRIBUTION")
    .reduce((s, m) => s + toNumber(m.amount as never), 0);
  const withdrawn = inv.movements
    .filter((m) => m.type === "WITHDRAWAL")
    .reduce((s, m) => s + toNumber(m.amount as never), 0);
  const dividends = inv.movements
    .filter((m) => m.type === "DIVIDEND")
    .reduce((s, m) => s + toNumber(m.amount as never), 0);

  const yieldRateNum = inv.yieldRate !== null ? toNumber(inv.yieldRate as never) : null;
  const displayPrice = projectedPrice(toNumber(inv.currentPrice as never), yieldRateNum, inv.yieldAnchorDate);
  const currentValue = toNumber(inv.quantity as never) * displayPrice;
  const netInvested = invested - withdrawn;
  const profit = currentValue - netInvested;
  const profitPercent = netInvested > 0 ? profit / netInvested : 0;

  return { ...inv, invested, withdrawn, dividends, displayPrice, yieldRateNum, currentValue, netInvested, profit, profitPercent };
}

export async function listInvestments(userId: string) {
  const investments = await prisma.investment.findMany({
    where: { userId },
    include: { movements: { orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return investments.map(withComputed);
}

export async function getInvestmentById(userId: string, id: string) {
  const inv = await prisma.investment.findFirst({
    where: { id, userId },
    include: { movements: { orderBy: { date: "desc" } } },
  });
  if (!inv) return null;

  return withComputed(inv);
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
