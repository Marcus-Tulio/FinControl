import "server-only";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, differenceInCalendarMonths } from "date-fns";
import { toNumber, formatCurrency } from "@/lib/format";
import { percentChange, goalMonthlyRequired } from "@/lib/finance";

export type Insight = { icon: string; text: string; tone: "positive" | "negative" | "neutral" };

export async function getInsights(userId: string): Promise<Insight[]> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const insights: Insight[] = [];

  const [thisMonthByCategory, prevMonthByCategory, categories] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: monthStart, lte: monthEnd }, categoryId: { not: null } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: prevMonthStart, lte: prevMonthEnd }, categoryId: { not: null } },
      _sum: { amount: true },
    }),
    prisma.category.findMany({ where: { userId } }),
  ]);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const prevMap = new Map(prevMonthByCategory.map((c) => [c.categoryId, toNumber(c._sum.amount)]));

  let biggestDrop: { name: string; change: number } | null = null;
  let biggestRise: { name: string; change: number } | null = null;

  for (const c of thisMonthByCategory) {
    const current = toNumber(c._sum.amount);
    const previous = prevMap.get(c.categoryId) ?? 0;
    const change = percentChange(current, previous);
    if (change === null || previous < 20) continue;
    const name = categoryMap.get(c.categoryId!) ?? "categoria";
    if (change < 0 && (!biggestDrop || change < biggestDrop.change)) biggestDrop = { name, change };
    if (change > 0 && (!biggestRise || change > biggestRise.change)) biggestRise = { name, change };
  }

  if (biggestDrop) {
    insights.push({
      icon: "trending-down",
      text: `Você gastou ${Math.abs(Math.round(biggestDrop.change * 100))}% menos com ${biggestDrop.name.toLowerCase()} este mês.`,
      tone: "positive",
    });
  }
  if (biggestRise) {
    insights.push({
      icon: "trending-up",
      text: `Seus gastos com ${biggestRise.name.toLowerCase()} subiram ${Math.round(biggestRise.change * 100)}% em relação ao mês passado.`,
      tone: "negative",
    });
  }

  const subscriptions = await prisma.recurringRule.findMany({
    where: { userId, isActive: true, isSubscription: true, kind: "EXPENSE" },
  });
  if (subscriptions.length > 0) {
    const monthlyTotal = subscriptions.reduce((s, r) => {
      const factor = r.frequency === "YEARLY" ? 1 / 12 : r.frequency === "WEEKLY" ? 4.33 : r.frequency === "DAILY" ? 30 : 1;
      return s + toNumber(r.amount) * factor;
    }, 0);
    insights.push({
      icon: "repeat",
      text: `Seus gastos com assinaturas representam ${formatCurrency(monthlyTotal)}/mês.`,
      tone: "neutral",
    });
  }

  const nearestGoal = await prisma.goal.findFirst({
    where: { userId, isCompleted: false },
    orderBy: { currentAmount: "desc" },
  });
  if (nearestGoal) {
    const remaining = toNumber(nearestGoal.targetAmount) - toNumber(nearestGoal.currentAmount);
    if (remaining > 0) {
      insights.push({
        icon: "target",
        text: `Você está a ${formatCurrency(remaining)} de atingir sua meta "${nearestGoal.name}".`,
        tone: "neutral",
      });

      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, kind: "INCOME", status: "PAID", date: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
        }),
      ]);
      const savingsRate = toNumber(income._sum.amount) - toNumber(expense._sum.amount);
      if (savingsRate > 0 && nearestGoal.targetDate) {
        const requiredMonthly = goalMonthlyRequired(nearestGoal.targetAmount, nearestGoal.currentAmount, nearestGoal.targetDate);
        if (savingsRate > requiredMonthly && requiredMonthly > 0) {
          const monthsPlanned = Math.max(differenceInCalendarMonths(nearestGoal.targetDate, now), 1);
          const monthsWithCurrentSavings = Math.ceil(remaining / savingsRate);
          const monthsEarlier = monthsPlanned - monthsWithCurrentSavings;
          if (monthsEarlier > 0) {
            insights.push({
              icon: "rocket",
              text: `Se mantiver sua taxa atual de economia, poderá atingir "${nearestGoal.name}" ${monthsEarlier} ${monthsEarlier === 1 ? "mês" : "meses"} antes do previsto.`,
              tone: "positive",
            });
          }
        }
      }
    }
  }

  return insights;
}
