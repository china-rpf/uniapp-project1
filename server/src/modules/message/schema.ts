import { z } from 'zod';

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid('会话ID格式错误'),
  type: z.enum(['text', 'image', 'voice', 'audio', 'file']).default('text'),
  content: z.string().min(1, '消息内容不能为空').max(5000, '消息内容过长'),
  reply_to_id: z.string().uuid().optional(),
  metadata: z.object({
    filename: z.string().optional(),
    size: z.number().optional(),
  }).optional(),
});

export const getMessagesQuerySchema = z.object({
  cursor: z.string().optional(), // message id for pagination
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createConversationSchema = z.object({
  type: z.enum(['group', 'private']),
  class_id: z.string().uuid().optional(), // required for group
  user_id: z.string().uuid().optional(), // required for private
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
