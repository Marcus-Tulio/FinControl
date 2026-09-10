import "server-only";
import { revalidatePath } from "next/cache";

/** Revalida todas as rotas que exibem dados dependentes de categorias/contas/transações. */
export function revalidateEverything() {
  revalidatePath("/");
  revalidatePath("/transacoes");
  revalidatePath("/receitas");
  revalidatePath("/despesas");
  revalidatePath("/contas");
  revalidatePath("/contas-a-pagar");
  revalidatePath("/orcamento");
  revalidatePath("/calendario");
  revalidatePath("/categorias");
  revalidatePath("/metas");
  revalidatePath("/dividas");
  revalidatePath("/investimentos");
  revalidatePath("/relatorios");
  revalidatePath("/configuracoes");
}
