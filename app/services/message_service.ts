import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import type {
  IMessageService,
  SendMessageInput,
  MessageResult,
  ListMessagesOptions,
  PaginatedMessageResult,
} from './interfaces/i_message_service.js'
import type { IMessageRepository } from '#repositories/interfaces/i_message_repository'
import type { IConversationRepository } from '#repositories/interfaces/i_conversation_repository'
import type RealtimeService from '#services/realtime_service'
import type Message from '#models/message'

/*
|--------------------------------------------------------------------------
| MessageService
|--------------------------------------------------------------------------
*/
export default class MessageService implements IMessageService {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly conversationRepository: IConversationRepository,
    private readonly realtimeService: RealtimeService
  ) {}

  /*
  |--------------------------------------------------------------------------
  | Send Message
  |--------------------------------------------------------------------------
  */
  async send(data: SendMessageInput, senderId: string): Promise<MessageResult> {
    // Verify sender is a participant
    const isParticipant = await this.conversationRepository.isParticipant(
      data.conversationId,
      senderId
    )

    if (!isParticipant) {
      throw new Exception('You are not a participant in this conversation', {
        status: 403,
        code: 'E_NOT_PARTICIPANT',
      })
    }

    // Validate parent message if provided
    if (data.parentId) {
      const parentMessage = await this.messageRepository.findById(data.parentId)
      if (!parentMessage) {
        throw new Exception('Parent message not found', {
          status: 404,
          code: 'E_MESSAGE_NOT_FOUND',
        })
      }
      if (parentMessage.conversationId !== data.conversationId) {
        throw new Exception('Parent message does not belong to this conversation', {
          status: 422,
          code: 'E_INVALID_PARENT',
        })
      }
    }

    // Create message
    const message = await this.messageRepository.create({
      conversationId: data.conversationId,
      senderId,
      type: data.type ?? 'text',
      content: data.content.trim(),
      parentId: data.parentId ?? null,
    })

    const result = this.buildResult(message)

    // 🔴 Broadcast real-time event to all conversation participants
    this.realtimeService.broadcastNewMessage(data.conversationId, result)

    return result
  }

  /*
  |--------------------------------------------------------------------------
  | List Messages
  |--------------------------------------------------------------------------
  */
  async list(
    conversationId: string,
    userId: string,
    options: ListMessagesOptions
  ): Promise<PaginatedMessageResult> {
    const isParticipant = await this.conversationRepository.isParticipant(conversationId, userId)

    if (!isParticipant) {
      throw new Exception('You are not a participant in this conversation', {
        status: 403,
        code: 'E_NOT_PARTICIPANT',
      })
    }

    const page = options.page ?? 1
    const limit = Math.min(options.limit ?? 50, 100)

    const result = await this.messageRepository.findByConversationId(conversationId, {
      page,
      limit,
      before: options.before,
    })

    return {
      data: result.data.map((m) => this.buildResult(m)),
      meta: result.meta,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Edit Message
  |--------------------------------------------------------------------------
  */
  async edit(messageId: string, content: string, userId: string): Promise<MessageResult> {
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

    if (message.deletedAt instanceof DateTime) {
      throw new Exception('Cannot edit a deleted message', {
        status: 422,
        code: 'E_MESSAGE_DELETED',
      })
    }

    if (message.type === 'system') {
      throw new Exception('Cannot edit system messages', {
        status: 422,
        code: 'E_SYSTEM_MESSAGE',
      })
    }

    const updated = await this.messageRepository.update(messageId, content.trim())

    const result = this.buildResult(updated)

    // 🔴 Broadcast edit event
    this.realtimeService.broadcastEditedMessage(message.conversationId, result)

    return result
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Message
  |--------------------------------------------------------------------------
  */
  async delete(messageId: string, userId: string): Promise<void> {
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

    if (message.deletedAt instanceof DateTime) {
      throw new Exception('Message is already deleted', {
        status: 422,
        code: 'E_MESSAGE_ALREADY_DELETED',
      })
    }

    await this.messageRepository.softDelete(messageId)

    // 🔴 Broadcast delete event
    this.realtimeService.broadcastDeletedMessage(message.conversationId, messageId)
  }

  /*
  |--------------------------------------------------------------------------
  | Mark As Read
  |--------------------------------------------------------------------------
  */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const isParticipant = await this.conversationRepository.isParticipant(conversationId, userId)

    if (!isParticipant) {
      throw new Exception('You are not a participant in this conversation', {
        status: 403,
        code: 'E_NOT_PARTICIPANT',
      })
    }

    await this.messageRepository.markAsRead(conversationId, userId)
  }

  /*
  |--------------------------------------------------------------------------
  | Private: Build Consistent Response
  |--------------------------------------------------------------------------
  */
  private buildResult(message: Message): MessageResult {
    const isDeleted = message.deletedAt instanceof DateTime

    return {
      id: message.id,
      conversationId: message.conversationId,
      type: message.type,
      content: isDeleted ? 'This message was deleted' : message.content,
      isEdited: message.isEdited,
      isDeleted,
      parentId: message.parentId,
      sender: message.sender
        ? {
            id: message.sender.id,
            name: message.sender.name,
            email: message.sender.email,
            isGuest: message.sender.isGuest,
          }
        : {
            id: message.senderId,
            name: 'Unknown',
            email: null,
            isGuest: false,
          },
      createdAt: message.createdAt.toISO()!,
      updatedAt: message.updatedAt.toISO()!,
    }
  }
}
