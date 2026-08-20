import "server-only";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export async function getAccountBalances(userId: string): Promise<Map<string, number>> {
  const accounts = await prisma.financialAccount.findMany({
    where: { userId },
    select: { id: true, initialBalance: true },
  });

  const transactions = await prisma.transaction.findMany({
    where: { userId, status: "PAID" },
    select: { financialAccountId: true, transferToAccountId: true, kind: true, amount: true },
  });

  const balances = new Map<string, number>();
  for (const acc of accounts) balances.set(acc.id, toNumber(acc.initialBalance));

  for (const tx of transactions) {
    const amount = toNumber(tx.amount);
    const current = balances.get(tx.financialAccountId) ?? 0;

    switch (tx.kind) {
      case "INCOME":
        balances.set(tx.financialAccountId, current + amount);
        break;
      case "EXPENSE":
      case "INVESTMENT":
        balances.set(tx.financialAccountId, current - amount);
        break;
      case "ADJUSTMENT":
        balances.set(tx.financialAccountId, current + amount);
        break;
      case "TRANSFER":
        balances.set(tx.financialAccountId, current - amount);
        if (tx.transferToAccountId) {
          const destCurrent = balances.get(tx.transferToAccountId) ?? 0;
          balances.set(tx.transferToAccountId, destCurrent + amount);
        }
        break;
    }
  }

  return balances;
}

export async function listAccountsWithBalances(userId: string) {
  const [accounts, balances] = await Promise.all([
    prisma.financialAccount.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: "asc" },
    }),
    getAccountBalances(userId),
  ]);

  return accounts.map((acc) => ({
    ...acc,
    balance: balances.get(acc.id) ?? toNumber(acc.initialBalance),
  }));
}

export async function getTotalBalance(userId: string): Promise<number> {
  const balances = await getAccountBalances(userId);
  return Array.from(balances.values()).reduce((sum, v) => sum + v, 0);
}

export async function getAccountById(userId: string, id: string) {
  return prisma.financialAccount.findFirst({ where: { id, userId } });
}

export async function getAccountWithHistory(userId: string, id: string) {
  const [account, balances, transactions] = await Promise.all([
    prisma.financialAccount.findFirst({ where: { id, userId } }),
    getAccountBalances(userId),
    prisma.transaction.findMany({
      where: {
        userId,
        OR: [{ financialAccountId: id }, { transferToAccountId: id }],
      },
      include: { category: true, financialAccount: true, transferToAccount: true },
      orderBy: { date: "desc" },
      take: 100,
    }),
  ]);

  if (!account) return null;

  return {
    account,
    balance: balances.get(id) ?? toNumber(account.initialBalance),
    transactions,
  };
}
