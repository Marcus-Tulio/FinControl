import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma, TransactionKind, TransactionStatus } from "@prisma/client";

export type TransactionFilters = {
  start?: Date;
  end?: Date;
  categoryId?: string;
  financialAccountId?: string;
  kind?: TransactionKind;
  kinds?: TransactionKind[];
  status?: TransactionStatus;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
};

function buildWhere(userId: string, filters: TransactionFilters): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filters.start || filters.end) {
    where.date = {};
    if (filters.start) where.date.gte = filters.start;
    if (filters.end) where.date.lte = filters.end;
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.financialAccountId) where.financialAccountId = filters.financialAccountId;
  if (filters.kind) where.kind = filters.kind;
  if (filters.kinds?.length) where.kind = { in: filters.kinds };
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    where.amount = {};
    if (filters.minAmount !== undefined) where.amount.gte = filters.minAmount;
    if (filters.maxAmount !== undefined) where.amount.lte = filters.maxAmount;
  }

  return where;
}

export async function listTransactions(userId: string, filters: TransactionFilters = {}, take = 200, skip = 0) {
  return prisma.transaction.findMany({
    where: buildWhere(userId, filters),
    include: { category: true, financialAccount: true, transferToAccount: true },
    orderBy: { date: "desc" },
    take,
    skip,
  });
}

export async function countTransactions(userId: string, filters: TransactionFilters = {}) {
  return prisma.transaction.count({ where: buildWhere(userId, filters) });
}

export async function getTransactionById(userId: string, id: string) {
  return prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true, financialAccount: true, transferToAccount: true },
  });
}

export async function sumByKind(userId: string, kind: TransactionKind, filters: TransactionFilters = {}) {
  const result = await prisma.transaction.aggregate({
    where: { ...buildWhere(userId, filters), kind, status: "PAID" },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

export async function getBillsSummary(userId: string) {
  const now = new Date();
  const [today, upcoming, overdue, paidRecent] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        status: "PENDING",
        kind: { in: ["EXPENSE", "INCOME"] },
        dueDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
      include: { category: true, financialAccount: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        status: "PENDING",
        kind: { in: ["EXPENSE", "INCOME"] },
        dueDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) },
      },
      include: { category: true, financialAccount: true },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        status: "PENDING",
        kind: { in: ["EXPENSE", "INCOME"] },
        dueDate: { lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
      include: { category: true, financialAccount: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        status: "PAID",
        kind: { in: ["EXPENSE", "INCOME"] },
        dueDate: { not: null },
      },
      include: { category: true, financialAccount: true },
      orderBy: { paidDate: "desc" },
      take: 20,
    }),
  ]);

  return { today, upcoming, overdue, paidRecent };
}

export async function markTransactionsOverdue(userId: string) {
  const now = new Date();
  await prisma.transaction.updateMany({
    where: { userId, status: "PENDING", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });
}

export async function getCalendarEvents(userId: string, start: Date, end: Date) {
  return prisma.transaction.findMany({
    where: {
      userId,
      OR: [
        { date: { gte: start, lte: end } },
        { dueDate: { gte: start, lte: end } },
      ],
    },
    include: { category: true, financialAccount: true, transferToAccount: true },
    orderBy: { date: "asc" },
  });
}
