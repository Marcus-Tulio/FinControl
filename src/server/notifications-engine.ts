import "server-only";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toNumber, formatDate } from "@/lib/format";
import { budgetStatus, percentChange } from "@/lib/finance";

async function notificationExists(userId: string, title: string, sinceDate: Date) {
  const existing = await prisma.notification.findFirst({
    where: { userId, title, createdAt: { gte: sinceDate } },
  });
  return !!existing;
}

export async function syncNotifications(userId: string): Promise<void> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  const toCreate: { type: "BILL_DUE" | "BUDGET_ALERT" | "SPENDING_TREND" | "GOAL_PROGRESS" | "DEBT_DUE"; title: string; message: string }[] = [];

  const dueSoon = await prisma.transaction.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "OVERDUE"] },
      kind: { in: ["EXPENSE", "INCOME"] },
      dueDate: { gte: todayStart, lte: endOfDay(addDays(now, 3)) },
    },
  });

  for (const tx of dueSoon) {
    const title = `Vencimento: ${tx.description}`;
    if (await notificationExists(userId, title, todayStart)) continue;
    const verb = tx.kind === "EXPENSE" ? "vencendo" : "a receber";
    toCreate.push({
      type: "BILL_DUE",
      title,
      message: `${tx.description} de R$ ${toNumber(tx.amount).toFixed(2)} ${verb} em ${formatDate(tx.dueDate!)}.`,
    });
  }

  const debtsDueSoon = await prisma.debt.findMany({
    where: { userId, isPaidOff: false, nextDueDate: { gte: todayStart, lte: endOfDay(addDays(now, 3)) } },
  });
  for (const debt of debtsDueSoon) {
    const title = `Fatura/parcela: ${debt.name}`;
    if (await notificationExists(userId, title, todayStart)) continue;
    toCreate.push({
      type: "DEBT_DUE",
      title,
      message: `Sua parcela de ${debt.name} vence em ${formatDate(debt.nextDueDate!)}.`,
    });
  }

  const budgets = await prisma.budget.findMany({
    where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
    include: { category: true },
  });
  const spentByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: monthStart } },
    _sum: { amount: true },
  });
  const spentMap = new Map(spentByCategory.map((s) => [s.categoryId, toNumber(s._sum.amount)]));

  for (const budget of budgets) {
    const spent = spentMap.get(budget.categoryId) ?? 0;
    const status = budgetStatus(budget.limitAmount, spent);
    if (status.percentUsed >= 0.8) {
      const title = `Orçamento de ${budget.category.name} em alerta`;
      if (await notificationExists(userId, title, monthStart)) continue;
      toCreate.push({
        type: "BUDGET_ALERT",
        title,
        message: `Você já utilizou ${Math.round(status.percentUsed * 100)}% do orçamento de ${budget.category.name} este mês.`,
      });
    }
  }

  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));
  const [thisMonthExpense, prevMonthExpense] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, kind: "EXPENSE", status: "PAID", date: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { amount: true },
    }),
  ]);
  const change = percentChange(toNumber(thisMonthExpense._sum.amount), toNumber(prevMonthExpense._sum.amount));
  if (change !== null && change > 0.15) {
    const title = `Gastos em alta - ${monthStart.getMonth() + 1}/${monthStart.getFullYear()}`;
    if (!(await notificationExists(userId, title, monthStart))) {
      toCreate.push({
        type: "SPENDING_TREND",
        title,
        message: `Seus gastos aumentaram ${Math.round(change * 100)}% em relação ao mês passado.`,
      });
    }
  }

  const goals = await prisma.goal.findMany({ where: { userId, isCompleted: false } });
  for (const goal of goals) {
    const percent = toNumber(goal.targetAmount) > 0 ? toNumber(goal.currentAmount) / toNumber(goal.targetAmount) : 0;
    if (percent >= 0.9) {
      const title = `Meta quase lá: ${goal.name}`;
      if (await notificationExists(userId, title, subMonths(now, 1))) continue;
      toCreate.push({
        type: "GOAL_PROGRESS",
        title,
        message: `Você já atingiu ${Math.round(percent * 100)}% da meta "${goal.name}".`,
      });
    }
  }

  if (toCreate.length > 0) {
    await prisma.notification.createMany({
      data: toCreate.map((n) => ({ userId, ...n })),
    });
  }
}
