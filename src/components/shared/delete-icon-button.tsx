"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteIconButton({
  onDelete,
  confirmMessage = "Tem certeza que deseja excluir?",
  successMessage = "Excluído com sucesso",
}: {
  onDelete: () => Promise<void>;
  confirmMessage?: string;
  successMessage?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      try {
        await onDelete();
        toast.success(successMessage);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não foi possível excluir");
      }
    });
  }

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleClick} disabled={isPending}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
