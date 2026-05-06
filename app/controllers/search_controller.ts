import type { HttpContext } from '@adonisjs/core/http'
import {
  searchMessagesValidator,
  searchConversationsValidator,
  globalSearchValidator,
} from '#validators/search_validator'
import type SearchService from '#services/search_service'

/*
|--------------------------------------------------------------------------
| SearchController
|--------------------------------------------------------------------------
*/
export default class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/search/messages
  |--------------------------------------------------------------------------
  */
  async messages(ctx: HttpContext) {
    const user = (ctx as any).authUser

    const params = await ctx.request.validateUsing(searchMessagesValidator)

    const result = await this.searchService.searchMessages(user.id, {
      q: params.q,
      conversationId: params.conversationId,
      type: params.type,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page: params.page,
      limit: params.limit,
    })

    return ctx.response.ok(result)
  }

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/search/conversations
  |--------------------------------------------------------------------------
  */
  async conversations(ctx: HttpContext) {
    const user = (ctx as any).authUser

    const params = await ctx.request.validateUsing(searchConversationsValidator)

    const result = await this.searchService.searchConversations(user.id, {
      q: params.q,
      type: params.type,
      page: params.page,
      limit: params.limit,
    })

    return ctx.response.ok(result)
  }

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/search
  |--------------------------------------------------------------------------
  */
  async global(ctx: HttpContext) {
    const user = (ctx as any).authUser

    const params = await ctx.request.validateUsing(globalSearchValidator)

    const result = await this.searchService.globalSearch(user.id, {
      q: params.q,
      page: params.page,
      limit: params.limit,
    })

    return ctx.response.ok(result)
  }
}
