import redis from '@adonisjs/redis/services/main'
import type RealtimeService from '#services/realtime_service'

/*
|--------------------------------------------------------------------------
| PresenceService
|--------------------------------------------------------------------------
|
| Manages user online/offline status and typing indicators using Redis.
|
| Redis Key Strategy:
|   presence:online:{userId}              → "1"  TTL: 35s
|   presence:typing:{convId}:{userId}     → "1"  TTL: 5s
|   presence:conversations:{userId}       → Set of conversationIds user is in
|
| Heartbeat Strategy:
|   Client must POST /presence/online every 20s to stay online
|   If heartbeat stops → key expires → user goes offline
|
*/
export default class PresenceService {
  // Redis key TTLs in seconds
  private readonly ONLINE_TTL = 35 // 35s — client heartbeats every 20s
  private readonly TYPING_TTL = 5 // 5s  — auto-clears typing indicator

  constructor(private readonly realtimeService: RealtimeService) {}

  /*
  |--------------------------------------------------------------------------
  | Mark User Online
  |--------------------------------------------------------------------------
  */
  async markOnline(userId: string, conversationIds: string[]): Promise<void> {
    const key = `presence:online:${userId}`
    const wasOnline = await redis.exists(key)

    // Refresh/set online TTL
    await redis.setex(key, this.ONLINE_TTL, '1')

    // Store which conversations this user is active in
    if (conversationIds.length > 0) {
      const convKey = `presence:conversations:${userId}`
      await redis.del(convKey)
      await redis.sadd(convKey, ...conversationIds)
      await redis.expire(convKey, this.ONLINE_TTL)
    }

    // Only broadcast if user was previously offline
    if (!wasOnline) {
      // Broadcast to all conversations user is part of
      for (const convId of conversationIds) {
        this.realtimeService.broadcastPresenceOnline(convId, {
          userId,
          conversationId: convId,
          timestamp: new Date().toISOString(),
        })
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Mark User Offline
  |--------------------------------------------------------------------------
  */
  async markOffline(userId: string): Promise<void> {
    const key = `presence:online:${userId}`
    const convKey = `presence:conversations:${userId}`

    // Get conversations before deleting
    const conversationIds = await redis.smembers(convKey)

    // Delete presence keys
    await redis.del(key)
    await redis.del(convKey)

    // Broadcast offline to all conversations
    for (const convId of conversationIds) {
      this.realtimeService.broadcastPresenceOffline(convId, {
        userId,
        conversationId: convId,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Set Typing Indicator
  |--------------------------------------------------------------------------
  */
  async setTyping(
    userId: string,
    conversationId: string,
    isTyping: boolean,
    userName: string
  ): Promise<void> {
    const key = `presence:typing:${conversationId}:${userId}`

    if (isTyping) {
      // Set typing with auto-expiry
      await redis.setex(key, this.TYPING_TTL, '1')

      this.realtimeService.broadcastTyping(conversationId, {
        userId,
        userName,
        conversationId,
        isTyping: true,
        timestamp: new Date().toISOString(),
      })
    } else {
      // Explicitly stop typing
      await redis.del(key)

      this.realtimeService.broadcastTyping(conversationId, {
        userId,
        userName,
        conversationId,
        isTyping: false,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Get Online Users in Conversation
  |--------------------------------------------------------------------------
  */
  async getOnlineUsers(conversationId: string, participantIds: string[]): Promise<OnlineUser[]> {
    const onlineUsers: OnlineUser[] = []

    for (const userId of participantIds) {
      const isOnline = await redis.exists(`presence:online:${userId}`)
      const isTyping = await redis.exists(`presence:typing:${conversationId}:${userId}`)

      onlineUsers.push({
        userId,
        isOnline: isOnline === 1,
        isTyping: isTyping === 1,
      })
    }

    return onlineUsers
  }

  /*
  |--------------------------------------------------------------------------
  | Check if User is Online
  |--------------------------------------------------------------------------
  */
  async isOnline(userId: string): Promise<boolean> {
    const exists = await redis.exists(`presence:online:${userId}`)
    return exists === 1
  }
}

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/
export interface OnlineUser {
  userId: string
  isOnline: boolean
  isTyping: boolean
}
