import db from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'

/*
|--------------------------------------------------------------------------
| TestHelper
|--------------------------------------------------------------------------
*/
export class TestHelper {
  /*
  |--------------------------------------------------------------------------
  | Clean all tables between tests
  |--------------------------------------------------------------------------
  */
  static async cleanDatabase(): Promise<void> {
    await db.rawQuery(
      `TRUNCATE TABLE
        notifications,
        messages,
        conversation_participants,
        conversations,
        uploads,
        users
       RESTART IDENTITY CASCADE`
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Clean Redis rate limit keys
  | NOTE: AdonisJS Redis prepends 'convocore:' to all keys
  | So actual keys are 'convocore:rl:*' not 'rl:*'
  |--------------------------------------------------------------------------
  */
  static async cleanRateLimits(): Promise<void> {
    try {
      /*
      | Use SCAN to find all rate limit keys regardless of prefix
      | This handles both 'rl:*' and 'convocore:rl:*'
      */
      const keys = await redis.keys('*rl:*')
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (e) {
      // Silently ignore Redis errors in cleanup
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Register a user and return token + user
  |--------------------------------------------------------------------------
  */
  static async registerUser(
    client: any,
    data: { name: string; email: string; password: string }
  ): Promise<{ token: string; userId: string; user: any }> {
    const response = await client
      .post('/api/v1/auth/register')
      .json(data)

    const body = response.body()
    const token = body?.data?.tokens?.accessToken
    const user = body?.data?.user

    if (!token) {
      console.error('Register failed:', JSON.stringify(body))
      throw new Error(
        `Register failed for ${data.email}: ${body?.message}`
      )
    }

    return { token, userId: user?.id, user }
  }

  /*
  |--------------------------------------------------------------------------
  | Login a user and return token
  |--------------------------------------------------------------------------
  */
  static async loginUser(
    client: any,
    email: string,
    password: string
  ): Promise<{ token: string; userId: string; user: any }> {
    const response = await client
      .post('/api/v1/auth/login')
      .json({ email, password })

    const body = response.body()
    const token = body?.data?.tokens?.accessToken
    const user = body?.data?.user

    if (!token) {
      console.error('Login failed:', JSON.stringify(body))
      throw new Error(
        `Login failed for ${email}: ${body?.message}`
      )
    }

    return { token, userId: user?.id, user }
  }

  /*
  |--------------------------------------------------------------------------
  | Create a direct conversation
  |--------------------------------------------------------------------------
  */
  static async createDirectConversation(
    client: any,
    token: string,
    participantId: string
  ): Promise<string> {
    const response = await client
      .post('/api/v1/conversations')
      .header('Authorization', `Bearer ${token}`)
      .json({ type: 'direct', participantIds: [participantId] })

    const body = response.body()
    if (!body?.data?.id) {
      console.error(
        'Create conversation failed:', JSON.stringify(body)
      )
      throw new Error(
        `Create conversation failed: ${body?.message}`
      )
    }

    return body.data.id
  }

  /*
  |--------------------------------------------------------------------------
  | Create a group conversation
  |--------------------------------------------------------------------------
  */
  static async createGroupConversation(
    client: any,
    token: string,
    name: string,
    participantIds: string[]
  ): Promise<string> {
    const response = await client
      .post('/api/v1/conversations')
      .header('Authorization', `Bearer ${token}`)
      .json({ type: 'group', name, participantIds })

    const body = response.body()
    if (!body?.data?.id) {
      console.error('Create group failed:', JSON.stringify(body))
      throw new Error(`Create group failed: ${body?.message}`)
    }

    return body.data.id
  }

  /*
  |--------------------------------------------------------------------------
  | Send a message
  |--------------------------------------------------------------------------
  */
  static async sendMessage(
    client: any,
    token: string,
    conversationId: string,
    content: string
  ): Promise<string> {
    const response = await client
      .post(`/api/v1/conversations/${conversationId}/messages`)
      .header('Authorization', `Bearer ${token}`)
      .json({ content })

    const body = response.body()
    if (!body?.data?.id) {
      console.error('Send message failed:', JSON.stringify(body))
      throw new Error(`Send message failed: ${body?.message}`)
    }

    return body.data.id
  }
}
