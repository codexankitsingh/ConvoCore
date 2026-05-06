import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'

/*
|--------------------------------------------------------------------------
| RealtimeController
|--------------------------------------------------------------------------
|
| Handles SSE stream connection info.
|
| Transmit v3 Protocol:
|   1. Client generates a UUID (uid)
|   2. Client connects: GET /__transmit/events?uid=CLIENT_UUID
|   3. Client subscribes: POST /__transmit/subscribe { uid, channel }
|   4. Server broadcasts to channel → client receives event
|
*/
export default class RealtimeController {
  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/realtime/info
  |--------------------------------------------------------------------------
  |
  | Returns SSE connection instructions + a ready-to-use UID
  | for the current authenticated user.
  |
  */
  async info(ctx: HttpContext) {
    const user = (ctx as any).authUser

    // Generate a UID for the client to use
    const uid = randomUUID()

    return ctx.response.ok({
      data: {
        userId: user.id,
        // Client uses this uid to connect to SSE
        uid,
        // Step 1: Connect with this URL
        sseUrl: `/__transmit/events?uid=${uid}`,
        // Step 2: Subscribe to these channels
        channels: {
          personal: `users/${user.id}`,
          conversationPattern: `conversations/{conversationId}`,
        },
        // Step 3: Subscribe endpoint
        subscribeUrl: '/__transmit/subscribe',
        // Available events
        events: [
          'message:new',
          'message:edited',
          'message:deleted',
          'conversation:new',
          'participant:added',
          'participant:removed',
        ],
        // Full connection instructions
        instructions: {
          step1: `GET /__transmit/events?uid=${uid}`,
          step2: `POST /__transmit/subscribe { "uid": "${uid}", "channel": "conversations/{id}" }`,
        },
      },
    })
  }
}
