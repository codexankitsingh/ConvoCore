import vine from '@vinejs/vine'

/*
|--------------------------------------------------------------------------
| Auth Validators
|--------------------------------------------------------------------------
| VineJS schemas validate request bodies BEFORE they reach controllers.
| Invalid requests are rejected with 422 Unprocessable Entity.
*/

/** POST /api/v1/auth/register */
export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8).maxLength(64),
  })
)

/** POST /api/v1/auth/login */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(1),
  })
)

/** POST /api/v1/auth/refresh */
export const refreshTokenValidator = vine.compile(
  vine.object({
    refreshToken: vine.string().minLength(1),
  })
)
