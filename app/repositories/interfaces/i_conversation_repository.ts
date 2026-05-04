import type Conversation from '#models/conversation'
import type ConversationParticipant from '#models/conversation_participant'

/*
|--------------------------------------------------------------------------
| IConversationRepository Interface
|--------------------------------------------------------------------------
|
| Dependency Inversion: ConversationService depends on this
| interface, not on the concrete repository.
|
*/
export interface IConversationRepository {
  /** Find conversation by ID */
  findById(id: string): Promise<Conversation | null>

  /** Find conversation by ID with participants loaded */
  findByIdWithParticipants(id: string): Promise<Conversation | null>

  /** Get all conversations for a user */
  findByUserId(userId: string): Promise<Conversation[]>

  /** Create a new conversation */
  create(data: CreateConversationDto): Promise<Conversation>

  /** Delete a conversation */
  delete(id: string): Promise<void>

  /** Add a participant to a conversation */
  addParticipant(
    conversationId: string,
    userId: string,
    role?: 'admin' | 'member'
  ): Promise<ConversationParticipant>

  /** Remove a participant from a conversation */
  removeParticipant(conversationId: string, userId: string): Promise<void>

  /** Check if user is a participant */
  isParticipant(conversationId: string, userId: string): Promise<boolean>

  /** Get participant record */
  getParticipant(conversationId: string, userId: string): Promise<ConversationParticipant | null>

  /** Check if direct conversation exists between two users */
  findDirectConversation(userAId: string, userBId: string): Promise<Conversation | null>
}

/*
|--------------------------------------------------------------------------
| DTOs
|--------------------------------------------------------------------------
*/
export interface CreateConversationDto {
  type: 'direct' | 'group'
  name?: string | null
  avatarUrl?: string | null
  createdBy: string
}
