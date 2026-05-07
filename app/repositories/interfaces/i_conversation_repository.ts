export interface IConversationRepository {
  create(data: CreateConversationData): Promise<ConversationRecord>
  findByUserId(userId: string): Promise<ConversationRecord[]>
  findById(id: string): Promise<ConversationRecord | null>
  findByIdWithParticipants(id: string): Promise<ConversationRecord | null>
  findDirectConversation(
    userAId: string,
    userBId: string
  ): Promise<ConversationRecord | null>
  isParticipant(conversationId: string, userId: string): Promise<boolean>
  addParticipant(conversationId: string, userId: string): Promise<void>
  removeParticipant(conversationId: string, userId: string): Promise<void>
  delete(conversationId: string): Promise<void>
}

export interface CreateConversationData {
  type: 'direct' | 'group'
  name?: string | null
  createdBy: string
  participantIds: string[]
}

export interface ConversationRecord {
  id: string
  type: string
  name: string | null
  avatarUrl: string | null
  createdBy: string
  participants: ParticipantRecord[]
  createdAt: string
  updatedAt: string
}

export interface ParticipantRecord {
  id: string
  name: string
  email: string
  isGuest: boolean
  role: string
}
