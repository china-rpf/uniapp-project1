import { z } from 'zod';

export const friendRequestSchema = z.object({
  user_id: z.string().uuid('用户ID格式错误'),
  type: z.enum(['friend', 'bestie', 'bro']).default('friend'),
});

export const respondFriendSchema = z.object({
  accept: z.boolean(),
});

export const listFriendsQuerySchema = z.object({
  type: z.enum(['friend', 'bestie', 'bro']).optional(),
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
});

export type FriendRequestInput = z.infer<typeof friendRequestSchema>;
export type RespondFriendInput = z.infer<typeof respondFriendSchema>;
export type ListFriendsQuery = z.infer<typeof listFriendsQuerySchema>;
