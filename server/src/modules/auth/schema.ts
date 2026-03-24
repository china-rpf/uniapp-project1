import { z } from 'zod';

export const wxLoginSchema = z.object({
  code: z.string().min(1, '微信登录 code 不能为空'),
});

export const updateProfileSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  gender: z.number().int().min(0).max(2).optional(),
  birth_year: z.number().int().min(1990).max(2020).optional(),
  grade: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
});

export type WxLoginInput = z.infer<typeof wxLoginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
