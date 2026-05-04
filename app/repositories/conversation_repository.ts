import Conversation from '#models/conversation'
import ConversationParticipant from '#models/conversation_participant'
import type {
  IConversationRepository,
  CreateConversationDto,
} from './interfaces/i_conversation_repository.js'

/*
|--------------------------------------------------------------------------
| ConversationRepository
|--------------------------------------------------------------------------
|
| All database queries for conversations live here.
| Single Responsibility: ONLY handles conversation data access.
|
*/
export default class ConversationRepository implements IConversationRepository {
  /** Find by ID — no relations */
  async findById(id: string): Promise<Conversation | null> {
    return Conversation.find(id)
  }

  /** Find by ID — with participants and their user data */
  async findByIdWithParticipants(id: string): Promise<Conversation | null> {
    return Conversation.query()
      .where('id', id)
      .preload('participants', (query) => {
        query.pivotColumns(['role', 'last_read_at', 'created_at'])
      })
      .first()
  }

  /** Get all conversations for a user (ordered by latest activity) */
  async findByUserId(userId: string): Promise<Conversation[]> {
    return Conversation.query()
      .whereHas('participants', (query) => {
        query.where('user_id', userId)
      })
      .preload('participants', (query) => {
        query.pivotColumns(['role', 'last_read_at', 'created_at'])
      })
      .orderBy('updated_at', 'desc')
  }

  /** Create a new conversation */
  async create(data: CreateConversationDto): Promise<Conversation> {
    return Conversation.create({
      type: data.type,
      name: data.name ?? null,
      avatarUrl: data.avatarUrl ?? null,
      createdBy: data.createdBy,
    })
  }

  /** Delete conversation (cascades to participants + messages) */
  async delete(id: string): Promise<void> {
    await Conversation.query().where('id', id).delete()
  }

  /** Add participant to conversation */
  async addParticipant(
    conversationId: string,
    userId: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<ConversationParticipant> {
    return ConversationParticipant.create({
      conversationId,
      userId,
      role,
    })
  }

  /** Remove participant from conversation */
  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    await ConversationParticipant.query()
      .where('conversation_id', conversationId)
      .where('user_id', userId)
      .delete()
  }

  /** Check if user is a participant */
  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const record = await ConversationParticipant.query()
      .where('conversation_id', conversationId)
      .where('user_id', userId)
      .first()
    return !!record
  }

  /** Get participant record with role */
  async getParticipant(
    conversationId: string,
    userId: string
  ): Promise<ConversationParticipant | null> {
    return ConversationParticipant.query()
      .where('conversation_id', conversationId)
      .where('user_id', userId)
      .first()
  }

  /** Find existing direct conversation between two users */
  async findDirectConversation(userAId: string, userBId: string): Promise<Conversation | null> {
    return Conversation.query()
      .where('type', 'direct')
      .whereHas('participants', (q) => q.where('user_id', userAId))
      .whereHas('participants', (q) => q.where('user_id', userBId))
      .first()
  }
}
