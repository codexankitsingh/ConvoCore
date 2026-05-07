import { test } from '@japa/runner'
import { TestHelper } from '../helpers/test_helper.js'

/*
|--------------------------------------------------------------------------
| Notifications Integration Tests
|--------------------------------------------------------------------------
*/
test.group('Notifications — List', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('lists notifications for authenticated user',
    async ({ client, assert }) => {
      const { token: tokenA, userId: userAId } =
        await TestHelper.registerUser(client, {
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
      await TestHelper.sendMessage(
        client, tokenA, convId, 'Trigger notification'
      )

      const response = await client
        .get('/api/v1/notifications')
        .header('Authorization', `Bearer ${tokenB}`)

      response.assertStatus(200)
      assert.isArray(response.body().data)
      assert.isAbove(response.body().data.length, 0)
      assert.exists(response.body().meta)
      assert.equal(
        response.body().data[0].type, 'message:new'
      )
    }
  )

  test('returns empty list when no notifications',
    async ({ client, assert }) => {
      const { token } = await TestHelper.registerUser(client, {
        name: 'Fresh User',
        email: 'fresh@example.com',
        password: 'password123',
      })

      const response = await client
        .get('/api/v1/notifications')
        .header('Authorization', `Bearer ${token}`)

      response.assertStatus(200)
      assert.equal(response.body().data.length, 0)
      assert.equal(response.body().meta.total, 0)
    }
  )

  test('returns 401 without token', async ({ client }) => {
    const response = await client.get('/api/v1/notifications')
    response.assertStatus(401)
  })
})

test.group('Notifications — Unread Count', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('returns correct unread count', async ({ client, assert }) => {
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
    await TestHelper.sendMessage(client, tokenA, convId, 'Msg 1')
    await TestHelper.sendMessage(client, tokenA, convId, 'Msg 2')

    const response = await client
      .get('/api/v1/notifications/unread-count')
      .header('Authorization', `Bearer ${tokenB}`)

    response.assertStatus(200)
    assert.equal(response.body().data.unreadCount, 2)
  })

  test('returns 0 when no unread notifications',
    async ({ client, assert }) => {
      const { token } = await TestHelper.registerUser(client, {
        name: 'User',
        email: 'user@example.com',
        password: 'password123',
      })

      const response = await client
        .get('/api/v1/notifications/unread-count')
        .header('Authorization', `Bearer ${token}`)

      response.assertStatus(200)
      assert.equal(response.body().data.unreadCount, 0)
    }
  )
})

test.group('Notifications — Mark Read', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('marks single notification as read', async ({ client, assert }) => {
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
    await TestHelper.sendMessage(
      client, tokenA, convId, 'Mark me read'
    )

    const listResp = await client
      .get('/api/v1/notifications')
      .header('Authorization', `Bearer ${tokenB}`)

    const notifId = listResp.body().data[0].id

    const response = await client
      .patch(`/api/v1/notifications/${notifId}/read`)
      .header('Authorization', `Bearer ${tokenB}`)

    response.assertStatus(200)
    assert.equal(response.body().data.isRead, true)
    assert.exists(response.body().data.readAt)
  })

  test('marks all notifications as read', async ({ client, assert }) => {
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
    await TestHelper.sendMessage(client, tokenA, convId, 'Msg 1')
    await TestHelper.sendMessage(client, tokenA, convId, 'Msg 2')
    await TestHelper.sendMessage(client, tokenA, convId, 'Msg 3')

    const response = await client
      .patch('/api/v1/notifications/read-all')
      .header('Authorization', `Bearer ${tokenB}`)

    response.assertStatus(200)
    assert.equal(response.body().data.count, 3)

    const countResp = await client
      .get('/api/v1/notifications/unread-count')
      .header('Authorization', `Bearer ${tokenB}`)

    assert.equal(countResp.body().data.unreadCount, 0)
  })
})

test.group('Notifications — Delete', (group) => {
  group.each.setup(async () => {
    await TestHelper.cleanDatabase()
    await TestHelper.cleanRateLimits()
  })

  test('deletes a notification', async ({ client, assert }) => {
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
    await TestHelper.sendMessage(
      client, tokenA, convId, 'Delete my notification'
    )

    const listResp = await client
      .get('/api/v1/notifications')
      .header('Authorization', `Bearer ${tokenB}`)

    const notifId = listResp.body().data[0].id

    const response = await client
      .delete(`/api/v1/notifications/${notifId}`)
      .header('Authorization', `Bearer ${tokenB}`)

    response.assertStatus(200)
    assert.equal(response.body().data.id, notifId)
  })

  test('cannot delete another users notification',
    async ({ client, assert }) => {
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
      const { token: tokenC } = await TestHelper.registerUser(client, {
        name: 'User C',
        email: 'userc@example.com',
        password: 'password123',
      })

      const convId = await TestHelper.createDirectConversation(
        client, tokenA, userBId
      )
      await TestHelper.sendMessage(
        client, tokenA, convId, 'Notification for B'
      )

      const listResp = await client
        .get('/api/v1/notifications')
        .header('Authorization', `Bearer ${tokenB}`)

      const notifId = listResp.body().data[0].id

      const response = await client
        .delete(`/api/v1/notifications/${notifId}`)
        .header('Authorization', `Bearer ${tokenC}`)

      response.assertStatus(404)
    }
  )
})
