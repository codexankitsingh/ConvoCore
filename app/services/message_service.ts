import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import type {
  IMessageService,
  SendMessageInput,
  MessageResult,
  ListMessagesOptions,
  PaginatedMessageResult,
} from './interfaces/i_message_service.js'
import type { IMessageRepository } from '#repositories/interfaces/i_message_repository'
import type { IConversationRepository } from '#repositories/interfaces/i_conversation_repository'
import type Message from '#models/message'

/*
|--------------------------------------------------------------------------
| MessageService
|--------------------------------------------------------------------------
|
| Handles all message business logic.
| Single Responsibility: ONLY message concerns.
| Depends on interfaces (Dependency Inversion).
|
*/
export default class MessageService implements IMessageService {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly conversationRepository: IConversationRepository
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

    // Validate parent message exists if provided
    if (data.parentId) {
      const parentMessage = await this.messageRepository.findById(data.parentId)
      if (!parentMessage) {
        throw new Exception('Parent message not found', {
          status: 404,
          code: 'E_MESSAGE_NOT_FOUND',
        })
      }
      // Parent must be in same conversation
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

    // Update conversation updated_at (bump to top of list)
    await this.conversationRepository.findById(data.conversationId)

    return this.buildResult(message)
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
    // Verify user is a participant
    const isParticipant = await this.conversationRepository.isParticipant(conversationId, userId)

    if (!isParticipant) {
      throw new Exception('You are not a participant in this conversation', {
        status: 403,
        code: 'E_NOT_PARTICIPANT',
      })
    }

    const page = options.page ?? 1
    const limit = Math.min(options.limit ?? 50, 100) // max 100 per page

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

    // Only sender can edit
    if (message.senderId !== userId) {
      throw new Exception('You can only edit your own messages', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    // Cannot edit deleted messages
    if (message.deletedAt !== null) {
      throw new Exception('Cannot edit a deleted message', {
        status: 422,
        code: 'E_MESSAGE_DELETED',
      })
    }

    // Cannot edit system messages
    if (message.type === 'system') {
      throw new Exception('Cannot edit system messages', {
        status: 422,
        code: 'E_SYSTEM_MESSAGE',
      })
    }

    const updated = await this.messageRepository.update(messageId, content.trim())

    return this.buildResult(updated)
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Message (Soft Delete)
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

    // Only sender can delete their own message
    if (message.senderId !== userId) {
      throw new Exception('You can only delete your own messages', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    // Already deleted
    if (message.deletedAt !== null) {
      throw new Exception('Message is already deleted', {
        status: 422,
        code: 'E_MESSAGE_ALREADY_DELETED',
      })
    }

    await this.messageRepository.softDelete(messageId)
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
    // Correctly check if deletedAt is a DateTime instance (not null)
    const isDeleted = message.deletedAt instanceof DateTime

    return {
      id: message.id,
      conversationId: message.conversationId,
      type: message.type,
      // Hide content of soft-deleted messages
      content: isDeleted ? 'This message was deleted' : message.content,
      isEdited: message.isEdited,
      isDeleted: isDeleted,
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
