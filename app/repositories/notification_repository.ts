import { DateTime } from 'luxon'
import Notification from '#models/notification'
import type {
  INotificationRepository,
  CreateNotificationData,
  NotificationRecord,
  FindNotificationsOptions,
} from '#repositories/interfaces/i_notification_repository'

/*
|--------------------------------------------------------------------------
| NotificationRepository
|--------------------------------------------------------------------------
*/
export default class NotificationRepository implements INotificationRepository {
  /*
  |--------------------------------------------------------------------------
  | Create single notification
  |--------------------------------------------------------------------------
  */
  async create(data: CreateNotificationData): Promise<NotificationRecord> {
    const notification = await Notification.create({
      userId: data.userId,
      actorId: data.actorId ?? null,
      type: data.type,
      conversationId: data.conversationId ?? null,
      messageId: data.messageId ?? null,
      title: data.title,
      body: data.body,
      isRead: false,
    })

    return this.toRecord(notification)
  }

  /*
  |--------------------------------------------------------------------------
  | Create many notifications (bulk insert)
  |--------------------------------------------------------------------------
  */
  async createMany(data: CreateNotificationData[]): Promise<void> {
    if (data.length === 0) return

    await Notification.createMany(
      data.map((d) => ({
        userId: d.userId,
        actorId: d.actorId ?? null,
        type: d.type,
        conversationId: d.conversationId ?? null,
        messageId: d.messageId ?? null,
        title: d.title,
        body: d.body,
        isRead: false,
      }))
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Find notifications by userId with pagination
  |--------------------------------------------------------------------------
  */
  async findByUserId(
    userId: string,
    options: FindNotificationsOptions
  ): Promise<{ data: NotificationRecord[]; total: number }> {
    const page = options.page ?? 1
    const limit = Math.min(options.limit ?? 20, 50)

    let query = Notification.query().where('user_id', userId).orderBy('created_at', 'desc')

    if (options.isRead !== undefined) {
      query = query.where('is_read', options.isRead)
    }

    const result = await query.paginate(page, limit)

    return {
      data: result.all().map((n) => this.toRecord(n)),
      total: result.total,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Find by ID
  |--------------------------------------------------------------------------
  */
  async findById(id: string): Promise<NotificationRecord | null> {
    const notification = await Notification.find(id)
    if (!notification) return null
    return this.toRecord(notification)
  }

  /*
  |--------------------------------------------------------------------------
  | Mark single notification as read
  |--------------------------------------------------------------------------
  */
  async markAsRead(id: string, userId: string): Promise<NotificationRecord | null> {
    const notification = await Notification.query().where('id', id).where('user_id', userId).first()

    if (!notification) return null

    notification.isRead = true
    notification.readAt = DateTime.now()
    await notification.save()

    return this.toRecord(notification)
  }

  /*
  |--------------------------------------------------------------------------
  | Mark all notifications as read
  |--------------------------------------------------------------------------
  */
  async markAllAsRead(userId: string): Promise<number> {
    const count = await Notification.query()
      .where('user_id', userId)
      .where('is_read', false)
      .update({
        is_read: true,
        read_at: DateTime.now().toSQL(),
      })

    return count[0] ?? 0
  }

  /*
  |--------------------------------------------------------------------------
  | Delete notification
  |--------------------------------------------------------------------------
  */
  async delete(id: string, userId: string): Promise<boolean> {
    const count = await Notification.query().where('id', id).where('user_id', userId).delete()

    return count > 0
  }

  /*
  |--------------------------------------------------------------------------
  | Get unread count
  |--------------------------------------------------------------------------
  */
  async getUnreadCount(userId: string): Promise<number> {
    const result = await Notification.query()
      .where('user_id', userId)
      .where('is_read', false)
      .count('id as total')
      .first()

    return Number(result?.$extras.total ?? 0)
  }

  /*
  |--------------------------------------------------------------------------
  | Private: Map model to plain record
  |--------------------------------------------------------------------------
  */
  private toRecord(n: Notification): NotificationRecord {
    return {
      id: n.id,
      userId: n.userId,
      actorId: n.actorId,
      type: n.type,
      conversationId: n.conversationId,
      messageId: n.messageId,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      readAt: n.readAt?.toISO() ?? null,
      createdAt: n.createdAt.toISO()!,
      updatedAt: n.updatedAt.toISO()!,
    }
  }
}
