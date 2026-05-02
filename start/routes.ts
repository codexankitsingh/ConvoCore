/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| All API routes versioned under /api/v1
| Routes are added phase by phase as modules are built.
|
*/
import router from '@adonisjs/core/services/router'

/*
|--------------------------------------------------------------------------
| Health Check
| Used by Docker healthcheck + monitoring tools
|--------------------------------------------------------------------------
*/
router.get('/health', async ({ response }) => {
  return response.ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'convocore-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  })
})

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    // ── Phase 2: Auth ──────────────────────────────────────────────────
    // router.group(() => { ... }).prefix('/auth')
    // ── Phase 3: Conversations ─────────────────────────────────────────
    // router.group(() => { ... }).prefix('/conversations')
    // ── Phase 4: Messages ──────────────────────────────────────────────
    // ── Phase 5: Real-time ─────────────────────────────────────────────
    // ── Phase 6: Reactions ─────────────────────────────────────────────
  })
  .prefix('/api/v1')
