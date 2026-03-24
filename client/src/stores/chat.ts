import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Message, Conversation } from '../types';
import { messageApi } from '../services/message';

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([]);
  const currentConversation = ref<Conversation | null>(null);
  const messages = ref<Message[]>([]);
  const loading = ref(false);

  async function fetchConversations() {
    loading.value = true;
    try {
      const res = await messageApi.getConversations();
      if (res.data) {
        conversations.value = res.data;
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchMessages(conversationId: string, cursor?: string) {
    loading.value = true;
    try {
      const res = await messageApi.getMessages(conversationId, cursor);
      if (res.data) {
        if (cursor) {
          messages.value = [...res.data.reverse(), ...messages.value];
        } else {
          messages.value = res.data.reverse();
        }
      }
    } finally {
      loading.value = false;
    }
  }

  async function sendMessage(params: { conversation_id: string; type?: 'text' | 'image' | 'voice' | 'audio' | 'file'; content: string; reply_to_id?: string; metadata?: any }) {
    const res = await messageApi.sendMessage(params);
    if (res.data) {
      messages.value.push(res.data);
    }
    return res.data;
  }

  function addMessage(message: Message) {
    messages.value.push(message);
  }

  function clearMessages() {
    messages.value = [];
  }

  async function markAsRead(conversationId: string) {
    try {
      await messageApi.markAsRead(conversationId);
      // 更新本地会话列表的未读数
      const conv = conversations.value.find(c => c.id === conversationId);
      if (conv) {
        conv.unread_count = 0;
      }
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  }

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    addMessage,
    clearMessages,
    markAsRead
  };
});
