/*
|--------------------------------------------------------------------------
| IConversationService Interface
|--------------------------------------------------------------------------
*/
export interface IConversationService {
  /** Create a new conversation */
  create(data: CreateConversationInput, creatorId: string): Promise<ConversationResult>

  /** Get all conversations for current user */
  list(userId: string): Promise<ConversationResult[]>

  /** Get a single conversation (must be participant) */
  get(conversationId: string, userId: string): Promise<ConversationResult>

  /** Delete a conversation (admin/creator only) */
  destroy(conversationId: string, userId: string): Promise<any>

  /** Add participant to group conversation */
  addParticipant(conversationId: string, targetUserId: string, requesterId: string): Promise<any>

  /** Remove participant from group conversation */
  removeParticipant(
    conversationId: string,
    targetUserId: string,
    requesterId: string
  ): Promise<any>
}

/*
|--------------------------------------------------------------------------
| DTOs
|--------------------------------------------------------------------------
*/
export interface CreateConversationInput {
  type: 'direct' | 'group'
  name?: string
  participantIds: string[]
}

export interface ParticipantResult {
  id: string
  name: string
  email: string | null
  isGuest: boolean
  role: string
}

export interface ConversationResult {
  id: string
  type: string
  name: string | null
  avatarUrl: string | null
  createdBy: string
  participants: ParticipantResult[]
  createdAt: string
  updatedAt: string
}
