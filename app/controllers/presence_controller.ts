import type { HttpContext } from '@adonisjs/core/http'
import { typingValidator } from '#validators/presence_validator'
import type PresenceService from '#services/presence_service'
import type { IConversationRepository } from '#repositories/interfaces/i_conversation_repository'

/*
|--------------------------------------------------------------------------
| PresenceController
|--------------------------------------------------------------------------
|
| Thin HTTP layer for presence endpoints.
| Depends on PresenceService and IConversationRepository.
|
*/
export default class PresenceController {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly conversationRepository: IConversationRepository
  ) {}

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/presence/online
  |--------------------------------------------------------------------------
  |
  | Client calls this every 20s as a heartbeat to stay online.
  | Fetches all conversations user is part of and marks them online.
  |
  */
  async online(ctx: HttpContext) {
    const user = (ctx as any).authUser

    // Get all conversations this user is part of
    const conversations = await this.conversationRepository.findByUserId(user.id)

    const conversationIds = conversations.map((c: any) => c.id)

    await this.presenceService.markOnline(user.id, conversationIds)

    return ctx.response.ok({
      message: 'Online status updated',
      data: {
        userId: user.id,
        conversationCount: conversationIds.length,
        expiresIn: '35s',
        heartbeatInterval: '20s',
      },
    })
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/presence/offline
  |--------------------------------------------------------------------------
  |
  | Client calls this on disconnect/logout to immediately go offline.
  |
  */
  async offline(ctx: HttpContext) {
    const user = (ctx as any).authUser

    await this.presenceService.markOffline(user.id)

    return ctx.response.ok({
      message: 'User marked as offline',
      data: { userId: user.id },
    })
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/presence/typing
  |--------------------------------------------------------------------------
  |
  | Client calls this when user starts/stops typing.
  | isTyping: true  → user started typing
  | isTyping: false → user stopped typing
  |
  */
  async typing(ctx: HttpContext) {
    const user = (ctx as any).authUser
    const { conversationId, isTyping } = await ctx.request.validateUsing(typingValidator)

    // Verify user is participant
    const isParticipant = await this.conversationRepository.isParticipant(conversationId, user.id)

    if (!isParticipant) {
      return ctx.response.forbidden({
        message: 'You are not a participant in this conversation',
        code: 'E_NOT_PARTICIPANT',
      })
    }

    await this.presenceService.setTyping(user.id, conversationId, isTyping, user.name)

    return ctx.response.ok({
      message: isTyping ? 'Typing indicator set' : 'Typing indicator cleared',
      data: {
        userId: user.id,
        conversationId,
        isTyping,
      },
    })
  }

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/presence/:conversationId
  |--------------------------------------------------------------------------
  |
  | Returns online/typing status for all participants in a conversation.
  |
  */
  async show(ctx: HttpContext) {
    const user = (ctx as any).authUser
    const conversationId = ctx.params.conversationId

    // Verify user is participant
    const isParticipant = await this.conversationRepository.isParticipant(conversationId, user.id)

    if (!isParticipant) {
      return ctx.response.forbidden({
        message: 'You are not a participant in this conversation',
        code: 'E_NOT_PARTICIPANT',
      })
    }

    // Get all participants
    const conversation = await this.conversationRepository.findByIdWithParticipants(conversationId)

    if (!conversation) {
      return ctx.response.notFound({
        message: 'Conversation not found',
        code: 'E_CONVERSATION_NOT_FOUND',
      })
    }

    const participantIds = conversation.participants.map((p: any) => p.id)

    const onlineUsers = await this.presenceService.getOnlineUsers(conversationId, participantIds)

    return ctx.response.ok({
      data: {
        conversationId,
        participants: onlineUsers,
      },
    })
  }
}
