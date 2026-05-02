import { defineConfig } from '@adonisjs/transmit'

/*
|--------------------------------------------------------------------------
| Transmit Configuration (Server-Sent Events)
|--------------------------------------------------------------------------
|
| Transmit is used for real-time message delivery to clients.
| Each conversation gets its own SSE channel:
|   → conversations/{conversationId}
|
*/
export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Ping Interval
  | Keeps SSE connections alive. false = disabled for now.
  | Enable in production: pingInterval: '3s'
  |--------------------------------------------------------------------------
  */
  pingInterval: false,

  /*
  |--------------------------------------------------------------------------
  | Transport
  | null = in-memory (single server — fine for this project)
  | For multi-server scaling: use Redis transport
  |--------------------------------------------------------------------------
  */
  transport: null,
})
