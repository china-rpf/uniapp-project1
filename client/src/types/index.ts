// User
export interface User {
  id: string;
  wx_openid: string;
  nickname: string | null;
  avatar: string | null;
  gender: number;
  birth_year: number | null;
  grade: string | null;
  bio: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileParams {
  nickname?: string;
  avatar?: string;
  gender?: number;
  birth_year?: number;
  grade?: string;
  bio?: string;
}

// Class
export interface ClassInfo {
  id: string;
  name: string;
  creator_id: string;
  invite_code: string;
  min_members: number;
  max_members: number;
  current_members: number;
  grade_tag: string | null;
  status: string;
  assemble_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassDetail extends ClassInfo {
  members: ClassMember[];
}

export interface ClassMember {
  id: string;
  class_id: string;
  user_id: string;
  role: string;
  introduction: string | null;
  display_name: string | null;
  join_method: string;
  status: string;
  nickname: string | null;
  avatar: string | null;
  gender?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateClassParams {
  name: string;
  min_members?: number;
  max_members?: number;
  grade_tag?: string;
}

export interface ClassListResult {
  classes: ClassInfo[];
  total: number;
}

// API Response
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// Login
export interface LoginResult {
  token: string;
  user: User;
  isNew: boolean;
}

// Message
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: 'text' | 'image' | 'voice' | 'audio' | 'file' | 'system';
  content: string;
  reply_to_id: string | null;
  recalled: boolean;
  created_at: string;
  metadata?: {
    filename?: string;
    size?: number;
  };
  sender?: {
    nickname: string | null;
    avatar: string | null;
    gender?: number | null;
  };
}

export interface Conversation {
  id: string;
  type: 'group' | 'private';
  class_id: string | null;
  last_message_at: string | null;
  last_message?: string;
  unread_count: number;
  muted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SendMessageParams {
  conversation_id: string;
  type?: 'text' | 'image' | 'voice' | 'audio' | 'file';
  content: string;
  reply_to_id?: string;
  metadata?: {
    filename?: string;
    size?: number;
  };
}

// Friendship
export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  type: 'friend' | 'bestie' | 'bro';
  status: 'pending' | 'accepted' | 'rejected';
  conversation_id: string | null;
  user_id?: string;
  nickname?: string | null;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
}
