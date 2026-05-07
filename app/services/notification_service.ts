import db from '@adonisjs/lucid/services/db'
import type { INotificationRepository } from '#repositories/interfaces/i_notification_repository'
import type RealtimeService from '#services/realtime_service'

/*
|--------------------------------------------------------------------------
| NotificationService
|--------------------------------------------------------------------------
*/
export default class NotificationService {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly realtimeService: RealtimeService
  ) {}

  /*
  |--------------------------------------------------------------------------
  | Notify: New Message
  |--------------------------------------------------------------------------
  */
  async notifyNewMessage(data: {
    senderId: string
    senderName: string
    conversationId: string
    conversationName: string | null
    messageId: string
    messageContent: string
  }): Promise<void> {
    // Use raw db query — NO model involved
    const participants = await db
      .from('conversation_participants')
      .whereRaw('conversation_id = ?', [data.conversationId])
      .whereRaw('user_id != ?', [data.senderId])
      .select('user_id')

    if (participants.length === 0) return

    const title = data.conversationName
      ? `New message in ${data.conversationName}`
      : `New message from ${data.senderName}`

    const body =
      data.messageContent.length > 80
        ? `${data.messageContent.substring(0, 80)}...`
        : data.messageContent

    const notifications = participants.map((p: any) => ({
      userId: p.user_id,
      actorId: data.senderId,
      type: 'message:new' as const,
      conversationId: data.conversationId,
      messageId: data.messageId,
      title,
      body,
    }))

    await this.notificationRepository.createMany(notifications)

    for (const p of participants) {
      this.realtimeService.broadcastNotification(p.user_id, {
        type: 'message:new',
        title,
        body,
        conversationId: data.conversationId,
        messageId: data.messageId,
        actorId: data.senderId,
        actorName: data.senderName,
      })
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Notify: New Conversation
  |--------------------------------------------------------------------------
  */
  async notifyNewConversation(data: {
    creatorId: string
    creatorName: string
    conversationId: string
    conversationName: string | null
    participantIds: string[]
  }): Promise<void> {
    const recipients = data.participantIds.filter(
      (id) => id !== data.creatorId
    )

    if (recipients.length === 0) return

    const title = `${data.creatorName} added you to a conversation`
    const body = data.conversationName
      ? `You were added to "${data.conversationName}"`
      : `You have a new direct message from ${data.creatorName}`

    const notifications = recipients.map((userId) => ({
      userId,
      actorId: data.creatorId,
      type: 'conversation:new' as const,
      conversationId: data.conversationId,
      messageId: null,
      title,
      body,
    }))

    await this.notificationRepository.createMany(notifications)

    for (const userId of recipients) {
      this.realtimeService.broadcastNotification(userId, {
        type: 'conversation:new',
        title,
        body,
        conversationId: data.conversationId,
        actorId: data.creatorId,
        actorName: data.creatorName,
      })
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Notify: Participant Added
  |--------------------------------------------------------------------------
  */
  async notifyParticipantAdded(data: {
    actorId: string
    actorName: string
    conversationId: string
    conversationName: string | null
    addedUserId: string
  }): Promise<void> {
    const title = `Added to ${data.conversationName ?? 'a conversation'}`
    const body = `${data.actorName} added you to ${data.conversationName ?? 'a group conversation'}`

    await this.notificationRepository.create({
      userId: data.addedUserId,
      actorId: data.actorId,
      type: 'participant:added',
      conversationId: data.conversationId,
      title,
      body,
    })

    this.realtimeService.broadcastNotification(data.addedUserId, {
      type: 'participant:added',
      title,
      body,
      conversationId: data.conversationId,
      actorId: data.actorId,
      actorName: data.actorName,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | Notify: Participant Removed
  |--------------------------------------------------------------------------
  */
  async notifyParticipantRemoved(data: {
    actorId: string
    actorName: string
    conversationId: string
    conversationName: string | null
    removedUserId: string
  }): Promise<void> {
    const title = `Removed from ${data.conversationName ?? 'a conversation'}`
    const body = `${data.actorName} removed you from ${data.conversationName ?? 'a group conversation'}`

    await this.notificationRepository.create({
      userId: data.removedUserId,
      actorId: data.actorId,
      type: 'participant:removed',
      conversationId: data.conversationId,
      title,
      body,
    })

    this.realtimeService.broadcastNotification(data.removedUserId, {
      type: 'participant:removed',
      title,
      body,
      conversationId: data.conversationId,
      actorId: data.actorId,
      actorName: data.actorName,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | List Notifications
  |--------------------------------------------------------------------------
  */
  async list(
    userId: string,
    options: { page?: number; limit?: number; isRead?: boolean }
  ) {
    const result = await this.notificationRepository.findByUserId(
      userId,
      options
    )

    const unreadCount =
      await this.notificationRepository.getUnreadCount(userId)

    const page = options.page ?? 1
    const limit = options.limit ?? 20

    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        unreadCount,
        hasMore: (page - 1) * limit + limit < result.total,
      },
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Mark As Read
  |--------------------------------------------------------------------------
  */
  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.markAsRead(
      id,
      userId
    )

    if (!notification) {
      const { Exception } = await import('@adonisjs/core/exceptions')
      throw new Exception('Notification not found', {
        status: 404,
        code: 'E_NOTIFICATION_NOT_FOUND',
      })
    }

    return notification
  }

  /*
  |--------------------------------------------------------------------------
  | Mark All As Read
  |--------------------------------------------------------------------------
  */
  async markAllAsRead(userId: string): Promise<number> {
    return this.notificationRepository.markAllAsRead(userId)
  }

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */
  async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.notificationRepository.delete(id, userId)

    if (!deleted) {
      const { Exception } = await import('@adonisjs/core/exceptions')
      throw new Exception('Notification not found', {
        status: 404,
        code: 'E_NOTIFICATION_NOT_FOUND',
      })
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Get Unread Count
  |--------------------------------------------------------------------------
  */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId)
  }
}
