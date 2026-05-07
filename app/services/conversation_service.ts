import type { IConversationRepository } from '#repositories/interfaces/i_conversation_repository'
import type { IUserRepository } from '#repositories/interfaces/i_user_repository'
import type RealtimeService from '#services/realtime_service'
import type NotificationService from '#services/notification_service'
import { Exception } from '@adonisjs/core/exceptions'

/*
|--------------------------------------------------------------------------
| ConversationService
|--------------------------------------------------------------------------
*/
export default class ConversationService {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly userRepository: IUserRepository,
    private readonly realtimeService: RealtimeService,
    private readonly notificationService: NotificationService
  ) {}

  /*
  |--------------------------------------------------------------------------
  | Create Conversation
  |--------------------------------------------------------------------------
  */
  async create(
    creatorId: string,
    data: {
      type: 'direct' | 'group'
      name?: string
      participantIds: string[]
    }
  ) {
    // Validate participants exist
    for (const participantId of data.participantIds) {
      const user = await this.userRepository.findById(participantId)
      if (!user) {
        throw new Exception(`User ${participantId} not found`, {
          status: 404,
          code: 'E_USER_NOT_FOUND',
        })
      }
    }

    // For direct conversations, check if one already exists
    if (data.type === 'direct') {
      const otherUserId = data.participantIds.find((id) => id !== creatorId)
      if (otherUserId) {
        const existing = await this.conversationRepository.findDirectConversation(
          creatorId,
          otherUserId
        )
        if (existing) return existing
      }
    }

    const allParticipantIds = [...new Set([creatorId, ...data.participantIds])]

    const conversation = await this.conversationRepository.create({
      type: data.type,
      name: data.name ?? null,
      createdBy: creatorId,
      participantIds: allParticipantIds,
    })

    // Broadcast SSE to all participants
    for (const participantId of allParticipantIds) {
      this.realtimeService.broadcastNewConversation(participantId, conversation)
    }

    // Trigger notifications for all participants except creator
    await this.notificationService.notifyNewConversation({
      creatorId,
      creatorName:
        conversation.participants.find((p: any) => p.id === creatorId)?.name ?? 'Someone',
      conversationId: conversation.id,
      conversationName: conversation.name,
      participantIds: allParticipantIds,
    })

    return conversation
  }

  /*
  |--------------------------------------------------------------------------
  | List Conversations
  |--------------------------------------------------------------------------
  */
  async list(userId: string) {
    return this.conversationRepository.findByUserId(userId)
  }

  /*
  |--------------------------------------------------------------------------
  | Show Conversation
  |--------------------------------------------------------------------------
  */
  async show(conversationId: string) {
    const conversation = await this.conversationRepository.findByIdWithParticipants(conversationId)

    if (!conversation) {
      throw new Exception('Conversation not found', {
        status: 404,
        code: 'E_CONVERSATION_NOT_FOUND',
      })
    }

    return conversation
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Conversation
  |--------------------------------------------------------------------------
  */
  async destroy(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findByIdWithParticipants(conversationId)

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

    return { conversationId }
  }

  /*
  |--------------------------------------------------------------------------
  | Add Participant
  |--------------------------------------------------------------------------
  */
  async addParticipant(conversationId: string, actorId: string, userId: string) {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Exception('User not found', {
        status: 404,
        code: 'E_USER_NOT_FOUND',
      })
    }

    const alreadyParticipant = await this.conversationRepository.isParticipant(
      conversationId,
      userId
    )

    if (alreadyParticipant) {
      throw new Exception('User is already a participant', {
        status: 409,
        code: 'E_ALREADY_PARTICIPANT',
      })
    }

    await this.conversationRepository.addParticipant(conversationId, userId)

    const conversation = await this.conversationRepository.findByIdWithParticipants(conversationId)

    this.realtimeService.broadcastParticipantAdded(conversationId, user)

    // Notify added user
    const actor = await this.userRepository.findById(actorId)
    await this.notificationService.notifyParticipantAdded({
      actorId,
      actorName: actor?.name ?? 'Someone',
      conversationId,
      conversationName: conversation?.name ?? null,
      addedUserId: userId,
    })

    return conversation
  }

  /*
  |--------------------------------------------------------------------------
  | Remove Participant
  |--------------------------------------------------------------------------
  */
  async removeParticipant(conversationId: string, actorId: string, userId: string) {
    const conversation = await this.conversationRepository.findByIdWithParticipants(conversationId)

    if (!conversation) {
      throw new Exception('Conversation not found', {
        status: 404,
        code: 'E_CONVERSATION_NOT_FOUND',
      })
    }

    await this.conversationRepository.removeParticipant(conversationId, userId)

    this.realtimeService.broadcastParticipantRemoved(conversationId, userId)

    // Notify removed user
    const actor = await this.userRepository.findById(actorId)
    await this.notificationService.notifyParticipantRemoved({
      actorId,
      actorName: actor?.name ?? 'Someone',
      conversationId,
      conversationName: conversation?.name ?? null,
      removedUserId: userId,
    })

    return { conversationId, userId }
  }
}
