import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/*
|--------------------------------------------------------------------------
| SecurityHeadersMiddleware
|--------------------------------------------------------------------------
*/
export default class SecurityHeadersMiddleware {
  async handle(ctx: HttpContext, next: NextFn): Promise<void> {
    await next()

    const res = ctx.response

    // ── Prevent MIME type sniffing ──────────────────────────────────
    res.header('X-Content-Type-Options', 'nosniff')

    // ── Prevent clickjacking ────────────────────────────────────────
    res.header('X-Frame-Options', 'DENY')

    // ── XSS Protection (legacy browsers) ───────────────────────────
    res.header('X-XSS-Protection', '1; mode=block')

    // ── Remove server fingerprint completely ────────────────────────
    res.response.removeHeader('X-Powered-By')

    // ── Referrer Policy ─────────────────────────────────────────────
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin')

    // ── Permissions Policy ──────────────────────────────────────────
    res.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')

    // ── Content Security Policy ─────────────────────────────────────
    res.header(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    )

    // ── HSTS (only in production) ───────────────────────────────────
    if (process.env.NODE_ENV === 'production') {
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    // ── Cache Control for API responses ────────────────────────────
    if (ctx.request.url().startsWith('/api/')) {
      res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.header('Pragma', 'no-cache')
      res.header('Expires', '0')
    }
  }
}
