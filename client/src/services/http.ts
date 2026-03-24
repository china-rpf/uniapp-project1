import type { ApiResponse } from '../types';

const BASE_URL = 'http://192.168.1.5:3000';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  needAuth?: boolean;
}

export function request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
  const { url, method = 'GET', data, needAuth = true } = options;

  return new Promise((resolve, reject) => {
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (needAuth) {
      const token = uni.getStorageSync('token');
      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      }
    }

    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res) => {
        // 深拷贝响应数据，避免冻结对象问题
        const response = JSON.parse(JSON.stringify(res.data)) as ApiResponse<T>;

        if (response.code === 401) {
          // Token expired, redirect to login
          uni.removeStorageSync('token');
          uni.redirectTo({ url: '/pages/login/index' });
          reject(new Error('登录已过期'));
          return;
        }

        if (response.code !== 200) {
          const errorMsg = response.message || '请求失败';
          uni.showToast({ title: errorMsg, icon: 'none' });
          reject(new Error(errorMsg));
          return;
        }

        resolve(response);
      },
      fail: (err) => {
        uni.showToast({ title: '网络请求失败', icon: 'none' });
        reject(err);
      },
    });
  });
}

// Convenience methods
export const http = {
  get: <T>(url: string, needAuth = true) =>
    request<T>({ url, method: 'GET', needAuth }),

  post: <T>(url: string, data?: any, needAuth = true) =>
    request<T>({ url, method: 'POST', data, needAuth }),

  put: <T>(url: string, data?: any, needAuth = true) =>
    request<T>({ url, method: 'PUT', data, needAuth }),

  delete: <T>(url: string, needAuth = true) =>
    request<T>({ url, method: 'DELETE', needAuth }),

  upload: <T>(filePath: string, name = 'file'): Promise<ApiResponse<T>> => {
    return new Promise((resolve, reject) => {
      const token = uni.getStorageSync('token');
      uni.uploadFile({
        url: `${BASE_URL}/upload`,
        filePath,
        name,
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: (res) => {
          const response = JSON.parse(res.data) as ApiResponse<T>;
          if (response.code !== 200) {
            uni.showToast({ title: response.message || '上传失败', icon: 'none' });
            reject(new Error(response.message));
            return;
          }
          resolve(response);
        },
        fail: (err) => {
          uni.showToast({ title: '上传失败', icon: 'none' });
          reject(err);
        },
      });
    });
  },
};
