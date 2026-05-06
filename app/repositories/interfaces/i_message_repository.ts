import type Message from '#models/message'

/*
|--------------------------------------------------------------------------
| IMessageRepository Interface
|--------------------------------------------------------------------------
*/
export interface IMessageRepository {
  /** Find message by ID */
  findById(id: string): Promise<Message | null>

  /** Find message by ID with sender preloaded */
  findByIdWithSender(id: string): Promise<Message | null>

  /** Get paginated messages for a conversation */
  findByConversationId(
    conversationId: string,
    options: PaginationOptions
  ): Promise<PaginatedMessages>

  /** Create a new message */
  create(data: CreateMessageDto): Promise<Message>

  /** Update message content */
  update(id: string, content: string): Promise<Message>

  /** Soft delete a message */
  softDelete(id: string): Promise<void>

  /** Update last_read_at for a participant */
  markAsRead(conversationId: string, userId: string): Promise<void>

  /** Count unread messages for a user in a conversation */
  countUnread(conversationId: string, userId: string): Promise<number>
}

/*
|--------------------------------------------------------------------------
| DTOs
|--------------------------------------------------------------------------
*/
export interface CreateMessageDto {
  conversationId: string
  senderId: string
  type: 'text' | 'image' | 'file' | 'system'
  content: string
  parentId?: string | null
}

export interface PaginationOptions {
  page: number
  limit: number
  before?: string // cursor — message ID to paginate before
}

export interface PaginatedMessages {
  data: Message[]
  meta: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}
