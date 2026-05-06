import Message from '#models/message'
import ConversationParticipant from '#models/conversation_participant'
import { DateTime } from 'luxon'
import type {
  IMessageRepository,
  CreateMessageDto,
  PaginationOptions,
  PaginatedMessages,
} from './interfaces/i_message_repository.js'

/*
|--------------------------------------------------------------------------
| MessageRepository
|--------------------------------------------------------------------------
|
| All database queries for messages live here.
| Single Responsibility: ONLY handles message data access.
|
*/
export default class MessageRepository implements IMessageRepository {
  /** Find message by ID */
  async findById(id: string): Promise<Message | null> {
    return Message.find(id)
  }

  /** Find message by ID with sender preloaded */
  async findByIdWithSender(id: string): Promise<Message | null> {
    return Message.query().where('id', id).preload('sender').first()
  }

  /** Get paginated messages for a conversation (newest first) */
  async findByConversationId(
    conversationId: string,
    options: PaginationOptions
  ): Promise<PaginatedMessages> {
    const { page, limit } = options

    const query = Message.query()
      .where('conversation_id', conversationId)
      .preload('sender')
      .orderBy('created_at', 'desc')

    // Cursor-based pagination — get messages before a specific message
    if (options.before) {
      const cursorMessage = await Message.find(options.before)
      if (cursorMessage) {
        query.where('created_at', '<', cursorMessage.createdAt.toISO()!)
      }
    }

    const total = await Message.query()
      .where('conversation_id', conversationId)
      .count('* as total')
      .first()

    const messages = await query.limit(limit).offset((page - 1) * limit)

    const totalCount = Number((total as any).$extras.total)

    return {
      data: messages,
      meta: {
        total: totalCount,
        page,
        limit,
        hasMore: page * limit < totalCount,
      },
    }
  }

  /** Create a new message */
  async create(data: CreateMessageDto): Promise<Message> {
    const message = await Message.create({
      conversationId: data.conversationId,
      senderId: data.senderId,
      type: data.type,
      content: data.content,
      parentId: data.parentId ?? null,
      isEdited: false,
    })

    // Preload sender for response
    await message.load('sender')
    return message
  }

  /** Update message content and mark as edited */
  async update(id: string, content: string): Promise<Message> {
    const message = await Message.findOrFail(id)
    message.content = content
    message.isEdited = true
    await message.save()
    await message.load('sender')
    return message
  }

  /** Soft delete — set deleted_at timestamp */
  async softDelete(id: string): Promise<void> {
    await Message.query().where('id', id).update({ deleted_at: DateTime.now().toISO() })
  }

  /** Update last_read_at for participant */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await ConversationParticipant.query()
      .where('conversation_id', conversationId)
      .where('user_id', userId)
      .update({ last_read_at: DateTime.now().toISO() })
  }

  /** Count messages after last_read_at for a user */
  async countUnread(conversationId: string, userId: string): Promise<number> {
    const participant = await ConversationParticipant.query()
      .where('conversation_id', conversationId)
      .where('user_id', userId)
      .first()

    if (!participant || !participant.lastReadAt) {
      // Never read — count all messages not sent by user
      const result = await Message.query()
        .where('conversation_id', conversationId)
        .whereNot('sender_id', userId)
        .whereNull('deleted_at')
        .count('* as total')
        .first()
      return Number((result as any).$extras.total)
    }

    const result = await Message.query()
      .where('conversation_id', conversationId)
      .whereNot('sender_id', userId)
      .whereNull('deleted_at')
      .where('created_at', '>', participant.lastReadAt.toISO()!)
      .count('* as total')
      .first()

    return Number((result as any).$extras.total)
  }
}
