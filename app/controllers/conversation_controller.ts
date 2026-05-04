import type { HttpContext } from '@adonisjs/core/http'
import {
  createConversationValidator,
  addParticipantValidator,
} from '#validators/conversation_validator'
import type { IConversationService } from '#services/interfaces/i_conversation_service'
import type User from '#models/user'

/*
|--------------------------------------------------------------------------
| ConversationController
|--------------------------------------------------------------------------
|
| Thin HTTP layer ONLY.
| Depends on IConversationService interface (Dependency Inversion).
|
*/
export default class ConversationController {
  constructor(private readonly conversationService: IConversationService) {}

  /*
  |--------------------------------------------------------------------------
  | Helper — get authenticated user from context
  |--------------------------------------------------------------------------
  */
  private getAuthUser(ctx: HttpContext): User {
    const user = (ctx as any).authUser
    if (!user) {
      throw new Error('User not authenticated')
    }
    return user
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/conversations
  |--------------------------------------------------------------------------
  */
  async create(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const data = await ctx.request.validateUsing(createConversationValidator)

    const result = await this.conversationService.create(data, user.id)

    return ctx.response.created({
      message: 'Conversation created successfully',
      data: result,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/conversations
  |--------------------------------------------------------------------------
  */
  async list(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)

    const result = await this.conversationService.list(user.id)

    return ctx.response.ok({
      data: result,
      meta: {
        total: result.length,
      },
    })
  }

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/conversations/:id
  |--------------------------------------------------------------------------
  */
  async show(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const conversationId = ctx.params.id

    const result = await this.conversationService.get(conversationId, user.id)

    return ctx.response.ok({
      data: result,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE /api/v1/conversations/:id
  |--------------------------------------------------------------------------
  */
  async destroy(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const conversationId = ctx.params.id

    await this.conversationService.delete(conversationId, user.id)

    return ctx.response.ok({
      message: 'Conversation deleted successfully',
    })
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/conversations/:id/participants
  |--------------------------------------------------------------------------
  */
  async addParticipant(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const conversationId = ctx.params.id
    const { userId } = await ctx.request.validateUsing(addParticipantValidator)

    await this.conversationService.addParticipant(conversationId, userId, user.id)

    return ctx.response.ok({
      message: 'Participant added successfully',
    })
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE /api/v1/conversations/:id/participants/:userId
  |--------------------------------------------------------------------------
  */
  async removeParticipant(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const { id: conversationId, userId: targetUserId } = ctx.params

    await this.conversationService.removeParticipant(conversationId, targetUserId, user.id)

    return ctx.response.ok({
      message: 'Participant removed successfully',
    })
  }
}
