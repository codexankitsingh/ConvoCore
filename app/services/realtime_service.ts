import transmit from '@adonisjs/transmit/services/main'

/*
|--------------------------------------------------------------------------
| RealtimeService
|--------------------------------------------------------------------------
|
| Centralizes all SSE broadcast logic.
| Called by MessageService and ConversationService after mutations.
|
| Channel convention:
|   conversations/{id}  → events for a specific conversation
|   users/{id}          → personal events for a specific user
|
*/
export default class RealtimeService {
  /*
  |--------------------------------------------------------------------------
  | Message Events
  |--------------------------------------------------------------------------
  */

  /** Broadcast new message to all conversation participants */
  broadcastNewMessage(conversationId: string, message: object): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'message:new',
      data: message,
    })
  }

  /** Broadcast edited message */
  broadcastEditedMessage(conversationId: string, message: object): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'message:edited',
      data: message,
    })
  }

  /** Broadcast deleted message */
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

  /** Broadcast new conversation to a specific user */
  broadcastNewConversation(userId: string, conversation: object): void {
    transmit.broadcast(`users/${userId}`, {
      event: 'conversation:new',
      data: conversation,
    })
  }

  /** Broadcast participant added */
  broadcastParticipantAdded(conversationId: string, participant: object): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'participant:added',
      data: participant,
    })
  }

  /** Broadcast participant removed */
  broadcastParticipantRemoved(conversationId: string, userId: string): void {
    transmit.broadcast(`conversations/${conversationId}`, {
      event: 'participant:removed',
      data: { userId },
    })
  }
}
