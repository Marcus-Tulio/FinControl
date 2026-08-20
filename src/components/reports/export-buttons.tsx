"use client";

import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

type ExportRow = {
  date: Date;
  description: string;
  category: string;
  account: string;
  kind: string;
  amount: number;
};

const KIND_LABELS: Record<string, string> = {
  INCOME: "Receita", EXPENSE: "Despesa", INVESTMENT: "Investimento", TRANSFER: "Transferência", ADJUSTMENT: "Ajuste",
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ rows, title }: { rows: ExportRow[]; title: string }) {
  function exportCsv() {
    const csv = Papa.unparse(
      rows.map((r) => ({
        Data: formatDate(r.date),
        Descrição: r.description,
        Categoria: r.category,
        Conta: r.account,
        Tipo: KIND_LABELS[r.kind] ?? r.kind,
        Valor: r.amount.toFixed(2),
      }))
    );
    downloadBlob(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }), `${title}.csv`);
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [["Data", "Descrição", "Categoria", "Conta", "Tipo", "Valor"]],
      body: rows.map((r) => [
        formatDate(r.date),
        r.description,
        r.category,
        r.account,
        KIND_LABELS[r.kind] ?? r.kind,
        formatCurrency(r.amount),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 148, 132] },
    });
    doc.save(`${title}.pdf`);
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
        <FileSpreadsheet className="h-4 w-4" /> Exportar Excel/CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportPdf} disabled={rows.length === 0}>
        <FileDown className="h-4 w-4" /> Exportar PDF
      </Button>
    </div>
  );
}
