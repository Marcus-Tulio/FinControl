"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportBackup } from "@/server/actions/backup";

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function BackupSection() {
  const [isPending, setIsPending] = useState(false);

  async function handleBackup() {
    setIsPending(true);
    try {
      const result = await exportBackup();
      if (result.error || !result.data) {
        toast.error(result.error ?? "Não foi possível gerar o backup");
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(result.data, `fincontrol-backup-${date}.json`);
      toast.success("Backup gerado com sucesso");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Baixe um arquivo JSON com todos os seus dados (contas, categorias, transações, orçamentos, metas, dívidas e investimentos)
        para guardar como cópia de segurança.
      </p>
      <Button variant="outline" onClick={handleBackup} disabled={isPending}>
        <DownloadCloud className="h-4 w-4" /> {isPending ? "Gerando backup..." : "Baixar backup completo (JSON)"}
      </Button>
    </div>
  );
}
