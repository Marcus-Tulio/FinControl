"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";

const categorySchema = z.object({
  name: z.string().min(1, "Informe um nome"),
  kind: z.enum(["INCOME", "EXPENSE", "INVESTMENT"]),
  icon: z.string().default("shapes"),
  color: z.string().default("#6366f1"),
  parentId: z.string().optional().nullable(),
});

export type CategoryFormState = { error?: string; success?: boolean };

export async function createCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const userId = await requireUserId();
  const raw = Object.fromEntries(formData);
  const parsed = categorySchema.safeParse({ ...raw, parentId: raw.parentId && raw.parentId !== "none" ? raw.parentId : null });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await prisma.category.create({ data: { ...parsed.data, userId } });

  revalidatePath("/categorias");
  return { success: true };
}

export async function updateCategory(id: string, _prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const userId = await requireUserId();
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) return { error: "Categoria não encontrada" };

  const raw = Object.fromEntries(formData);
  const parsed = categorySchema.safeParse({ ...raw, parentId: raw.parentId && raw.parentId !== "none" ? raw.parentId : null });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  await prisma.category.update({ where: { id }, data: parsed.data });

  revalidatePath("/categorias");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const userId = await requireUserId();
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw new Error("Categoria não encontrada");
  if (category.isDefault) throw new Error("Categorias padrão não podem ser excluídas");

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categorias");
}
