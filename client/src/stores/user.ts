import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types';
import { authApi } from '../services/auth';

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const token = ref<string>(String(uni.getStorageSync('token') || ''));
  const isEditingProfile = ref(false);

  const isLoggedIn = computed(() => !!token.value);
  const hasProfile = computed(() => !!user.value?.nickname);

  async function login(code: string) {
    const res = await authApi.wxLogin(code);
    if (res.data) {
      token.value = res.data.token;
      user.value = { ...res.data.user };
      uni.setStorageSync('token', res.data.token);
      return res.data;
    }
  }

  async function fetchMe() {
    try {
      const res = await authApi.getMe();
      if (res.data) {
        user.value = { ...res.data };
      }
    } catch {
      // Token invalid, clear it
      logout();
    }
  }

  async function updateProfile(data: Partial<User>) {
    const res = await authApi.updateProfile(data);
    if (res.data) {
      user.value = { ...res.data };
    }
  }

  function logout() {
    user.value = null;
    token.value = '';
    uni.removeStorageSync('token');
    uni.redirectTo({ url: '/pages/login/index' });
  }

  return {
    user,
    token,
    isEditingProfile,
    isLoggedIn,
    hasProfile,
    login,
    fetchMe,
    updateProfile,
    logout,
  };
});
