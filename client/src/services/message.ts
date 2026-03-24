import { http } from './http';
import type { Message, Conversation, SendMessageParams } from '../types';

export const messageApi = {
  getConversations() {
    return http.get<Conversation[]>('/conversations');
  },

  getConversation(id: string) {
    return http.get<Conversation>(`/conversations/${id}`);
  },

  getMessages(conversationId: string, cursor?: string, limit = 20) {
    const query = cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`;
    return http.get<Message[]>(`/conversations/${conversationId}/messages${query}`);
  },

  sendMessage(params: SendMessageParams) {
    return http.post<Message>('/messages/send', params);
  },

  recallMessage(messageId: string) {
    return http.delete<Message>(`/messages/recall/${messageId}`);
  },

  markAsRead(conversationId: string) {
    return http.put(`/conversations/${conversationId}/read`);
  },

  createPrivateConversation(userId: string) {
    return http.post<Conversation>('/conversations', { type: 'private', user_id: userId });
  },
};
