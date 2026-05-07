import { test } from '@japa/runner'
import { TestHelper } from '../helpers/test_helper.js'

/*
|--------------------------------------------------------------------------
| Messages Integration Tests
|--------------------------------------------------------------------------
*/

// ─── SEND ────────────────────────────────────────────────────────────────────

test.group('Messages — Send', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('sends a message successfully', async ({ client, assert }) => {
    const { token: tokenA, userId: userAId } =
      await TestHelper.registerUser(client, {
        name: 'Sender',
        email: 'sender@example.com',
        password: 'password123',
      })
    const { userId: userBId } = await TestHelper.registerUser(client, {
      name: 'Receiver',
      email: 'receiver@example.com',
      password: 'password123',
    })
    const convId = await TestHelper.createDirectConversation(
      client, tokenA, userBId
    )

    const response = await client
      .post(`/api/v1/conversations/${convId}/messages`)
      .header('Authorization', `Bearer ${tokenA}`)
      .json({ content: 'Hello World!' })

    response.assertStatus(201)
    assert.equal(response.body().data.content, 'Hello World!')
    assert.equal(response.body().data.senderId, userAId)
    assert.equal(response.body().data.type, 'text')
    assert.exists(response.body().data.sender)
  })

  test('fails with empty content', async ({ client }) => {
    const { token: tokenA } = await TestHelper.registerUser(client, {
      name: 'Sender',
      email: 'sender@example.com',
      password: 'password123',
    })
    const { userId: userBId } = await TestHelper.registerUser(client, {
      name: 'Receiver',
      email: 'receiver@example.com',
      password: 'password123',
    })
    const convId = await TestHelper.createDirectConversation(
      client, tokenA, userBId
    )

    const response = await client
      .post(`/api/v1/conversations/${convId}/messages`)
      .header('Authorization', `Bearer ${tokenA}`)
      .json({ content: '' })

    response.assertStatus(422)
  })

  test('fails for non-participant', async ({ client }) => {
    const { token: tokenA } = await TestHelper.registerUser(client, {
      name: 'User A',
      email: 'usera@example.com',
      password: 'password123',
    })
    const { userId: userBId } = await TestHelper.registerUser(client, {
      name: 'User B',
      email: 'userb@example.com',
      password: 'password123',
    })
    const { token: tokenC } = await TestHelper.registerUser(client, {
      name: 'User C',
      email: 'userc@example.com',
      password: 'password123',
    })
    const convId = await TestHelper.createDirectConversation(
      client, tokenA, userBId
    )

    const response = await client
      .post(`/api/v1/conversations/${convId}/messages`)
      .header('Authorization', `Bearer ${tokenC}`)
      .json({ content: 'Sneaky message' })

    response.assertStatus(403)
  })
})

// ─── LIST ────────────────────────────────────────────────────────────────────

test.group('Messages — List', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('lists messages with pagination', async ({ client, assert }) => {
    const { token: tokenA } = await TestHelper.registerUser(client, {
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

    await TestHelper.sendMessage(client, tokenA, convId, 'Message 1')
    await TestHelper.sendMessage(client, tokenA, convId, 'Message 2')
    await TestHelper.sendMessage(client, tokenA, convId, 'Message 3')

    const response = await client
      .get(`/api/v1/conversations/${convId}/messages`)
      .header('Authorization', `Bearer ${tokenA}`)

    response.assertStatus(200)
    assert.isArray(response.body().data)
    assert.equal(response.body().data.length, 3)
    assert.exists(response.body().meta)
  })

  test('paginates messages correctly', async ({ client, assert }) => {
    const { token: tokenA } = await TestHelper.registerUser(client, {
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

    for (let i = 1; i <= 5; i++) {
      await TestHelper.sendMessage(client, tokenA, convId, `Message ${i}`)
    }

    const response = await client
      .get(`/api/v1/conversations/${convId}/messages?page=1&limit=2`)
      .header('Authorization', `Bearer ${tokenA}`)

    response.assertStatus(200)
    assert.equal(response.body().data.length, 2)
    assert.equal(response.body().meta.limit, 2)
  })
})

// ─── EDIT ────────────────────────────────────────────────────────────────────

test.group('Messages — Edit', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('edits own message successfully', async ({ client, assert }) => {
    const { token: tokenA } = await TestHelper.registerUser(client, {
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
    const msgId = await TestHelper.sendMessage(
      client, tokenA, convId, 'Original content'
    )

    const response = await client
      .patch(`/api/v1/conversations/${convId}/messages/${msgId}`)
      .header('Authorization', `Bearer ${tokenA}`)
      .json({ content: 'Edited content' })

    response.assertStatus(200)
    assert.equal(response.body().data.content, 'Edited content')
    assert.equal(response.body().data.isEdited, true)
  })

  test('cannot edit another users message', async ({ client }) => {
    const { token: tokenA } = await TestHelper.registerUser(client, {
      name: 'User A',
      email: 'usera@example.com',
      password: 'password123',
    })
    const { token: tokenB, userId: userBId } =
      await TestHelper.registerUser(client, {
        name: 'User B',
        email: 'userb@example.com',
        password: 'password123',
      })
    const convId = await TestHelper.createDirectConversation(
      client, tokenA, userBId
    )
    const msgId = await TestHelper.sendMessage(
      client, tokenA, convId, 'User A message'
    )

    const response = await client
      .patch(`/api/v1/conversations/${convId}/messages/${msgId}`)
      .header('Authorization', `Bearer ${tokenB}`)
      .json({ content: 'Hacked content' })

    response.assertStatus(403)
  })
})

// ─── DELETE ──────────────────────────────────────────────────────────────────

test.group('Messages — Delete', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('deletes own message successfully', async ({ client, assert }) => {
    const { token: tokenA } = await TestHelper.registerUser(client, {
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
    const msgId = await TestHelper.sendMessage(
      client, tokenA, convId, 'To be deleted'
    )

    const response = await client
      .delete(`/api/v1/conversations/${convId}/messages/${msgId}`)
      .header('Authorization', `Bearer ${tokenA}`)

    response.assertStatus(200)
    assert.equal(response.body().message, 'Message deleted successfully')
  })

  test('cannot delete another users message', async ({ client }) => {
    const { token: tokenA } = await TestHelper.registerUser(client, {
      name: 'User A',
      email: 'usera@example.com',
      password: 'password123',
    })
    const { token: tokenB, userId: userBId } =
      await TestHelper.registerUser(client, {
        name: 'User B',
        email: 'userb@example.com',
        password: 'password123',
      })
    const convId = await TestHelper.createDirectConversation(
      client, tokenA, userBId
    )
    const msgId = await TestHelper.sendMessage(
      client, tokenA, convId, 'User A message'
    )

    const response = await client
      .delete(`/api/v1/conversations/${convId}/messages/${msgId}`)
      .header('Authorization', `Bearer ${tokenB}`)

    response.assertStatus(403)
  })
})

// ─── MARK READ ───────────────────────────────────────────────────────────────

test.group('Messages — Mark Read', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('marks messages as read', async ({ client, assert }) => {
    const { token: tokenA } = await TestHelper.registerUser(client, {
      name: 'User A',
      email: 'usera@example.com',
      password: 'password123',
    })
    const { token: tokenB, userId: userBId } =
      await TestHelper.registerUser(client, {
        name: 'User B',
        email: 'userb@example.com',
        password: 'password123',
      })
    const convId = await TestHelper.createDirectConversation(
      client, tokenA, userBId
    )
    await TestHelper.sendMessage(client, tokenA, convId, 'Read me')

    const response = await client
      .post(`/api/v1/conversations/${convId}/messages/read`)
      .header('Authorization', `Bearer ${tokenB}`)

    response.assertStatus(200)
    assert.equal(response.body().message, 'Messages marked as read')
  })
})
