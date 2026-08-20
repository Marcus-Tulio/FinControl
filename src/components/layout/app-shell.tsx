"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { QuickAdd } from "./quick-add";

type Account = { id: string; name: string };
type Category = { id: string; name: string };
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
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; image?: string | null };
  accounts: Account[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  investmentCategories: Category[];
  notifications: NotificationItem[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        <div className="fixed h-screen w-64">
          <SidebarNav />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1">
            <NotificationBell initialNotifications={notifications} />
            <ThemeToggle />
            <UserMenu name={user.name} email={user.email} image={user.image} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      <QuickAdd
        accounts={accounts}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        investmentCategories={investmentCategories}
      />
    </div>
  );
}
