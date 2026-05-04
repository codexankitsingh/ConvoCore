import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import ConversationRepository from '#repositories/conversation_repository'

/*
|--------------------------------------------------------------------------
| ConversationAccess Middleware
|--------------------------------------------------------------------------
|
| Verifies the authenticated user is a participant
| in the requested conversation before allowing access.
|
| Applied on routes that have :id param for conversations.
|
*/
export default class ConversationAccessMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = (ctx as any).authUser

    if (!user) {
      return ctx.response.unauthorized({
        message: 'Access token is required',
        code: 'E_UNAUTHORIZED',
      })
    }

    const conversationId = ctx.params.id

    if (!conversationId) {
      return ctx.response.badRequest({
        message: 'Conversation ID is required',
        code: 'E_BAD_REQUEST',
      })
    }

    const conversationRepository = new ConversationRepository()

    // Check conversation exists
    const conversation = await conversationRepository.findById(conversationId)

    if (!conversation) {
      return ctx.response.notFound({
        message: 'Conversation not found',
        code: 'E_CONVERSATION_NOT_FOUND',
      })
    }

    // Check user is a participant
    const isParticipant = await conversationRepository.isParticipant(conversationId, user.id)

    if (!isParticipant) {
      return ctx.response.forbidden({
        message: 'You are not a participant in this conversation',
        code: 'E_NOT_PARTICIPANT',
      })
    }

    // Attach conversation to context for downstream use
    ;(ctx as any).conversation = conversation

    await next()
  }
}
