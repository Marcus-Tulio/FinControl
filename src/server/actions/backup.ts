"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";
import { serializeDecimals } from "@/lib/serialize";

export type BackupResult = { error?: string; data?: unknown; generatedAt?: string };

/** Exporta todos os dados financeiros do usuário (contas, categorias, transações, orçamentos, metas, dívidas, investimentos) em um único JSON para backup manual. */
export async function exportBackup(): Promise<BackupResult> {
  const userId = await requireUserId();

  const [
    user,
    financialAccounts,
    categories,
    recurringRules,
    transactions,
    budgets,
    goals,
    debts,
    investments,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, currency: true, createdAt: true },
    }),
    prisma.financialAccount.findMany({ where: { userId } }),
    prisma.category.findMany({ where: { userId } }),
    prisma.recurringRule.findMany({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId } }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId }, include: { contributions: true } }),
    prisma.debt.findMany({ where: { userId }, include: { payments: true } }),
    prisma.investment.findMany({ where: { userId }, include: { movements: true } }),
  ]);

  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    data: serializeDecimals({
      exportedAt: generatedAt,
      app: "FinControl",
      version: 1,
      user,
      financialAccounts,
      categories,
      recurringRules,
      transactions,
      budgets,
      goals,
      debts,
      investments,
    }),
  };
}
