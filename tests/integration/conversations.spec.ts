import { test } from '@japa/runner'
import { TestHelper } from '../helpers/test_helper.js'

/*
|--------------------------------------------------------------------------
| Conversations Integration Tests
|--------------------------------------------------------------------------
*/
test.group('Conversations — Create', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('creates a direct conversation', async ({ client, assert }) => {
    const { token: tokenA, userId: userAId } =
      await TestHelper.registerUser(client, {
        name: 'User A',
        email: 'usera@example.com',
        password: 'password123',
      })
    const { userId: userBId } = await TestHelper.registerUser(client, {
      name: 'User B',
      email: 'userb@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/api/v1/conversations')
      .header('Authorization', `Bearer ${tokenA}`)
      .json({ type: 'direct', participantIds: [userBId] })

    response.assertStatus(201)
    assert.equal(response.body().data.type, 'direct')
    assert.equal(response.body().data.participants.length, 2)
  })

  test('creates a group conversation', async ({ client, assert }) => {
    const { token, userId } = await TestHelper.registerUser(client, {
      name: 'Group Creator',
      email: 'creator@example.com',
      password: 'password123',
    })
    const { userId: memberId } = await TestHelper.registerUser(client, {
      name: 'Member',
      email: 'member@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/api/v1/conversations')
      .header('Authorization', `Bearer ${token}`)
      .json({
        type: 'group',
        name: 'Test Group',
        participantIds: [memberId],
      })

    response.assertStatus(201)
    assert.equal(response.body().data.type, 'group')
    assert.equal(response.body().data.name, 'Test Group')
    assert.equal(response.body().data.participants.length, 2)
  })

  test('returns existing direct conversation if already exists',
    async ({ client, assert }) => {
      const { token: tokenA, userId: userAId } =
        await TestHelper.registerUser(client, {
          name: 'User A',
          email: 'usera@example.com',
          password: 'password123',
        })
      const { userId: userBId } = await TestHelper.registerUser(client, {
        name: 'User B',
        email: 'userb@example.com',
        password: 'password123',
      })

      const first = await client
        .post('/api/v1/conversations')
        .header('Authorization', `Bearer ${tokenA}`)
        .json({ type: 'direct', participantIds: [userBId] })

      const second = await client
        .post('/api/v1/conversations')
        .header('Authorization', `Bearer ${tokenA}`)
        .json({ type: 'direct', participantIds: [userBId] })

      assert.equal(
        first.body().data.id,
        second.body().data.id
      )
    }
  )

  test('fails without auth', async ({ client }) => {
    const response = await client
      .post('/api/v1/conversations')
      .json({ type: 'direct', participantIds: ['some-id'] })

    response.assertStatus(401)
  })
})

test.group('Conversations — List & Show', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('lists user conversations', async ({ client, assert }) => {
    const { token: tokenA, userId: userAId } =
      await TestHelper.registerUser(client, {
        name: 'User A',
        email: 'usera@example.com',
        password: 'password123',
      })
    const { userId: userBId } = await TestHelper.registerUser(client, {
      name: 'User B',
      email: 'userb@example.com',
      password: 'password123',
    })

    await TestHelper.createDirectConversation(client, tokenA, userBId)

    const response = await client
      .get('/api/v1/conversations')
      .header('Authorization', `Bearer ${tokenA}`)

    response.assertStatus(200)
    assert.isArray(response.body().data)
    assert.isAbove(response.body().data.length, 0)
  })

  test('shows a specific conversation', async ({ client, assert }) => {
    const { token: tokenA, userId: userAId } =
      await TestHelper.registerUser(client, {
        name: 'User A',
        email: 'usera@example.com',
        password: 'password123',
      })
    const { userId: userBId } = await TestHelper.registerUser(client, {
      name: 'User B',
      email: 'userb@example.com',
      password: 'password123',
    })

    const convId = await TestHelper.createDirectConversation(
      client, tokenA, userBId
    )

    const response = await client
      .get(`/api/v1/conversations/${convId}`)
      .header('Authorization', `Bearer ${tokenA}`)

    response.assertStatus(200)
    assert.equal(response.body().data.id, convId)
  })

  test('returns 403 for non-participant', async ({ client }) => {
    const { token: tokenA, userId: userAId } =
      await TestHelper.registerUser(client, {
        name: 'User A',
        email: 'usera@example.com',
        password: 'password123',
      })
    const { userId: userBId } =
      await TestHelper.registerUser(client, {
        name: 'User B',
        email: 'userb@example.com',
        password: 'password123',
      })
    const { token: tokenC } =
      await TestHelper.registerUser(client, {
        name: 'User C',
        email: 'userc@example.com',
        password: 'password123',
      })

    const convId = await TestHelper.createDirectConversation(
      client, tokenA, userBId
    )

    const response = await client
      .get(`/api/v1/conversations/${convId}`)
      .header('Authorization', `Bearer ${tokenC}`)

    response.assertStatus(403)
  })

  test('returns 404 for non-existent conversation',
    async ({ client }) => {
      const { token } = await TestHelper.registerUser(client, {
        name: 'User',
        email: 'user@example.com',
        password: 'password123',
      })

      const response = await client
        .get('/api/v1/conversations/00000000-0000-0000-0000-000000000000')
        .header('Authorization', `Bearer ${token}`)

      response.assertStatus(404)
    }
  )
})

test.group('Conversations — Participants', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('adds participant to group conversation',
    async ({ client, assert }) => {
      const { token, userId } = await TestHelper.registerUser(client, {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
      })
      const { userId: memberId } = await TestHelper.registerUser(client, {
        name: 'Member',
        email: 'member@example.com',
        password: 'password123',
      })
      const { userId: newMemberId } =
        await TestHelper.registerUser(client, {
          name: 'New Member',
          email: 'newmember@example.com',
          password: 'password123',
        })

      const convId = await TestHelper.createGroupConversation(
        client, token, 'Test Group', [memberId]
      )

      const response = await client
        .post(`/api/v1/conversations/${convId}/participants`)
        .header('Authorization', `Bearer ${token}`)
        .json({ userId: newMemberId })

      response.assertStatus(200)
    }
  )

  test('removes participant from group conversation',
    async ({ client, assert }) => {
      const { token, userId } = await TestHelper.registerUser(client, {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
      })
      const { userId: memberId } = await TestHelper.registerUser(client, {
        name: 'Member',
        email: 'member@example.com',
        password: 'password123',
      })

      const convId = await TestHelper.createGroupConversation(
        client, token, 'Test Group', [memberId]
      )

      const response = await client
        .delete(
          `/api/v1/conversations/${convId}/participants/${memberId}`
        )
        .header('Authorization', `Bearer ${token}`)

      response.assertStatus(200)
    }
  )
})
