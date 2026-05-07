import { test } from '@japa/runner'
import { TestHelper } from '../helpers/test_helper.js'

/*
|--------------------------------------------------------------------------
| Auth Integration Tests
|--------------------------------------------------------------------------
*/
test.group('Auth — Register', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('registers a new user successfully', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .json({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })

    response.assertStatus(201)
    assert.equal(response.body().data.user.email, 'test@example.com')
    assert.equal(response.body().data.user.name, 'Test User')
    assert.exists(response.body().data.tokens.accessToken)
    assert.exists(response.body().data.tokens.refreshToken)
  })

  test('fails with duplicate email', async ({ client, assert }) => {
    await TestHelper.registerUser(client, {
      name: 'User One',
      email: 'dupe@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/api/v1/auth/register')
      .json({
        name: 'User Two',
        email: 'dupe@example.com',
        password: 'password123',
      })

    response.assertStatus(409)
    assert.equal(response.body().code, 'E_EMAIL_TAKEN')
  })

  test('fails with missing fields', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .json({ name: 'No Email' })

    response.assertStatus(422)
    assert.equal(response.body().code, 'E_VALIDATION_ERROR')
  })

  test('fails with invalid email format', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .json({
        name: 'Bad Email',
        email: 'not-an-email',
        password: 'password123',
      })

    response.assertStatus(422)
  })

  test('fails with short password', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/register')
      .json({
        name: 'Short Pass',
        email: 'short@example.com',
        password: '123',
      })

    response.assertStatus(422)
  })
})

test.group('Auth — Login', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('logs in with correct credentials', async ({ client, assert }) => {
    await TestHelper.registerUser(client, {
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/api/v1/auth/login')
      .json({
        email: 'login@example.com',
        password: 'password123',
      })

    response.assertStatus(200)
    assert.exists(response.body().data.tokens.accessToken)
    assert.exists(response.body().data.tokens.refreshToken)
    assert.equal(response.body().data.user.email, 'login@example.com')
  })

  test('fails with wrong password', async ({ client, assert }) => {
    await TestHelper.registerUser(client, {
      name: 'Wrong Pass',
      email: 'wrongpass@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/api/v1/auth/login')
      .json({
        email: 'wrongpass@example.com',
        password: 'wrongpassword',
      })

    response.assertStatus(401)
    assert.equal(response.body().code, 'E_INVALID_CREDENTIALS')
  })

  test('fails with non-existent email', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/login')
      .json({
        email: 'nobody@example.com',
        password: 'password123',
      })

    response.assertStatus(401)
  })
})

test.group('Auth — Me', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('returns current user with valid token', async ({ client, assert }) => {
    const { token, userId } = await TestHelper.registerUser(client, {
      name: 'Me User',
      email: 'me@example.com',
      password: 'password123',
    })

    const response = await client
      .get('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.equal(response.body().data.id, userId)
    assert.equal(response.body().data.email, 'me@example.com')
  })

  test('returns 401 without token', async ({ client }) => {
    const response = await client.get('/api/v1/auth/me')
    response.assertStatus(401)
  })

  test('returns 401 with invalid token', async ({ client }) => {
    const response = await client
      .get('/api/v1/auth/me')
      .header('Authorization', 'Bearer invalid.token.here')
    response.assertStatus(401)
  })
})

test.group('Auth — Logout', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('logs out successfully', async ({ client, assert }) => {
    const { token } = await TestHelper.registerUser(client, {
      name: 'Logout User',
      email: 'logout@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/api/v1/auth/logout')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    assert.equal(response.body().message, 'Logged out successfully')
  })

  test('token is invalid after logout', async ({ client }) => {
    const { token } = await TestHelper.registerUser(client, {
      name: 'Post Logout',
      email: 'postlogout@example.com',
      password: 'password123',
    })

    await client
      .post('/api/v1/auth/logout')
      .header('Authorization', `Bearer ${token}`)

    const response = await client
      .get('/api/v1/auth/me')
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(401)
  })
})

test.group('Auth — Guest', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('creates guest user successfully', async ({ client, assert }) => {
    const response = await client
      .post('/api/v1/auth/guest')
      .json({ name: 'Guest Tester' })

    response.assertStatus(201)
    assert.equal(response.body().data.user.isGuest, true)
    assert.exists(response.body().data.tokens.accessToken)
  })
})
