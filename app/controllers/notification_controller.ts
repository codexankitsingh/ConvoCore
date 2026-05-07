import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import type NotificationService from '#services/notification_service'

/*
|--------------------------------------------------------------------------
| NotificationController
|--------------------------------------------------------------------------
*/
export default class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/notifications
  |--------------------------------------------------------------------------
  */
  async index(ctx: HttpContext) {
    const user = (ctx as any).authUser

    const schema = vine.compile(
      vine.object({
        page: vine.number().min(1).optional(),
        limit: vine.number().min(1).max(50).optional(),
        isRead: vine.boolean().optional(),
      })
    )

    const params = await ctx.request.validateUsing(schema)

    const result = await this.notificationService.list(user.id, {
      page: params.page,
      limit: params.limit,
      isRead: params.isRead,
    })

    return ctx.response.ok(result)
  }

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/notifications/unread-count
  |--------------------------------------------------------------------------
  */
  async unreadCount(ctx: HttpContext) {
    const user = (ctx as any).authUser

    const count = await this.notificationService.getUnreadCount(user.id)

    return ctx.response.ok({
      data: { unreadCount: count },
    })
  }

  /*
  |--------------------------------------------------------------------------
  | PATCH /api/v1/notifications/:id/read
  |--------------------------------------------------------------------------
  */
  async markRead(ctx: HttpContext) {
    const user = (ctx as any).authUser
    const id = ctx.params.id

    const notification = await this.notificationService.markAsRead(id, user.id)

    return ctx.response.ok({
      message: 'Notification marked as read',
      data: notification,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | PATCH /api/v1/notifications/read-all
  |--------------------------------------------------------------------------
  */
  async markAllRead(ctx: HttpContext) {
    const user = (ctx as any).authUser

    const count = await this.notificationService.markAllAsRead(user.id)

    return ctx.response.ok({
      message: `${count} notifications marked as read`,
      data: { count },
    })
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE /api/v1/notifications/:id
  |--------------------------------------------------------------------------
  */
  async destroy(ctx: HttpContext) {
    const user = (ctx as any).authUser
    const id = ctx.params.id

    await this.notificationService.delete(id, user.id)

    return ctx.response.ok({
      message: 'Notification deleted',
      data: { id },
    })
  }
}
