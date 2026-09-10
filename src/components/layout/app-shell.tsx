"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { QuickAdd, QuickAddProvider } from "./quick-add";
import type { CategoryTree } from "@/components/shared/category-picker";
import { BUSINESS_THEME_CLASS } from "@/lib/business-theme";

type Account = { id: string; name: string };
type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

export function AppShell({
  children,
  user,
  accounts,
  incomeCategories,
  expenseCategories,
  investmentCategories,
  notifications,
  isBusiness,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; image?: string | null; avatarIcon?: string | null };
  accounts: Account[];
  incomeCategories: CategoryTree[];
  expenseCategories: CategoryTree[];
  investmentCategories: CategoryTree[];
  notifications: NotificationItem[];
  isBusiness: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/transacoes?search=${encodeURIComponent(q)}` : "/transacoes");
  }

  // Classe em document.documentElement (não num wrapper local) para alcançar também conteúdo
  // portalizado para o body, como o Popover de notificações, o Dialog de transação e o Sheet mobile,
  // e para que a variação clara/escura funcione pela cascata normal do CSS (ver .theme-business).
  useLayoutEffect(() => {
    if (!isBusiness) return;
    document.documentElement.classList.add(BUSINESS_THEME_CLASS);
    return () => document.documentElement.classList.remove(BUSINESS_THEME_CLASS);
  }, [isBusiness]);

  return (
    <QuickAddProvider>
      <div className="flex min-h-screen w-full bg-background">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="fixed h-screen w-64">
            <SidebarNav isBusiness={isBusiness} />
          </div>
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarNav onNavigate={() => setMobileOpen(false)} isBusiness={isBusiness} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
            <form onSubmit={submitSearch} className="hidden max-w-sm flex-1 md:block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar transação..."
                  className="rounded-full pl-9"
                />
              </div>
            </form>
            <div className="flex items-center gap-1">
              <NotificationBell initialNotifications={notifications} />
              <ThemeToggle />
              <UserMenu name={user.name} email={user.email} image={user.image} avatarIcon={user.avatarIcon} />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>

          <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground md:px-8">
            FinControl · {isBusiness ? "Empresas" : "Individual"}
          </footer>
        </div>

        <QuickAdd
          accounts={accounts}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          investmentCategories={investmentCategories}
        />
      </div>
    </QuickAddProvider>
  );
}
