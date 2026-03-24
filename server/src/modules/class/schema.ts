import { z } from 'zod';
import {
  CLASS_MIN_MEMBERS_LOWER,
  CLASS_MAX_MEMBERS_UPPER,
  CLASS_MIN_MEMBERS_DEFAULT,
  CLASS_MAX_MEMBERS_DEFAULT,
} from '../../shared/constants';

export const createClassSchema = z.object({
  name: z.string().min(2, '班级名称至少2个字符').max(100, '班级名称最多100个字符'),
  min_members: z.number().int().min(CLASS_MIN_MEMBERS_LOWER).max(30).default(CLASS_MIN_MEMBERS_DEFAULT),
  max_members: z.number().int().min(CLASS_MIN_MEMBERS_LOWER).max(CLASS_MAX_MEMBERS_UPPER).default(CLASS_MAX_MEMBERS_DEFAULT),
  grade_tag: z.string().max(20).optional(),
});

export const joinClassSchema = z.object({
  invite_code: z.string().length(8, '邀请码为8位'),
});

export const classListQuerySchema = z.object({
  status: z.enum(['assembling', 'active', 'dissolved']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const updateClassSchema = z.object({
  name: z.string().min(2, '班级名称至少2个字符').max(100, '班级名称最多100个字符').optional(),
  min_members: z.number().int().min(CLASS_MIN_MEMBERS_LOWER).max(30).optional(),
  max_members: z.number().int().min(CLASS_MIN_MEMBERS_LOWER).max(CLASS_MAX_MEMBERS_UPPER).optional(),
  grade_tag: z.string().max(20).optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type JoinClassInput = z.infer<typeof joinClassSchema>;
export type ClassListQuery = z.infer<typeof classListQuerySchema>;
