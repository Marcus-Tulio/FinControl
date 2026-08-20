"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCategory } from "@/server/actions/categories";

export function DeleteCategoryButton({ id }: { id: string }) {
  const [, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Excluir esta categoria?")) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
        toast.success("Categoria excluída");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não foi possível excluir");
      }
    });
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
