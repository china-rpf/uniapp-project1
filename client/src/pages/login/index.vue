<template>
  <view class="login-page">
    <!-- 顶部品牌区 -->
    <view class="brand-section">
      <view class="brand-bg"></view>
      <view class="brand-content" :style="{ paddingTop: (statusBarHeight + 40) + 'px' }">
        <view class="logo-wrap">
          <text class="logo-emoji">🎓</text>
        </view>
        <text class="brand-name">虚拟班级</text>
        <text class="brand-slogan">去标签化社交 · 平等交流学习</text>
      </view>
    </view>

    <!-- 特性卡片 -->
    <view class="features-section">
      <view class="feature-row">
        <view class="feature-card">
          <view class="feature-icon" style="background: #E8F5F0;">
            <text class="icon-emoji">🎭</text>
          </view>
          <text class="feature-title">匿名社交</text>
          <text class="feature-desc">隐藏真实身份</text>
        </view>
        <view class="feature-card">
          <view class="feature-icon" style="background: #FFF3C4;">
            <text class="icon-emoji">💬</text>
          </view>
          <text class="feature-title">实时聊天</text>
          <text class="feature-desc">随时互动交流</text>
        </view>
        <view class="feature-card">
          <view class="feature-icon" style="background: #E8F0FE;">
            <text class="icon-emoji">🤝</text>
          </view>
          <text class="feature-title">结识同学</text>
          <text class="feature-desc">拓展社交圈</text>
        </view>
      </view>
    </view>

    <!-- 登录区域 -->
    <view class="login-section">
      <button class="btn-login" @tap="handleLogin" :loading="loading">
        微信一键登录
      </button>

      <!-- 测试用户 -->
      <view class="test-section">
        <view class="test-divider">
          <view class="divider-line"></view>
          <text class="divider-text">测试用户</text>
          <view class="divider-line"></view>
        </view>
        <view class="test-grid">
          <view
            class="test-btn"
            v-for="user in testUsers"
            :key="user.name"
            @tap="handleTestLogin(user.name)"
          >
            <text class="test-avatar">{{ user.avatar }}</text>
            <text class="test-name">{{ user.label }}</text>
          </view>
        </view>
      </view>

      <view class="agreement">
        <text class="agreement-text">登录即表示同意</text>
        <text class="agreement-link">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../../composables/useAuth';

const { wxLogin, testLogin } = useAuth();
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;
const loading = ref(false);

const testUsers = [
  { name: 'user1', label: '小明', avatar: '👦' },
  { name: 'user2', label: '小红', avatar: '👧' },
  { name: 'user3', label: '小华', avatar: '🧑' },
  { name: 'user4', label: '小李', avatar: '👨' },
];

async function handleLogin() {
  if (loading.value) return;
  loading.value = true;
  try {
    await wxLogin();
  } finally {
    loading.value = false;
  }
}

async function handleTestLogin(username: string) {
  if (loading.value) return;
  loading.value = true;
  try {
    await testLogin(username);
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';

.login-page {
  min-height: 100vh;
  background: $bg-page;
}

// 品牌区
.brand-section {
  position: relative;
  overflow: hidden;
  padding-bottom: 48rpx;

  .brand-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    @include gradient-yellow;
  }

  .brand-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 80rpx;

    .logo-wrap {
      width: 120rpx;
      height: 120rpx;
      background: rgba(255, 255, 255, 0.9);
      border-radius: $radius-2xl;
      @include flex-center;
      margin-bottom: 20rpx;
      box-shadow: $shadow-lg;

      .logo-emoji { font-size: 64rpx; }
    }

    .brand-name {
      font-size: $font-3xl;
      font-weight: 800;
      color: $text-primary;
      margin-bottom: 8rpx;
    }

    .brand-slogan {
      font-size: $font-base;
      color: $text-secondary;
    }
  }
}

// 特性区
.features-section {
  padding: 0 24rpx;
  margin-top: -24rpx;
  position: relative;
  z-index: 1;

  .feature-row {
    display: flex;
    gap: 12rpx;
  }

  .feature-card {
    flex: 1;
    background: $bg-card;
    border-radius: $radius-xl;
    padding: 24rpx 16rpx;
    text-align: center;
    box-shadow: $shadow-card;

    .feature-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      @include flex-center;
      margin: 0 auto 12rpx;

      .icon-emoji { font-size: 32rpx; }
    }

    .feature-title {
      display: block;
      font-size: $font-base;
      font-weight: 700;
      color: $text-primary;
      margin-bottom: 4rpx;
    }

    .feature-desc {
      display: block;
      font-size: $font-xs;
      color: $text-hint;
    }
  }
}

// 登录区
.login-section {
  padding: 48rpx 32rpx 32rpx;

  .btn-login {
    width: 100%;
    height: 96rpx;
    @include btn-accent;
    font-size: $font-lg;
    font-weight: 700;
    margin-bottom: 32rpx;
  }

  .test-section {
    margin-bottom: 32rpx;

    .test-divider {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 20rpx;

      .divider-line {
        flex: 1;
        height: 1rpx;
        background: $border-color;
      }

      .divider-text {
        font-size: $font-sm;
        color: $text-hint;
      }
    }

    .test-grid {
      display: flex;
      justify-content: center;
      gap: 20rpx;
    }

    .test-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20rpx 24rpx;
      background: $bg-card;
      border-radius: $radius-xl;
      box-shadow: $shadow-card;
      transition: all 0.2s ease;

      &:active {
        transform: scale(0.95);
        background: $bg-hover;
      }

      .test-avatar {
        font-size: 40rpx;
        margin-bottom: 8rpx;
      }

      .test-name {
        font-size: $font-sm;
        color: $text-secondary;
        font-weight: 500;
      }
    }
  }

  .agreement {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4rpx;

    .agreement-text {
      font-size: $font-sm;
      color: $text-hint;
    }

    .agreement-link {
      font-size: $font-sm;
      color: $primary;
    }
  }
}
</style>
