"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";
import { generateOccurrences } from "@/lib/recurrence";

export type TransactionFormState = { error?: string; success?: boolean };

/** Switches enviam "true"/"false" (ou nada, se ausentes) — z.coerce.boolean() trataria "false" como truthy. */
function booleanField(defaultValue: boolean) {
  return z.preprocess((v) => (v === undefined ? defaultValue : v === "true"), z.boolean());
}

const KIND_LABELS = { INCOME: "Receita", EXPENSE: "Despesa", INVESTMENT: "Investimento", ADJUSTMENT: "Ajuste" } as const;

const baseSchema = z.object({
  kind: z.enum(["INCOME", "EXPENSE", "INVESTMENT", "ADJUSTMENT"]),
  financialAccountId: z.string().min(1, "Escolha uma conta"),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional(),
  notes: z.string().optional(),
  amount: z.coerce.number().positive("Informe um valor válido"),
  date: z.string().min(1, "Informe a data"),
  isEssential: booleanField(true),
  isPaid: booleanField(true),
  isRecurring: booleanField(false),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  installments: z.coerce.number().int().min(1).max(360).default(1),
  expenseType: z.enum(["FIXED", "VARIABLE", "EXTRAORDINARY"]).optional(),
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
  const description = data.description?.trim() || KIND_LABELS[data.kind];

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
        description: `${description} (${i + 1}/${data.installments})`,
        notes: data.notes,
        amount: perInstallment,
        date: occDate,
        dueDate: isFirst && data.isPaid ? null : occDate,
        paidDate: isFirst && data.isPaid ? occDate : null,
        isEssential: data.isEssential,
        expenseType: data.expenseType ?? null,
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
        description,
        amount: data.amount,
        frequency: data.frequency,
        startDate: date,
        isEssential: data.isEssential,
        expenseType: data.expenseType ?? null,
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
      description,
      notes: data.notes,
      amount: data.amount,
      date: occDate,
      dueDate: i === 0 && data.isPaid ? null : occDate,
      paidDate: i === 0 && data.isPaid ? occDate : null,
      isEssential: data.isEssential,
      expenseType: data.expenseType ?? null,
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
        description,
        notes: data.notes,
        amount: data.amount,
        date,
        dueDate: status === "PENDING" ? date : null,
        paidDate: status === "PAID" ? date : null,
        isEssential: data.isEssential,
        expenseType: data.expenseType ?? null,
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
  const description = data.description?.trim() || KIND_LABELS[data.kind];

  await prisma.transaction.update({
    where: { id },
    data: {
      financialAccountId: data.financialAccountId,
      categoryId: data.categoryId,
      kind: data.kind,
      status,
      description,
      notes: data.notes,
      amount: data.amount,
      date,
      dueDate: status !== "PAID" ? date : null,
      paidDate: status === "PAID" ? date : null,
      isEssential: data.isEssential,
      expenseType: data.expenseType ?? null,
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
      expenseType: existing.expenseType,
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
