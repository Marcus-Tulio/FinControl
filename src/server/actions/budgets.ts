"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";

export type BudgetFormState = { error?: string; success?: boolean };

const budgetSchema = z.object({
  categoryId: z.string().min(1, "Escolha uma categoria"),
  limitAmount: z.coerce.number().positive("Informe um valor válido"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export async function upsertBudget(_prev: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
  const userId = await requireUserId();
  const parsed = budgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { categoryId, limitAmount, month, year } = parsed.data;

  await prisma.budget.upsert({
    where: { userId_categoryId_month_year: { userId, categoryId, month, year } },
    update: { limitAmount },
    create: { userId, categoryId, limitAmount, month, year },
  });

  revalidatePath("/orcamento");
  revalidatePath("/");
  return { success: true };
}

export async function deleteBudget(id: string) {
  const userId = await requireUserId();
  const budget = await prisma.budget.findFirst({ where: { id, userId } });
  if (!budget) throw new Error("Orçamento não encontrado");

  await prisma.budget.delete({ where: { id } });
  revalidatePath("/orcamento");
  revalidatePath("/");
}
