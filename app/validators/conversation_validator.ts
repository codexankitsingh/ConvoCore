import vine from '@vinejs/vine'

/*
|--------------------------------------------------------------------------
| Conversation Validators
|--------------------------------------------------------------------------
*/

/** POST /api/v1/conversations */
export const createConversationValidator = vine.compile(
  vine.object({
    type: vine.enum(['direct', 'group'] as const),
    name: vine.string().trim().minLength(2).maxLength(100).optional(),
    participantIds: vine.array(vine.string().uuid()).minLength(1),
  })
)

/** POST /api/v1/conversations/:id/participants */
export const addParticipantValidator = vine.compile(
  vine.object({
    userId: vine.string().uuid(),
  })
)
