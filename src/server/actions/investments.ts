"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";

export type InvestmentFormState = { error?: string; success?: boolean };

const investmentSchema = z.object({
  name: z.string().min(1, "Informe um nome"),
  type: z.enum(["FIXED_INCOME", "STOCK", "ETF", "FUND", "CRYPTO", "PENSION", "OTHER"]),
  broker: z.string().optional(),
  ticker: z.string().optional(),
  quantity: z.coerce.number().min(0).default(0),
  avgPrice: z.coerce.number().min(0).default(0),
  currentPrice: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function createInvestment(_prev: InvestmentFormState, formData: FormData): Promise<InvestmentFormState> {
  const userId = await requireUserId();
  const parsed = investmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const investment = await prisma.investment.create({ data: { ...parsed.data, userId } });

  const initialAmount = parsed.data.quantity * parsed.data.avgPrice;
  if (initialAmount > 0) {
    await prisma.investmentMovement.create({
      data: {
        investmentId: investment.id,
        type: "CONTRIBUTION",
        amount: initialAmount,
        quantity: parsed.data.quantity,
        price: parsed.data.avgPrice,
        date: new Date(),
      },
    });
  }

  revalidatePath("/investimentos");
  revalidatePath("/");
  return { success: true };
}

export async function updateInvestment(id: string, _prev: InvestmentFormState, formData: FormData): Promise<InvestmentFormState> {
  const userId = await requireUserId();
  const investment = await prisma.investment.findFirst({ where: { id, userId } });
  if (!investment) return { error: "Investimento não encontrado" };

  const parsed = investmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await prisma.investment.update({ where: { id }, data: parsed.data });

  revalidatePath("/investimentos");
  revalidatePath("/");
  return { success: true };
}

export async function deleteInvestment(id: string) {
  const userId = await requireUserId();
  const investment = await prisma.investment.findFirst({ where: { id, userId } });
  if (!investment) throw new Error("Investimento não encontrado");

  await prisma.investment.delete({ where: { id } });
  revalidatePath("/investimentos");
  revalidatePath("/");
}

const movementSchema = z.object({
  type: z.enum(["CONTRIBUTION", "WITHDRAWAL", "DIVIDEND", "PRICE_UPDATE"]),
  amount: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0).optional(),
  date: z.string().min(1),
});

export async function addInvestmentMovement(investmentId: string, _prev: InvestmentFormState, formData: FormData): Promise<InvestmentFormState> {
  const userId = await requireUserId();
  const investment = await prisma.investment.findFirst({ where: { id: investmentId, userId } });
  if (!investment) return { error: "Investimento não encontrado" };

  const parsed = movementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { type, amount, quantity, price, date } = parsed.data;

  await prisma.investmentMovement.create({
    data: { investmentId, type, amount, quantity, price, date: new Date(date) },
  });

  if (type === "PRICE_UPDATE" && price) {
    await prisma.investment.update({ where: { id: investmentId }, data: { currentPrice: price } });
  } else if (type === "CONTRIBUTION" && quantity) {
    const currentQty = Number(investment.quantity);
    const currentAvg = Number(investment.avgPrice);
    const newQty = currentQty + quantity;
    const newAvg = newQty > 0 ? (currentQty * currentAvg + amount) / newQty : currentAvg;
    await prisma.investment.update({
      where: { id: investmentId },
      data: { quantity: newQty, avgPrice: newAvg, ...(price ? { currentPrice: price } : {}) },
    });
  } else if (type === "WITHDRAWAL" && quantity) {
    await prisma.investment.update({
      where: { id: investmentId },
      data: { quantity: Math.max(Number(investment.quantity) - quantity, 0) },
    });
  }

  revalidatePath("/investimentos");
  revalidatePath("/");
  return { success: true };
}
