import { http } from './http';
import type { ClassInfo, ClassDetail, CreateClassParams, ClassListResult } from '../types';

export const classApi = {
  create(data: CreateClassParams) {
    return http.post<ClassInfo>('/classes', data);
  },

  list(params?: { status?: string; page?: number; limit?: number }) {
    const query = params
      ? '?' + Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${v}`).join('&')
      : '';
    return http.get<ClassListResult>(`/classes${query}`);
  },

  getMyClasses() {
    return http.get<ClassInfo[]>('/classes/my');
  },

  getDetail(id: string) {
    return http.get<ClassDetail>(`/classes/${id}`);
  },

  join(inviteCode: string) {
    return http.post<ClassInfo>('/classes/join', { invite_code: inviteCode });
  },

  update(id: string, data: Partial<CreateClassParams>) {
    return http.put<ClassInfo>(`/classes/${id}`, data);
  },

  delete(id: string) {
    return http.delete<null>(`/classes/${id}`);
  },
};
