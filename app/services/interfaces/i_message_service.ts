import type { PaginatedMessages } from '#repositories/interfaces/i_message_repository'

/*
|--------------------------------------------------------------------------
| IMessageService Interface
|--------------------------------------------------------------------------
*/
export interface IMessageService {
  /** Send a message to a conversation */
  send(data: SendMessageInput, senderId: string): Promise<MessageResult>

  /** Get paginated messages for a conversation */
  list(
    conversationId: string,
    userId: string,
    options: ListMessagesOptions
  ): Promise<PaginatedMessageResult>

  /** Edit a message */
  edit(messageId: string, content: string, userId: string): Promise<MessageResult>

  /** Delete a message (soft delete) */
  delete(messageId: string, userId: string): Promise<void>

  /** Mark all messages in conversation as read */
  markAsRead(conversationId: string, userId: string): Promise<void>
}

/*
|--------------------------------------------------------------------------
| DTOs
|--------------------------------------------------------------------------
*/
export interface SendMessageInput {
  conversationId: string
  type?: 'text' | 'image' | 'file'
  content: string
  parentId?: string | null
}

export interface ListMessagesOptions {
  page?: number
  limit?: number
  before?: string
}

export interface MessageResult {
  id: string
  conversationId: string
  type: string
  content: string
  isEdited: boolean
  isDeleted: boolean
  parentId: string | null
  sender: {
    id: string
    name: string
    email: string | null
    isGuest: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface PaginatedMessageResult {
  data: MessageResult[]
  meta: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}
