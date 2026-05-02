import { ExceptionHandler, HttpContext } from '@adonisjs/core/http'
import { errors as vineErrors } from '@vinejs/vine'
import app from '@adonisjs/core/services/app'

/*
|--------------------------------------------------------------------------
| Global Exception Handler
|--------------------------------------------------------------------------
|
| Converts ALL exceptions to consistent JSON responses.
| No stack traces leak in production.
|
*/
export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    const { response } = ctx

    // ── VineJS Validation Errors (422) ──────────────────────────────
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return response.unprocessableEntity({
        message: 'Validation failed',
        code: 'E_VALIDATION_ERROR',
        errors: error.messages,
      })
    }

    // ── Custom App Exceptions (with status code) ─────────────────────
    if (error instanceof Error && 'status' in error) {
      const appError = error as Error & { status: number; code?: string }
      return response.status(appError.status).send({
        message: appError.message,
        code: appError.code ?? 'E_APP_ERROR',
      })
    }

    // ── Fallback — delegate to AdonisJS default handler ──────────────
    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
