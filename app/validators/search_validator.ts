import vine from '@vinejs/vine'

/*
|--------------------------------------------------------------------------
| Search Validators
|--------------------------------------------------------------------------
*/

/** GET /api/v1/search/messages */
export const searchMessagesValidator = vine.compile(
  vine.object({
    q: vine.string().minLength(1).maxLength(200).trim(),
    conversationId: vine.string().uuid().optional(),
    type: vine.enum(['text', 'image', 'file', 'system']).optional(),
    dateFrom: vine.string().optional(),
    dateTo: vine.string().optional(),
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(50).optional(),
  })
)

/** GET /api/v1/search/conversations */
export const searchConversationsValidator = vine.compile(
  vine.object({
    q: vine.string().minLength(1).maxLength(200).trim(),
    type: vine.enum(['direct', 'group']).optional(),
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(50).optional(),
  })
)

/** GET /api/v1/search (global) */
export const globalSearchValidator = vine.compile(
  vine.object({
    q: vine.string().minLength(1).maxLength(200).trim(),
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(50).optional(),
  })
)
