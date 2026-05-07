import db from '@adonisjs/lucid/services/db'
import Conversation from '#models/conversation'
import type {
  IConversationRepository,
  CreateConversationData,
} from '#repositories/interfaces/i_conversation_repository'

/*
|--------------------------------------------------------------------------
| ConversationRepository
|--------------------------------------------------------------------------
| Uses ONLY raw db queries for conversation_participants table.
| Never uses ConversationParticipant model to avoid column mapping issues.
*/
export default class ConversationRepository
  implements IConversationRepository
{
  /*
  |--------------------------------------------------------------------------
  | Create
  |--------------------------------------------------------------------------
  */
  async create(data: CreateConversationData & { participantIds: string[] }): Promise<any> {
    const conversation = await db.transaction(async (trx) => {
      const conv = await Conversation.create(
        {
          type: data.type,
          name: data.name ?? null,
          createdBy: data.createdBy,
        },
        { client: trx }
      )

      const rows = (data.participantIds ?? [data.createdBy]).map(
        (userId: string) => ({
          conversation_id: conv.id,
          user_id: userId,
          role: userId === data.createdBy ? 'admin' : 'member',
          created_at: new Date(),
          updated_at: new Date(),
        })
      )

      await trx.table('conversation_participants').insert(rows)
      return conv
    })

    return this.findByIdWithParticipants(conversation.id)
  }

  /*
  |--------------------------------------------------------------------------
  | findByUserId
  |--------------------------------------------------------------------------
  */
  async findByUserId(userId: string): Promise<any[]> {
    // Step 1: Get all conversation IDs for the user (1 query)
    const conversations = await db
      .from('conversations as c')
      .join('conversation_participants as cp', 'cp.conversation_id', 'c.id')
      .whereRaw('cp.user_id = ?', [userId])
      .select([
        'c.id',
        'c.type',
        'c.name',
        'c.avatar_url as avatarUrl',
        'c.created_by as createdBy',
        'c.created_at as createdAt',
        'c.updated_at as updatedAt',
      ])
      .orderBy('c.updated_at', 'desc')

    if (conversations.length === 0) return []

    // Step 2: Batch-load all participants for those conversations (1 query)
    const conversationIds = conversations.map((c: any) => c.id)
    const participants = await db
      .from('conversation_participants as cp')
      .join('users as u', 'u.id', 'cp.user_id')
      .whereIn('cp.conversation_id', conversationIds)
      .select([
        'cp.conversation_id as conversationId',
        'u.id',
        'u.name',
        'u.email',
        'u.is_guest as isGuest',
        'cp.role',
      ])

    // Step 3: Group participants by conversation ID (in-memory)
    const participantsMap: Record<string, any[]> = {}
    for (const p of participants) {
      if (!participantsMap[p.conversationId]) {
        participantsMap[p.conversationId] = []
      }
      participantsMap[p.conversationId].push({
        id: p.id,
        name: p.name,
        email: p.email,
        isGuest: p.isGuest,
        role: p.role,
      })
    }

    return conversations.map((c: any) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      avatarUrl: c.avatarUrl ?? null,
      createdBy: c.createdBy,
      participants: participantsMap[c.id] ?? [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  }

  /*
  |--------------------------------------------------------------------------
  | findById
  |--------------------------------------------------------------------------
  */
  async findById(id: string): Promise<any | null> {
    return this.findByIdWithParticipants(id)
  }

  /*
  |--------------------------------------------------------------------------
  | findByIdWithParticipants
  |--------------------------------------------------------------------------
  */
  async findByIdWithParticipants(id: string): Promise<any | null> {
    const conversation = await Conversation.find(id)
    if (!conversation) return null

    const participants = await db
      .from('conversation_participants as cp')
      .join('users as u', 'u.id', 'cp.user_id')
      .whereRaw('cp.conversation_id = ?', [id])
      .select([
        'u.id',
        'u.name',
        'u.email',
        'u.is_guest as isGuest',
        'cp.role',
      ])

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      avatarUrl: conversation.avatarUrl ?? null,
      createdBy: conversation.createdBy,
      participants: participants.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        isGuest: p.isGuest,
        role: p.role,
      })),
      createdAt: conversation.createdAt.toISO(),
      updatedAt: conversation.updatedAt.toISO(),
    }
  }

  /*
  |--------------------------------------------------------------------------
  | findDirectConversation
  |--------------------------------------------------------------------------
  */
  async findDirectConversation(
    userAId: string,
    userBId: string
  ): Promise<any | null> {
    const result = await db
      .from('conversations as c')
      .join('conversation_participants as cp1', 'cp1.conversation_id', 'c.id')
      .join('conversation_participants as cp2', 'cp2.conversation_id', 'c.id')
      .where('c.type', 'direct')
      .whereRaw('cp1.user_id = ?', [userAId])
      .whereRaw('cp2.user_id = ?', [userBId])
      .select('c.id')
      .first()

    if (!result) return null
    return this.findByIdWithParticipants(result.id)
  }

  /*
  |--------------------------------------------------------------------------
  | isParticipant — 100% raw SQL, no model involved
  |--------------------------------------------------------------------------
  */
  async isParticipant(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    const result = await db
      .from('conversation_participants')
      .whereRaw('conversation_id = ?', [conversationId])
      .whereRaw('user_id = ?', [userId])
      .select(db.raw('1 as found'))
      .first()

    return !!result
  }

  /*
  |--------------------------------------------------------------------------
  | addParticipant
  |--------------------------------------------------------------------------
  */
  async addParticipant(
    conversationId: string,
    userId: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<any> {
    await db.table('conversation_participants').insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      created_at: new Date(),
      updated_at: new Date(),
    })
    return { conversationId, userId, role }
  }

  /*
  |--------------------------------------------------------------------------
  | removeParticipant
  |--------------------------------------------------------------------------
  */
  async removeParticipant(
    conversationId: string,
    userId: string
  ): Promise<void> {
    await db
      .from('conversation_participants')
      .whereRaw('conversation_id = ?', [conversationId])
      .whereRaw('user_id = ?', [userId])
      .delete()
  }

  /*
  |--------------------------------------------------------------------------
  | getParticipant
  |--------------------------------------------------------------------------
  */
  async getParticipant(
    conversationId: string,
    userId: string
  ): Promise<any | null> {
    const result = await db
      .from('conversation_participants')
      .whereRaw('conversation_id = ?', [conversationId])
      .whereRaw('user_id = ?', [userId])
      .select(['conversation_id', 'user_id', 'role'])
      .first()

    return result ?? null
  }

  /*
  |--------------------------------------------------------------------------
  | delete
  |--------------------------------------------------------------------------
  */
  async delete(conversationId: string): Promise<void> {
    await Conversation.query().where('id', conversationId).delete()
  }
}
