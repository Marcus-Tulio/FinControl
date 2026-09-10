import "server-only";
import { prisma } from "@/lib/prisma";
import { getDefaultCategories } from "@/lib/constants";
import type { ProfileType } from "@prisma/client";

/** Cria as categorias/subcategorias e contas padrão para um usuário — usado no cadastro e ao reiniciar dados. */
export async function seedDefaultData(userId: string, profileType: ProfileType) {
  const categories = getDefaultCategories(profileType);

  await prisma.category.createMany({
    data: categories.map((c) => ({ userId, name: c.name, kind: c.kind, icon: c.icon, color: c.color, isDefault: true })),
  });

  const parents = await prisma.category.findMany({ where: { userId, isDefault: true } });
  for (const c of categories) {
    if (!c.subcategories?.length) continue;
    const parent = parents.find((p) => p.name === c.name);
    if (!parent) continue;
    await prisma.category.createMany({
      data: c.subcategories.map((sub) => ({
        userId,
        name: sub.name,
        kind: c.kind,
        icon: sub.icon,
        color: sub.color,
        parentId: parent.id,
        isDefault: true,
      })),
    });
  }

  await prisma.financialAccount.createMany({
    data: [
      { userId, name: "Carteira", type: "CASH", color: "#6366f1", icon: "wallet", initialBalance: 0 },
      { userId, name: "Conta bancária", type: "CHECKING", color: "#2a78d6", icon: "landmark", initialBalance: 0 },
    ],
  });
}
