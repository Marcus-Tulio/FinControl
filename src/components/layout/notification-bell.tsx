"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell as BellIcon, Check, Trash2, CalendarClock, PiggyBank, TrendingUp, Target, Landmark, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/format";
import {
  syncAndGetNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/server/actions/notifications";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  BILL_DUE: CalendarClock,
  BUDGET_ALERT: PiggyBank,
  SPENDING_TREND: TrendingUp,
  GOAL_PROGRESS: Target,
  DEBT_DUE: Landmark,
  SYSTEM: Info,
};

export function NotificationBell({ initialNotifications }: { initialNotifications: NotificationItem[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    syncAndGetNotifications().then(setNotifications).catch(() => {});
  }, []);

  function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    startTransition(() => {
      markNotificationRead(id);
    });
  }

  function handleDelete(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    startTransition(() => {
      deleteNotification(id);
    });
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    startTransition(() => {
      markAllNotificationsRead();
    });
  }

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label="Notificações" />}
      >
        <BellIcon className="h-[1.1rem] w-[1.1rem]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleMarkAllRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma notificação por aqui.</p>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                return (
                  <div key={n.id} className={`flex gap-3 px-4 py-3 ${n.isRead ? "opacity-60" : ""}`}>
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {!n.isRead && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMarkRead(n.id)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(n.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
