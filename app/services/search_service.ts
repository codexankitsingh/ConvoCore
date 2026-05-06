import db from '@adonisjs/lucid/services/db'

/*
|--------------------------------------------------------------------------
| SearchService
|--------------------------------------------------------------------------
|
| Uses PostgreSQL full-text search for messages and conversations.
| All searches are scoped to the requesting user's conversations only.
|
*/
export default class SearchService {
  /*
  |--------------------------------------------------------------------------
  | Search Messages
  |--------------------------------------------------------------------------
  |
  | Full-text search across message content using PostgreSQL tsvector.
  | Scoped to conversations the user is a participant of.
  |
  */
  async searchMessages(
    userId: string,
    options: SearchMessagesOptions
  ): Promise<SearchMessagesResult> {
    const page = options.page ?? 1
    const limit = Math.min(options.limit ?? 20, 50)
    const offset = (page - 1) * limit

    // Base query — scoped to user's conversations
    let query = db
      .from('messages as m')
      .join('conversation_participants as cp', 'cp.conversation_id', 'm.conversation_id')
      .join('users as u', 'u.id', 'm.sender_id')
      .join('conversations as c', 'c.id', 'm.conversation_id')
      .where('cp.user_id', userId)
      .whereNull('m.deleted_at')
      .whereRaw(`to_tsvector('english', m.content) @@ plainto_tsquery('english', ?)`, [options.q])
      .select([
        'm.id',
        'm.conversation_id as conversationId',
        'm.type',
        'm.content',
        'm.is_edited as isEdited',
        'm.parent_id as parentId',
        'm.created_at as createdAt',
        'm.updated_at as updatedAt',
        'u.id as senderId',
        'u.name as senderName',
        'u.email as senderEmail',
        'c.type as conversationType',
        'c.name as conversationName',
        db.raw(
          `ts_rank(to_tsvector('english', m.content),
           plainto_tsquery('english', ?)) as rank`,
          [options.q]
        ),
        db.raw(
          `ts_headline('english', m.content,
           plainto_tsquery('english', ?),
           'MaxWords=15, MinWords=5, ShortWord=3,
            HighlightAll=false, MaxFragments=1,
            StartSel=<mark>, StopSel=</mark>') as snippet`,
          [options.q]
        ),
      ])

    // Optional filters
    if (options.conversationId) {
      query = query.where('m.conversation_id', options.conversationId)
    }

    if (options.type) {
      query = query.where('m.type', options.type)
    }

    if (options.dateFrom) {
      query = query.where('m.created_at', '>=', options.dateFrom)
    }

    if (options.dateTo) {
      query = query.where('m.created_at', '<=', options.dateTo)
    }

    // Count total
    const countQuery = db
      .from('messages as m')
      .join('conversation_participants as cp', 'cp.conversation_id', 'm.conversation_id')
      .where('cp.user_id', userId)
      .whereNull('m.deleted_at')
      .whereRaw(`to_tsvector('english', m.content) @@ plainto_tsquery('english', ?)`, [options.q])
      .count('m.id as total')

    if (options.conversationId) {
      countQuery.where('m.conversation_id', options.conversationId)
    }
    if (options.type) {
      countQuery.where('m.type', options.type)
    }
    if (options.dateFrom) {
      countQuery.where('m.created_at', '>=', options.dateFrom)
    }
    if (options.dateTo) {
      countQuery.where('m.created_at', '<=', options.dateTo)
    }

    const [results, countResult] = await Promise.all([
      query.orderBy('rank', 'desc').limit(limit).offset(offset),
      countQuery.first(),
    ])

    const total = Number(countResult?.total ?? 0)

    return {
      data: results.map((row: any) => ({
        id: row.id,
        conversationId: row.conversationId,
        type: row.type,
        content: row.content,
        snippet: row.snippet,
        isEdited: row.isEdited,
        parentId: row.parentId,
        sender: {
          id: row.senderId,
          name: row.senderName,
          email: row.senderEmail,
        },
        conversation: {
          id: row.conversationId,
          type: row.conversationType,
          name: row.conversationName,
        },
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      meta: {
        total,
        page,
        limit,
        hasMore: offset + limit < total,
      },
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Search Conversations
  |--------------------------------------------------------------------------
  |
  | Search conversations by name or participant name.
  | Scoped to conversations the user is a participant of.
  |
  */
  async searchConversations(
    userId: string,
    options: SearchConversationsOptions
  ): Promise<SearchConversationsResult> {
    const page = options.page ?? 1
    const limit = Math.min(options.limit ?? 20, 50)
    const offset = (page - 1) * limit
    const searchTerm = `%${options.q.toLowerCase()}%`

    let query = db
      .from('conversations as c')
      .join('conversation_participants as cp', 'cp.conversation_id', 'c.id')
      .where('cp.user_id', userId)
      .where((builder) => {
        builder
          // Search by group name
          .whereRaw('LOWER(c.name) LIKE ?', [searchTerm])
          // OR search by participant name in direct conversations
          .orWhereExists((subQuery) => {
            subQuery
              .from('conversation_participants as cp2')
              .join('users as u2', 'u2.id', 'cp2.user_id')
              .whereRaw('cp2.conversation_id = c.id')
              .whereRaw('cp2.user_id != ?', [userId])
              .whereRaw('LOWER(u2.name) LIKE ?', [searchTerm])
          })
      })
      .select([
        'c.id',
        'c.type',
        'c.name',
        'c.avatar_url as avatarUrl',
        'c.created_by as createdBy',
        'c.created_at as createdAt',
        'c.updated_at as updatedAt',
      ])
      .distinct('c.id')

    if (options.type) {
      query = query.where('c.type', options.type)
    }

    // Count total
    const countQuery = db
      .from('conversations as c')
      .join('conversation_participants as cp', 'cp.conversation_id', 'c.id')
      .where('cp.user_id', userId)
      .where((builder) => {
        builder.whereRaw('LOWER(c.name) LIKE ?', [searchTerm]).orWhereExists((subQuery) => {
          subQuery
            .from('conversation_participants as cp2')
            .join('users as u2', 'u2.id', 'cp2.user_id')
            .whereRaw('cp2.conversation_id = c.id')
            .whereRaw('cp2.user_id != ?', [userId])
            .whereRaw('LOWER(u2.name) LIKE ?', [searchTerm])
        })
      })
      .countDistinct('c.id as total')

    if (options.type) {
      countQuery.where('c.type', options.type)
    }

    const [results, countResult] = await Promise.all([
      query.orderBy('c.updated_at', 'desc').limit(limit).offset(offset),
      countQuery.first(),
    ])

    const total = Number(countResult?.total ?? 0)

    // Load participants for each conversation
    const conversationIds = results.map((r: any) => r.id)
    let participantsMap: Record<string, any[]> = {}

    if (conversationIds.length > 0) {
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
    }

    return {
      data: results.map((row: any) => ({
        id: row.id,
        type: row.type,
        name: row.name,
        avatarUrl: row.avatarUrl,
        createdBy: row.createdBy,
        participants: participantsMap[row.id] ?? [],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      meta: {
        total,
        page,
        limit,
        hasMore: offset + limit < total,
      },
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Global Search
  |--------------------------------------------------------------------------
  |
  | Searches both messages and conversations simultaneously.
  |
  */
  async globalSearch(userId: string, options: GlobalSearchOptions): Promise<GlobalSearchResult> {
    const [messages, conversations] = await Promise.all([
      this.searchMessages(userId, {
        q: options.q,
        page: options.page,
        limit: options.limit,
      }),
      this.searchConversations(userId, {
        q: options.q,
        page: options.page,
        limit: options.limit,
      }),
    ])

    return {
      messages,
      conversations,
      meta: {
        query: options.q,
        totalMessages: messages.meta.total,
        totalConversations: conversations.meta.total,
      },
    }
  }
}

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/
export interface SearchMessagesOptions {
  q: string
  conversationId?: string
  type?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface SearchConversationsOptions {
  q: string
  type?: string
  page?: number
  limit?: number
}

export interface GlobalSearchOptions {
  q: string
  page?: number
  limit?: number
}

export interface SearchMessagesResult {
  data: any[]
  meta: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

export interface SearchConversationsResult {
  data: any[]
  meta: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

export interface GlobalSearchResult {
  messages: SearchMessagesResult
  conversations: SearchConversationsResult
  meta: {
    query: string
    totalMessages: number
    totalConversations: number
  }
}
