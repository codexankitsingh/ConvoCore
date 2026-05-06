import type { HttpContext } from '@adonisjs/core/http'
import {
  sendMessageValidator,
  editMessageValidator,
  listMessagesValidator,
} from '#validators/message_validator'
import type { IMessageService } from '#services/interfaces/i_message_service'
import type User from '#models/user'

/*
|--------------------------------------------------------------------------
| MessageController
|--------------------------------------------------------------------------
|
| Thin HTTP layer ONLY.
| Depends on IMessageService interface (Dependency Inversion).
|
*/
export default class MessageController {
  constructor(private readonly messageService: IMessageService) {}

  /*
  |--------------------------------------------------------------------------
  | Helper — get authenticated user
  |--------------------------------------------------------------------------
  */
  private getAuthUser(ctx: HttpContext): User {
    const user = (ctx as any).authUser
    if (!user) throw new Error('User not authenticated')
    return user
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/conversations/:id/messages
  |--------------------------------------------------------------------------
  */
  async send(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const conversationId = ctx.params.id
    const data = await ctx.request.validateUsing(sendMessageValidator)

    const result = await this.messageService.send(
      {
        conversationId,
        content: data.content,
        type: data.type,
        parentId: data.parentId,
      },
      user.id
    )

    return ctx.response.created({
      message: 'Message sent successfully',
      data: result,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/conversations/:id/messages
  |--------------------------------------------------------------------------
  */
  async list(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const conversationId = ctx.params.id
    const query = await ctx.request.validateUsing(listMessagesValidator)

    const result = await this.messageService.list(conversationId, user.id, {
      page: query.page,
      limit: query.limit,
      before: query.before,
    })

    return ctx.response.ok(result)
  }

  /*
  |--------------------------------------------------------------------------
  | PATCH /api/v1/conversations/:id/messages/:messageId
  |--------------------------------------------------------------------------
  */
  async edit(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const messageId = ctx.params.messageId
    const { content } = await ctx.request.validateUsing(editMessageValidator)

    const result = await this.messageService.edit(messageId, content, user.id)

    return ctx.response.ok({
      message: 'Message updated successfully',
      data: result,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE /api/v1/conversations/:id/messages/:messageId
  |--------------------------------------------------------------------------
  */
  async destroy(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const messageId = ctx.params.messageId

    await this.messageService.delete(messageId, user.id)

    return ctx.response.ok({
      message: 'Message deleted successfully',
    })
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/conversations/:id/messages/:messageId/read
  |--------------------------------------------------------------------------
  */
  async markRead(ctx: HttpContext) {
    const user = this.getAuthUser(ctx)
    const conversationId = ctx.params.id

    await this.messageService.markAsRead(conversationId, user.id)

    return ctx.response.ok({
      message: 'Messages marked as read',
    })
  }
}
