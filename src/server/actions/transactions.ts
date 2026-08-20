"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";
import { generateOccurrences } from "@/lib/recurrence";

export type TransactionFormState = { error?: string; success?: boolean };

const baseSchema = z.object({
  kind: z.enum(["INCOME", "EXPENSE", "INVESTMENT", "ADJUSTMENT"]),
  financialAccountId: z.string().min(1, "Escolha uma conta"),
  categoryId: z.string().optional().nullable(),
  description: z.string().min(1, "Informe uma descrição"),
  notes: z.string().optional(),
  amount: z.coerce.number().positive("Informe um valor válido"),
  date: z.string().min(1, "Informe a data"),
  isEssential: z.coerce.boolean().default(true),
  isPaid: z.coerce.boolean().default(true),
  isRecurring: z.coerce.boolean().default(false),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  installments: z.coerce.number().int().min(1).max(360).default(1),
});

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/transacoes");
  revalidatePath("/receitas");
  revalidatePath("/despesas");
  revalidatePath("/contas-a-pagar");
  revalidatePath("/orcamento");
  revalidatePath("/calendario");
  revalidatePath("/contas");
}

export async function createTransaction(_prev: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  const userId = await requireUserId();
  const raw = Object.fromEntries(formData);
  const parsed = baseSchema.safeParse({ ...raw, categoryId: raw.categoryId || null });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const data = parsed.data;
  const date = new Date(data.date);
  const status: "PAID" | "PENDING" = data.isPaid ? "PAID" : "PENDING";

  if (data.installments > 1 && data.kind === "EXPENSE") {
    const groupId = randomUUID();
    const perInstallment = Math.round((data.amount / data.installments) * 100) / 100;
    const rows = Array.from({ length: data.installments }, (_, i) => {
      const occDate = new Date(date);
      occDate.setMonth(occDate.getMonth() + i);
      const isFirst = i === 0;
      return {
        userId,
        financialAccountId: data.financialAccountId,
        categoryId: data.categoryId,
        kind: data.kind,
        status: isFirst ? status : ("PENDING" as const),
        description: `${data.description} (${i + 1}/${data.installments})`,
        notes: data.notes,
        amount: perInstallment,
        date: occDate,
        dueDate: isFirst && data.isPaid ? null : occDate,
        paidDate: isFirst && data.isPaid ? occDate : null,
        isEssential: data.isEssential,
        installmentGroupId: groupId,
        installmentNumber: i + 1,
        installmentTotal: data.installments,
      };
    });
    await prisma.transaction.createMany({ data: rows });
  } else if (data.isRecurring && data.frequency) {
    const rule = await prisma.recurringRule.create({
      data: {
        userId,
        financialAccountId: data.financialAccountId,
        categoryId: data.categoryId,
        kind: data.kind,
        description: data.description,
        amount: data.amount,
        frequency: data.frequency,
        startDate: date,
        isEssential: data.isEssential,
      },
    });

    const occurrences = generateOccurrences(date, data.frequency, 1, 12);
    const rows = occurrences.map((occDate, i) => ({
      userId,
      financialAccountId: data.financialAccountId,
      categoryId: data.categoryId,
      recurringRuleId: rule.id,
      kind: data.kind,
      status: i === 0 && data.isPaid ? ("PAID" as const) : ("PENDING" as const),
      description: data.description,
      notes: data.notes,
      amount: data.amount,
      date: occDate,
      dueDate: i === 0 && data.isPaid ? null : occDate,
      paidDate: i === 0 && data.isPaid ? occDate : null,
      isEssential: data.isEssential,
    }));
    await prisma.transaction.createMany({ data: rows });
  } else {
    await prisma.transaction.create({
      data: {
        userId,
        financialAccountId: data.financialAccountId,
        categoryId: data.categoryId,
        kind: data.kind,
        status,
        description: data.description,
        notes: data.notes,
        amount: data.amount,
        date,
        dueDate: status === "PENDING" ? date : null,
        paidDate: status === "PAID" ? date : null,
        isEssential: data.isEssential,
      },
    });
  }

  revalidateAll();
  return { success: true };
}

export async function updateTransaction(id: string, _prev: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  const userId = await requireUserId();
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return { error: "Transação não encontrada" };

  const raw = Object.fromEntries(formData);
  const parsed = baseSchema.omit({ isRecurring: true, frequency: true, installments: true }).safeParse({
    ...raw,
    categoryId: raw.categoryId || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const data = parsed.data;
  const date = new Date(data.date);
  const status = data.isPaid ? "PAID" : existing.status === "OVERDUE" ? "OVERDUE" : "PENDING";

  await prisma.transaction.update({
    where: { id },
    data: {
      financialAccountId: data.financialAccountId,
      categoryId: data.categoryId,
      kind: data.kind,
      status,
      description: data.description,
      notes: data.notes,
      amount: data.amount,
      date,
      dueDate: status !== "PAID" ? date : null,
      paidDate: status === "PAID" ? date : null,
      isEssential: data.isEssential,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Transação não encontrada");

  await prisma.transaction.delete({ where: { id } });
  revalidateAll();
}

export async function duplicateTransaction(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Transação não encontrada");

  await prisma.transaction.create({
    data: {
      userId,
      financialAccountId: existing.financialAccountId,
      categoryId: existing.categoryId,
      kind: existing.kind,
      status: existing.status === "OVERDUE" ? "PENDING" : existing.status,
      description: `${existing.description} (cópia)`,
      notes: existing.notes,
      amount: existing.amount,
      date: new Date(),
      isEssential: existing.isEssential,
      tags: existing.tags,
    },
  });

  revalidateAll();
}

export async function markTransactionPaid(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Transação não encontrada");

  await prisma.transaction.update({
    where: { id },
    data: { status: "PAID", paidDate: new Date() },
  });

  revalidateAll();
}
