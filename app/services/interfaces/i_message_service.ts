export interface IMessageService {
  send(
    data: {
      conversationId: string
      content: string
      type?: string
      parentId?: string
    },
    senderId: string
  ): Promise<any>

  list(
    conversationId: string,
    userId: string,
    options: { page?: number; limit?: number; before?: string }
  ): Promise<any>

  edit(
    messageId: string,
    content: string,
    userId: string
  ): Promise<any>

  delete(
    messageId: string,
    userId: string
  ): Promise<any>

  markAsRead(
    conversationId: string,
    userId: string
  ): Promise<any>
}
