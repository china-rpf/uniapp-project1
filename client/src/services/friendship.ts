import { http } from './http';
import type { Friendship } from '../types';

export const friendshipApi = {
  getFriends(type?: string, status?: string) {
    const queryParams: string[] = [];
    if (type) queryParams.push(`type=${type}`);
    if (status) queryParams.push(`status=${status}`);
    const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return http.get<Friendship[]>(`/friends${query}`);
  },

  getPendingRequests() {
    return http.get<Friendship[]>('/friends/pending');
  },

  sendRequest(userId: string, type: 'friend' | 'bestie' | 'bro' = 'friend') {
    return http.post<Friendship>('/friends/request', { user_id: userId, type });
  },

  respondRequest(userId: string, accept: boolean) {
    return http.put<Friendship>(`/friends/${userId}/respond`, { accept });
  },

  deleteFriend(userId: string) {
    return http.delete(`/friends/${userId}`);
  },
};
