import transmit from '@adonisjs/transmit/services/main'

/*
|--------------------------------------------------------------------------
| RealtimeService
|--------------------------------------------------------------------------
*/
export default class RealtimeService {
  /*
  |--------------------------------------------------------------------------
  | Message Events
  |--------------------------------------------------------------------------
  */
  broadcastNewMessage(conversationId: string, message: object): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'message:new',
      data: message,
    })
  }

  broadcastEditedMessage(conversationId: string, message: object): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'message:edited',
      data: message,
    })
  }

  broadcastDeletedMessage(conversationId: string, messageId: string): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'message:deleted',
      data: { messageId },
    })
  }

  /*
  |--------------------------------------------------------------------------
  | Conversation Events
  |--------------------------------------------------------------------------
  */
  broadcastNewConversation(userId: string, conversation: object): void {
    transmit.broadcast(`users/${userId}`, {
      event: 'conversation:new',
      data: conversation,
    })
  }

  broadcastParticipantAdded(conversationId: string, participant: object): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'participant:added',
      data: participant,
    })
  }

  broadcastParticipantRemoved(conversationId: string, userId: string): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'participant:removed',
      data: { userId },
    })
  }

  /*
  |--------------------------------------------------------------------------
  | Presence Events
  |--------------------------------------------------------------------------
  */
  broadcastPresenceOnline(conversationId: string, data: object): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'presence:online',
      data,
    })
  }

  broadcastPresenceOffline(conversationId: string, data: object): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'presence:offline',
      data,
    })
  }

  broadcastTyping(conversationId: string, data: object): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'presence:typing',
      data,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | Notification Events
  |--------------------------------------------------------------------------
  */
  broadcastNotification(userId: string, data: object): void {
    transmit.broadcast(`users/${userId}`, {
      event: 'notification:new',
      data,
    })
  }
}
