import vine from '@vinejs/vine'

/*
|--------------------------------------------------------------------------
| Presence Validators
|--------------------------------------------------------------------------
*/

/** POST /api/v1/presence/typing */
export const typingValidator = vine.compile(
  vine.object({
    conversationId: vine.string().uuid(),
    isTyping: vine.boolean(),
  })
)

/** GET /api/v1/presence/:conversationId */
export const presenceQueryValidator = vine.compile(
  vine.object({
    conversationId: vine.string().uuid(),
  })
)
