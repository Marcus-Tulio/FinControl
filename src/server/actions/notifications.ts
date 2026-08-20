"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/server/session";
import { syncNotifications } from "@/server/notifications-engine";

export async function syncAndGetNotifications() {
  const userId = await requireUserId();
  await syncNotifications(userId);
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function markNotificationRead(id: string) {
  const userId = await requireUserId();
  await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId();
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  revalidatePath("/");
}

export async function deleteNotification(id: string) {
  const userId = await requireUserId();
  await prisma.notification.deleteMany({ where: { id, userId } });
  revalidatePath("/");
}
