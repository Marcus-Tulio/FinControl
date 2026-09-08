"use server";

import Papa from "papaparse";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";

export type ImportResult = {
  error?: string;
  imported?: number;
  duplicates?: number;
  total?: number;
};

type ParsedRow = {
  date: Date;
  description: string;
  amount: number;
  kind: "INCOME" | "EXPENSE";
  categoryName?: string;
};

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3},)/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function parseDate(raw: string): Date | null {
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);

  const brMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (brMatch) {
    let year = +brMatch[3];
    if (year < 100) year += 2000;
    return new Date(year, +brMatch[2] - 1, +brMatch[1]);
  }
  return null;
}

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map((h) => ({ raw: h, norm: h.trim().toLowerCase() }));
  for (const candidate of candidates) {
    const found = normalized.find((h) => h.norm.includes(candidate));
    if (found) return found.raw;
  }
  return undefined;
}

function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xls") || file.type.includes("spreadsheet");
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  if (typeof value === "object") {
    if ("result" in value) return String(value.result ?? ""); // célula de fórmula
    if ("text" in value) return String(value.text ?? ""); // rich text
    if ("richText" in value) return value.richText.map((r) => r.text).join("");
  }
  return String(value);
}

async function parseExcelRows(file: File): Promise<{ headers: string[]; data: Record<string, string>[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { headers: [], data: [] };

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = cellToString(cell.value).trim();
  });

  const data: Record<string, string>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      record[header] = cellToString(row.getCell(idx + 1).value);
    });
    data.push(record);
  });

  return { headers, data };
}

async function parseFileRows(file: File): Promise<{ headers: string[]; data: Record<string, string>[] }> {
  if (isExcelFile(file)) return parseExcelRows(file);

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return { headers: parsed.meta.fields ?? [], data: parsed.data };
}

export async function importTransactionsCsv(
  financialAccountId: string,
  _prev: ImportResult,
  formData: FormData
): Promise<ImportResult> {
  const userId = await requireUserId();

  const account = await prisma.financialAccount.findFirst({ where: { id: financialAccountId, userId } });
  if (!account) return { error: "Conta não encontrada" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Selecione um arquivo" };

  let headers: string[];
  let rowsData: Record<string, string>[];
  try {
    const parsed = await parseFileRows(file);
    headers = parsed.headers;
    rowsData = parsed.data;
  } catch {
    return { error: "Não foi possível ler o arquivo. Verifique o formato (CSV ou Excel)." };
  }
  if (rowsData.length === 0) {
    return { error: "Não foi possível ler o arquivo. Verifique o formato (CSV ou Excel)." };
  }
  const dateCol = findColumn(headers, ["data", "date"]);
  const descCol = findColumn(headers, ["descri", "histor", "description", "memo"]);
  const amountCol = findColumn(headers, ["valor", "amount", "value"]);
  const categoryCol = findColumn(headers, ["categoria", "category"]);

  if (!dateCol || !descCol || !amountCol) {
    return { error: "O arquivo precisa ter colunas de data, descrição e valor" };
  }

  const rows: ParsedRow[] = [];
  for (const row of rowsData) {
    const date = parseDate(row[dateCol] ?? "");
    const amountRaw = row[amountCol] ?? "";
    const amount = parseAmount(amountRaw);
    const description = (row[descCol] ?? "").trim();
    if (!date || !description || amount === 0) continue;

    rows.push({
      date,
      description,
      amount: Math.abs(amount),
      kind: amount >= 0 ? "INCOME" : "EXPENSE",
      categoryName: categoryCol ? row[categoryCol]?.trim() : undefined,
    });
  }

  if (rows.length === 0) return { error: "Nenhuma transação válida encontrada no arquivo" };

  const categories = await prisma.category.findMany({ where: { userId } });
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

  const windowStart = new Date(Math.min(...rows.map((r) => r.date.getTime())));
  windowStart.setDate(windowStart.getDate() - 3);
  const windowEnd = new Date(Math.max(...rows.map((r) => r.date.getTime())));
  windowEnd.setDate(windowEnd.getDate() + 3);

  const existing = await prisma.transaction.findMany({
    where: { userId, date: { gte: windowStart, lte: windowEnd } },
    select: { date: true, amount: true, description: true },
  });

  const existingKeys = new Set(
    existing.map((e) => `${e.date.toDateString()}|${Number(e.amount).toFixed(2)}|${e.description.toLowerCase()}`)
  );

  let imported = 0;
  let duplicates = 0;
  const toCreate = [];

  for (const row of rows) {
    const key = `${row.date.toDateString()}|${row.amount.toFixed(2)}|${row.description.toLowerCase()}`;
    if (existingKeys.has(key)) {
      duplicates++;
      continue;
    }
    existingKeys.add(key);

    const matchedCategory = row.categoryName ? categoryByName.get(row.categoryName.toLowerCase()) : undefined;

    toCreate.push({
      userId,
      financialAccountId,
      categoryId: matchedCategory?.id,
      kind: row.kind,
      status: "PAID" as const,
      description: row.description,
      amount: row.amount,
      date: row.date,
      paidDate: row.date,
      isEssential: true,
    });
    imported++;
  }

  if (toCreate.length > 0) {
    await prisma.transaction.createMany({ data: toCreate });
  }

  revalidatePath("/transacoes");
  revalidatePath("/");
  revalidatePath("/contas");

  return { imported, duplicates, total: rows.length };
}
