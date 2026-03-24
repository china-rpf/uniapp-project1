import { Request } from 'express';

// Database row types
export interface UserRow {
  id: string;
  wx_openid: string;
  nickname: string | null;
  avatar: string | null;
  gender: number;
  birth_year: number | null;
  grade: string | null;
  bio: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClassRow {
  id: string;
  name: string;
  creator_id: string;
  invite_code: string;
  min_members: number;
  max_members: number;
  current_members: number;
  grade_tag: string | null;
  status: string;
  assemble_deadline: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ClassMemberRow {
  id: string;
  class_id: string;
  user_id: string;
  role: string;
  introduction: string | null;
  display_name: string | null;
  join_method: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

// API types
export interface JwtPayload {
  userId: string;
  openid: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}
