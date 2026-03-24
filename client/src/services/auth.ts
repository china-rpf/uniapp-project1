import { http } from './http';
import type { User, LoginResult, UpdateProfileParams } from '../types';

export const authApi = {
  wxLogin(code: string) {
    return http.post<LoginResult>('/auth/wx-login', { code }, false);
  },

  // 测试登录（仅开发环境）
  testLogin(username: string) {
    return http.post<LoginResult>('/auth/test-login', { username }, false);
  },

  getMe() {
    return http.get<User>('/auth/me');
  },

  updateProfile(data: UpdateProfileParams) {
    return http.put<User>('/auth/profile', data);
  },
};
