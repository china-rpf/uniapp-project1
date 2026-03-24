import { useUserStore } from '../stores/user';
import { authApi } from '../services/auth';
import { useSocket } from './useSocket';

export function useAuth() {
  const userStore = useUserStore();
  const { connect } = useSocket();

  function connectWebSocket(token: string) {
    try {
      connect(token);
    } catch (err) {
      console.error('WebSocket connect failed:', err);
    }
  }

  async function wxLogin() {
    try {
      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: reject,
        });
      });

      if (!loginRes || !loginRes.code) {
        uni.showToast({ title: '微信登录失败', icon: 'none' });
        return false;
      }

      const result = await userStore.login(loginRes.code);

      // Connect WebSocket after successful login
      if (result?.token) {
        connectWebSocket(result.token);
      }

      if (result?.isNew) {
        userStore.isEditingProfile = true;
        uni.switchTab({ url: '/pages/profile/index' });
      } else {
        uni.switchTab({ url: '/pages/home/index' });
      }
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      uni.showToast({ title: '登录失败，请重试', icon: 'none' });
      return false;
    }
  }

  // 测试登录（用于开发环境测试多用户）
  async function testLogin(username: string) {
    try {
      const res = await authApi.testLogin(username);
      if (res.data) {
        userStore.token = res.data.token;
        userStore.user = { ...res.data.user };
        uni.setStorageSync('token', res.data.token);

        // Connect WebSocket after successful login
        connectWebSocket(res.data.token);

        if (res.data.isNew) {
          userStore.isEditingProfile = true;
          uni.switchTab({ url: '/pages/profile/index' });
        } else {
          uni.switchTab({ url: '/pages/home/index' });
        }
        uni.showToast({ title: `以「${username}」登录`, icon: 'success' });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Test login failed:', err);
      uni.showToast({ title: '测试登录失败', icon: 'none' });
      return false;
    }
  }

  function checkAuth(): boolean {
    if (!userStore.isLoggedIn) {
      uni.redirectTo({ url: '/pages/login/index' });
      return false;
    }
    return true;
  }

  return {
    wxLogin,
    testLogin,
    checkAuth,
  };
}
