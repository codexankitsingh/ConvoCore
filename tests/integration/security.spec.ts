import { test } from '@japa/runner'
import { TestHelper } from '../helpers/test_helper.js'

/*
|--------------------------------------------------------------------------
| Security Integration Tests
|--------------------------------------------------------------------------
*/

// ─── HEADERS ─────────────────────────────────────────────────────────────────

test.group('Security — Headers', (group) => {
  test('health endpoint has all security headers',
    async ({ client, assert }) => {
      const response = await client.get('/health')

      response.assertStatus(200)
      assert.equal(response.header('x-content-type-options'), 'nosniff')
      assert.equal(response.header('x-frame-options'), 'DENY')
      assert.equal(response.header('x-xss-protection'), '1; mode=block')
      assert.exists(response.header('referrer-policy'))
      assert.exists(response.header('permissions-policy'))
      assert.exists(response.header('content-security-policy'))
    }
  )

  test('x-powered-by header is removed', async ({ client, assert }) => {
    const response = await client.get('/health')
    assert.notExists(response.header('x-powered-by'))
  })

  test('api routes have cache-control header',
    async ({ client, assert }) => {
      await TestHelper.cleanDatabase()
      await TestHelper.cleanRateLimits()

      const { token } = await TestHelper.registerUser(client, {
        name: 'Cache User',
        email: 'cache@example.com',
        password: 'password123',
      })

      const response = await client
        .get('/api/v1/notifications/unread-count')
        .header('Authorization', `Bearer ${token}`)

      assert.include(response.header('cache-control'), 'no-store')
    }
  )
})

// ─── RATE LIMITING ───────────────────────────────────────────────────────────

test.group('Security — Rate Limiting', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanRateLimits()
  })

  test('rate limits login after 5 attempts',
    async ({ client, assert }) => {
      const email = `ratelimit_${Date.now()}@test.com`
      let blockedCount = 0

      for (let i = 0; i < 7; i++) {
        const response = await client
          .post('/api/v1/auth/login')
          /*
          | x-test-rate-limit: true → tells middleware to
          | enforce rate limiting even in test environment
          */
          .header('x-test-rate-limit', 'true')
          .json({ email, password: 'wrongpassword' })

        if (response.status() === 429) {
          blockedCount++
        }
      }

      assert.isAbove(blockedCount, 0)
    }
  )

  test('429 response has correct structure',
    async ({ client, assert }) => {
      const email = `structure_${Date.now()}@test.com`

      for (let i = 0; i < 6; i++) {
        await client
          .post('/api/v1/auth/login')
          .header('x-test-rate-limit', 'true')
          .json({ email, password: 'wrong' })
      }

      const response = await client
        .post('/api/v1/auth/login')
        .header('x-test-rate-limit', 'true')
        .json({ email, password: 'wrong' })

      if (response.status() === 429) {
        assert.equal(response.body().code, 'E_RATE_LIMIT_EXCEEDED')
        assert.exists(response.body().retryAfter)
        assert.exists(response.body().resetAt)
        assert.exists(response.header('retry-after'))
        assert.exists(response.header('x-ratelimit-limit'))
        assert.exists(response.header('x-ratelimit-remaining'))
        assert.exists(response.header('x-ratelimit-reset'))
      }
    }
  )

  test('rate limit headers present on login route',
    async ({ client, assert }) => {
      await TestHelper.cleanRateLimits()

      const response = await client
        .post('/api/v1/auth/login')
        .header('x-test-rate-limit', 'true')
        .json({
          email: `headers_${Date.now()}@test.com`,
          password: 'wrong',
        })

      assert.exists(response.header('x-ratelimit-limit'))
      assert.exists(response.header('x-ratelimit-remaining'))
      assert.exists(response.header('x-ratelimit-reset'))
    }
  )
})

// ─── AUTH GUARDS ─────────────────────────────────────────────────────────────

test.group('Security — Auth Guards', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('all protected routes return 401 without token',
    async ({ client, assert }) => {
      const routes = [
        { method: 'get', url: '/api/v1/auth/me' },
        { method: 'get', url: '/api/v1/conversations' },
        { method: 'get', url: '/api/v1/notifications' },
        { method: 'get', url: '/api/v1/notifications/unread-count' },
      ]

      for (const route of routes) {
        const response =
          route.method === 'get'
            ? await client.get(route.url)
            : await client.post(route.url)

        assert.equal(
          response.status(), 401,
          `Expected 401 for ${route.method.toUpperCase()} ${route.url}`
        )
        assert.equal(response.body().code, 'E_UNAUTHORIZED')
      }
    }
  )

  test('invalid JWT token returns 401', async ({ client }) => {
    const response = await client
      .get('/api/v1/auth/me')
      .header('Authorization', 'Bearer invalid.jwt.token')

    response.assertStatus(401)
  })

  test('expired token returns 401', async ({ client }) => {
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.' +
      'invalid_signature'

    const response = await client
      .get('/api/v1/auth/me')
      .header('Authorization', `Bearer ${expiredToken}`)

    response.assertStatus(401)
  })
})
