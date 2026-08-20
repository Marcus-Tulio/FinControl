import { requireUserId, getCurrentUser } from "@/server/session";
import { listAccountsWithBalances } from "@/server/queries/accounts";
import { listTopLevelCategories } from "@/server/queries/categories";
import { listNotifications } from "@/server/queries/notifications";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId();
  const user = await getCurrentUser();

  const [accounts, incomeCategories, expenseCategories, investmentCategories, notifications] = await Promise.all([
    listAccountsWithBalances(userId),
    listTopLevelCategories(userId, "INCOME"),
    listTopLevelCategories(userId, "EXPENSE"),
    listTopLevelCategories(userId, "INVESTMENT"),
    listNotifications(userId),
  ]);

  const flatten = (cats: { id: string; name: string; subcategories: { id: string; name: string }[] }[]) =>
    cats.flatMap((c) => [{ id: c.id, name: c.name }, ...c.subcategories.map((s) => ({ id: s.id, name: `${c.name} · ${s.name}` }))]);

  return (
    <AppShell
      user={{ name: user?.name, email: user?.email, image: user?.image }}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      incomeCategories={flatten(incomeCategories)}
      expenseCategories={flatten(expenseCategories)}
      investmentCategories={flatten(investmentCategories)}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
