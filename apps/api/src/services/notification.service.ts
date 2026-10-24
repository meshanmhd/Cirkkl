import { NotificationRepo } from "../ports/repositories";
import { RealtimeProvider } from "../ports/realtime.provider";
import { CallerContext } from "./auth.service";

export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepo,
    private readonly realtimeProvider: RealtimeProvider
  ) {}

  async list(caller: CallerContext, filters?: any): Promise<any> {
    const res = await this.notificationRepo.findByUser(caller.userId, filters);
    const items = res.items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      eventId: n.eventId,
      teamId: n.teamId,
      senderId: n.senderId,
    }));

    return {
      items,
      meta: {
        total: res.total,
        page: res.page,
        limit: res.limit,
        totalPages: res.totalPages,
        hasNextPage: res.hasNextPage,
        hasPreviousPage: res.hasPreviousPage,
      },
    };
  }

  async markRead(id: string, caller: CallerContext): Promise<{ success: boolean }> {
    await this.notificationRepo.markRead(id, caller.userId);
    return { success: true };
  }

  async markAllRead(caller: CallerContext): Promise<{ success: boolean; updatedCount: number }> {
    const updatedCount = await this.notificationRepo.markAllRead(caller.userId);
    return { success: true, updatedCount };
  }

  async delete(id: string, caller: CallerContext): Promise<{ success: boolean }> {
    await this.notificationRepo.delete(id, caller.userId);
    return { success: true };
  }

  async unreadCount(caller: CallerContext): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationRepo.countUnread(caller.userId);
    return { unreadCount };
  }

  async cleanupOldNotifications(olderThanDays: number = 30): Promise<number> {
    return this.notificationRepo.deleteOldNotifications("", olderThanDays);
  }

  getRealtimeProvider(): RealtimeProvider {
    return this.realtimeProvider;
  }
}
