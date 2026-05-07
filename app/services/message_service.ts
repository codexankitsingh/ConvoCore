import db from '@adonisjs/lucid/services/db'
import type { IMessageService } from '#services/interfaces/i_message_service'
import type { IMessageRepository } from '#repositories/interfaces/i_message_repository'
import type RealtimeService from '#services/realtime_service'
import type NotificationService from '#services/notification_service'
import { Exception } from '@adonisjs/core/exceptions'

/*
|--------------------------------------------------------------------------
| MessageService
|--------------------------------------------------------------------------
*/
export default class MessageService implements IMessageService {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly realtimeService: RealtimeService,
    private readonly notificationService: NotificationService
  ) {}

  /*
  |--------------------------------------------------------------------------
  | Send Message
  | Called by controller as: send({ conversationId, content, type, parentId }, userId)
  |--------------------------------------------------------------------------
  */
  async send(
    data: {
      conversationId: string
      content: string
      type?: string
      parentId?: string
    },
    senderId: string
  ) {
    // Check participant using raw db — no model
    const participant = await db
      .from('conversation_participants')
      .whereRaw('conversation_id = ?', [data.conversationId])
      .whereRaw('user_id = ?', [senderId])
      .select(db.raw('1 as found'))
      .first()

    if (!participant) {
      throw new Exception('You are not a participant', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    const message = await this.messageRepository.create({
      conversationId: data.conversationId,
      senderId,
      type: (data.type as any) ?? 'text',
      content: data.content,
      parentId: data.parentId ?? null,
    })

    // Broadcast SSE
    this.realtimeService.broadcastNewMessage(data.conversationId, message)

    // Get conversation name for notification
    const conversation = await db
      .from('conversations')
      .where('id', data.conversationId)
      .select(['id', 'name', 'type'])
      .first()

    // Trigger notifications — fire and forget (don't block response)
    this.notificationService
      .notifyNewMessage({
        senderId,
        senderName: message.sender.name,
        conversationId: data.conversationId,
        conversationName: conversation?.name ?? null,
        messageId: message.id,
        messageContent: data.content,
      })
      .catch((err: any) =>
        console.error('Notification error (non-fatal):', err?.message)
      )

    return message
  }

  /*
  |--------------------------------------------------------------------------
  | List Messages
  |--------------------------------------------------------------------------
  */
  async list(
    conversationId: string,
    userId: string,
    options: { page?: number; limit?: number; before?: string }
  ) {
    return this.messageRepository.findByConversationId(
      conversationId,
      options
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Edit Message
  |--------------------------------------------------------------------------
  */
  async edit(messageId: string, content: string, userId: string) {
    const message = await this.messageRepository.findById(messageId)

    if (!message) {
      throw new Exception('Message not found', {
        status: 404,
        code: 'E_MESSAGE_NOT_FOUND',
      })
    }

    if (message.senderId !== userId) {
      throw new Exception('You can only edit your own messages', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    const updated = await this.messageRepository.update(messageId, {
      content,
      isEdited: true,
    })

    this.realtimeService.broadcastEditedMessage(
      message.conversationId,
      updated
    )

    return updated
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Message
  |--------------------------------------------------------------------------
  */
  async delete(messageId: string, userId: string) {
    const message = await this.messageRepository.findById(messageId)

    if (!message) {
      throw new Exception('Message not found', {
        status: 404,
        code: 'E_MESSAGE_NOT_FOUND',
      })
    }

    if (message.senderId !== userId) {
      throw new Exception('You can only delete your own messages', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    await this.messageRepository.softDelete(messageId)

    this.realtimeService.broadcastDeletedMessage(
      message.conversationId,
      messageId
    )

    return { messageId }
  }

  /*
  |--------------------------------------------------------------------------
  | Mark As Read
  |--------------------------------------------------------------------------
  */
  async markAsRead(conversationId: string, userId: string) {
    return this.messageRepository.markAllReadInConversation(
      conversationId,
      userId
    )
  }
}
