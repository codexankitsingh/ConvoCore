import vine from '@vinejs/vine'

/*
|--------------------------------------------------------------------------
| Message Validators
|--------------------------------------------------------------------------
*/

/** POST /api/v1/conversations/:id/messages */
export const sendMessageValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(5000),
    type: vine.enum(['text', 'image', 'file'] as const).optional(),
    parentId: vine.string().uuid().optional(),
  })
)

/** PATCH /api/v1/conversations/:id/messages/:messageId */
export const editMessageValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(5000),
  })
)

/** GET /api/v1/conversations/:id/messages */
export const listMessagesValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    before: vine.string().uuid().optional(),
  })
)
