import { Exception } from '@adonisjs/core/exceptions'
import type {
  IConversationService,
  CreateConversationInput,
  ConversationResult,
} from './interfaces/i_conversation_service.js'
import type { IConversationRepository } from '#repositories/interfaces/i_conversation_repository'
import type { IUserRepository } from '#repositories/interfaces/i_user_repository'
import type RealtimeService from '#services/realtime_service'
import type Conversation from '#models/conversation'

/*
|--------------------------------------------------------------------------
| ConversationService
|--------------------------------------------------------------------------
*/
export default class ConversationService implements IConversationService {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly userRepository: IUserRepository,
    private readonly realtimeService: RealtimeService
  ) {}

  /*
  |--------------------------------------------------------------------------
  | Create Conversation
  |--------------------------------------------------------------------------
  */
  async create(data: CreateConversationInput, creatorId: string): Promise<ConversationResult> {
    if (data.type === 'direct') {
      if (data.participantIds.length !== 1) {
        throw new Exception('Direct conversation requires exactly 1 other participant', {
          status: 422,
          code: 'E_INVALID_PARTICIPANTS',
        })
      }

      const otherUserId = data.participantIds[0]

      if (otherUserId === creatorId) {
        throw new Exception('Cannot create a conversation with yourself', {
          status: 422,
          code: 'E_SELF_CONVERSATION',
        })
      }

      const otherUser = await this.userRepository.findById(otherUserId)
      if (!otherUser) {
        throw new Exception('User not found', {
          status: 404,
          code: 'E_USER_NOT_FOUND',
        })
      }

      const existing = await this.conversationRepository.findDirectConversation(
        creatorId,
        otherUserId
      )
      if (existing) {
        const withParticipants = await this.conversationRepository.findByIdWithParticipants(
          existing.id
        )
        return this.buildResult(withParticipants!)
      }

      const conversation = await this.conversationRepository.create({
        type: 'direct',
        createdBy: creatorId,
      })

      await this.conversationRepository.addParticipant(conversation.id, creatorId, 'admin')
      await this.conversationRepository.addParticipant(conversation.id, otherUserId, 'member')

      const withParticipants = await this.conversationRepository.findByIdWithParticipants(
        conversation.id
      )

      const result = this.buildResult(withParticipants!)

      // 🔴 Broadcast new conversation to both participants
      this.realtimeService.broadcastNewConversation(creatorId, result)
      this.realtimeService.broadcastNewConversation(otherUserId, result)

      return result
    }

    // ── Group Conversation ───────────────────────────────────────────
    if (!data.name || data.name.trim().length < 2) {
      throw new Exception('Group conversation requires a name (min 2 characters)', {
        status: 422,
        code: 'E_GROUP_NAME_REQUIRED',
      })
    }

    if (data.participantIds.length < 1) {
      throw new Exception('Group conversation requires at least 1 other participant', {
        status: 422,
        code: 'E_INVALID_PARTICIPANTS',
      })
    }

    const allParticipantIds = [...new Set([creatorId, ...data.participantIds])]

    for (const userId of allParticipantIds) {
      const user = await this.userRepository.findById(userId)
      if (!user) {
        throw new Exception(`User ${userId} not found`, {
          status: 404,
          code: 'E_USER_NOT_FOUND',
        })
      }
    }

    const conversation = await this.conversationRepository.create({
      type: 'group',
      name: data.name.trim(),
      createdBy: creatorId,
    })

    await this.conversationRepository.addParticipant(conversation.id, creatorId, 'admin')

    for (const userId of data.participantIds) {
      if (userId !== creatorId) {
        await this.conversationRepository.addParticipant(conversation.id, userId, 'member')
      }
    }

    const withParticipants = await this.conversationRepository.findByIdWithParticipants(
      conversation.id
    )

    const result = this.buildResult(withParticipants!)

    // 🔴 Broadcast new conversation to all participants
    for (const userId of allParticipantIds) {
      this.realtimeService.broadcastNewConversation(userId, result)
    }

    return result
  }

  /*
  |--------------------------------------------------------------------------
  | List Conversations
  |--------------------------------------------------------------------------
  */
  async list(userId: string): Promise<ConversationResult[]> {
    const conversations = await this.conversationRepository.findByUserId(userId)
    return conversations.map((c) => this.buildResult(c))
  }

  /*
  |--------------------------------------------------------------------------
  | Get Single Conversation
  |--------------------------------------------------------------------------
  */
  async get(conversationId: string, userId: string): Promise<ConversationResult> {
    const conversation = await this.conversationRepository.findByIdWithParticipants(conversationId)

    if (!conversation) {
      throw new Exception('Conversation not found', {
        status: 404,
        code: 'E_CONVERSATION_NOT_FOUND',
      })
    }

    const isParticipant = await this.conversationRepository.isParticipant(conversationId, userId)
    if (!isParticipant) {
      throw new Exception('You are not a participant in this conversation', {
        status: 403,
        code: 'E_NOT_PARTICIPANT',
      })
    }

    return this.buildResult(conversation)
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Conversation
  |--------------------------------------------------------------------------
  */
  async delete(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId)

    if (!conversation) {
      throw new Exception('Conversation not found', {
        status: 404,
        code: 'E_CONVERSATION_NOT_FOUND',
      })
    }

    if (conversation.createdBy !== userId) {
      throw new Exception('Only the conversation creator can delete it', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    await this.conversationRepository.delete(conversationId)
  }

  /*
  |--------------------------------------------------------------------------
  | Add Participant
  |--------------------------------------------------------------------------
  */
  async addParticipant(
    conversationId: string,
    targetUserId: string,
    requesterId: string
  ): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId)

    if (!conversation) {
      throw new Exception('Conversation not found', {
        status: 404,
        code: 'E_CONVERSATION_NOT_FOUND',
      })
    }

    if (conversation.type === 'direct') {
      throw new Exception('Cannot add participants to a direct conversation', {
        status: 422,
        code: 'E_DIRECT_CONVERSATION',
      })
    }

    const requesterParticipant = await this.conversationRepository.getParticipant(
      conversationId,
      requesterId
    )

    if (!requesterParticipant || requesterParticipant.role !== 'admin') {
      throw new Exception('Only admins can add participants', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    const targetUser = await this.userRepository.findById(targetUserId)
    if (!targetUser) {
      throw new Exception('User not found', {
        status: 404,
        code: 'E_USER_NOT_FOUND',
      })
    }

    const alreadyIn = await this.conversationRepository.isParticipant(conversationId, targetUserId)
    if (alreadyIn) {
      throw new Exception('User is already a participant', {
        status: 409,
        code: 'E_ALREADY_PARTICIPANT',
      })
    }

    await this.conversationRepository.addParticipant(conversationId, targetUserId, 'member')

    // 🔴 Broadcast participant added
    this.realtimeService.broadcastParticipantAdded(conversationId, {
      userId: targetUserId,
      name: targetUser.name,
      role: 'member',
    })
  }

  /*
  |--------------------------------------------------------------------------
  | Remove Participant
  |--------------------------------------------------------------------------
  */
  async removeParticipant(
    conversationId: string,
    targetUserId: string,
    requesterId: string
  ): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId)

    if (!conversation) {
      throw new Exception('Conversation not found', {
        status: 404,
        code: 'E_CONVERSATION_NOT_FOUND',
      })
    }

    if (conversation.type === 'direct') {
      throw new Exception('Cannot remove participants from a direct conversation', {
        status: 422,
        code: 'E_DIRECT_CONVERSATION',
      })
    }

    const requesterParticipant = await this.conversationRepository.getParticipant(
      conversationId,
      requesterId
    )

    const isSelfRemoval = requesterId === targetUserId
    const isAdmin = requesterParticipant?.role === 'admin'

    if (!isSelfRemoval && !isAdmin) {
      throw new Exception('Only admins can remove other participants', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    const targetParticipant = await this.conversationRepository.getParticipant(
      conversationId,
      targetUserId
    )

    if (!targetParticipant) {
      throw new Exception('User is not a participant', {
        status: 404,
        code: 'E_NOT_PARTICIPANT',
      })
    }

    await this.conversationRepository.removeParticipant(conversationId, targetUserId)

    // 🔴 Broadcast participant removed
    this.realtimeService.broadcastParticipantRemoved(conversationId, targetUserId)
  }

  /*
  |--------------------------------------------------------------------------
  | Private: Build Result
  |--------------------------------------------------------------------------
  */
  private buildResult(conversation: Conversation): ConversationResult {
    const participants = (conversation.participants ?? []).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isGuest: user.isGuest,
      role: (user.$extras as any).pivot_role ?? 'member',
    }))

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      avatarUrl: conversation.avatarUrl,
      createdBy: conversation.createdBy,
      participants,
      createdAt: conversation.createdAt.toISO()!,
      updatedAt: conversation.updatedAt.toISO()!,
    }
  }
}
