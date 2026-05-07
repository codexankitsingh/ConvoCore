export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<NotificationRecord>
  createMany(data: CreateNotificationData[]): Promise<void>
  findByUserId(
    userId: string,
    options: FindNotificationsOptions
  ): Promise<{ data: NotificationRecord[]; total: number }>
  findById(id: string): Promise<NotificationRecord | null>
  markAsRead(id: string, userId: string): Promise<NotificationRecord | null>
  markAllAsRead(userId: string): Promise<number>
  delete(id: string, userId: string): Promise<boolean>
  getUnreadCount(userId: string): Promise<number>
}

export interface CreateNotificationData {
  userId: string
  actorId?: string | null
  type: 'message:new' | 'conversation:new' | 'participant:added' | 'participant:removed'
  conversationId?: string | null
  messageId?: string | null
  title: string
  body: string
}

export interface NotificationRecord {
  id: string
  userId: string
  actorId: string | null
  type: string
  conversationId: string | null
  messageId: string | null
  title: string
  body: string
  isRead: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export interface FindNotificationsOptions {
  page?: number
  limit?: number
  isRead?: boolean
}
