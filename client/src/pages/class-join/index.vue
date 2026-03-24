<template>
  <view class="join-page">
    <!-- 头部 -->
    <view class="header">
      <view class="header-icon">
        <text class="icon-emoji">🔗</text>
      </view>
      <text class="title">加入班级</text>
      <text class="subtitle">输入 8 位邀请码，加入同学的班级</text>
    </view>

    <!-- 邀请码输入 -->
    <view class="code-section">
      <text class="code-label">邀请码</text>
      <view class="code-input-wrapper">
        <input
          class="code-input"
          v-model="inviteCode"
          placeholder="请输入邀请码"
          maxlength="8"
          @confirm="handleJoin"
          :adjust-position="true"
        />
        <view class="code-length">
          <text class="length-text" :class="{ complete: inviteCode.length === 8 }">
            {{ inviteCode.length }}/8
          </text>
        </view>
      </view>
    </view>

    <!-- 提示 -->
    <view class="tips-card">
      <view class="tip-item">
        <view class="tip-dot"></view>
        <text class="tip-text">向班级创建者索要邀请码</text>
      </view>
      <view class="tip-item">
        <view class="tip-dot"></view>
        <text class="tip-text">点击分享链接可直接加入</text>
      </view>
    </view>

    <!-- 加入按钮 -->
    <view class="submit-section">
      <button
        class="btn-join"
        @tap="handleJoin"
        :loading="loading"
        :disabled="inviteCode.length !== 8"
      >
        加入班级
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useClassStore } from '../../stores/class';

const classStore = useClassStore();
const inviteCode = ref('');
const loading = ref(false);

onLoad((options) => {
  if (options?.code) {
    inviteCode.value = options.code;
  }
});

async function handleJoin() {
  if (inviteCode.value.length !== 8) {
    uni.showToast({ title: '请输入8位邀请码', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    const cls = await classStore.joinClass(inviteCode.value.toUpperCase());
    if (cls) {
      uni.showToast({ title: '加入成功', icon: 'success' });
      setTimeout(() => {
        uni.redirectTo({ url: `/pages/class-detail/index?id=${cls.id}` });
      }, 1500);
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';

.join-page {
  min-height: 100vh;
  background: $bg-page;
  padding: 48rpx 24rpx;
  padding-bottom: 160rpx;
}

// 头部
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;

  .header-icon {
    width: 96rpx;
    height: 96rpx;
    background: $accent;
    border-radius: $radius-xl;
    @include flex-center;
    margin-bottom: 20rpx;
    box-shadow: $shadow-md;

    .icon-emoji { font-size: 48rpx; }
  }

  .title {
    font-size: $font-2xl;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8rpx;
  }

  .subtitle {
    font-size: $font-base;
    color: $text-secondary;
  }
}

// 邀请码输入
.code-section {
  margin-bottom: 20rpx;

  .code-label {
    display: block;
    font-size: $font-sm;
    font-weight: 700;
    color: $text-secondary;
    margin-bottom: 12rpx;
    padding-left: 8rpx;
  }

  .code-input-wrapper {
    position: relative;
    background: $bg-card;
    border-radius: $radius-xl;
    padding: 8rpx;
    box-shadow: $shadow-md;
  }

  .code-input {
    width: 100%;
    height: 100rpx;
    padding: 0 100rpx 0 20rpx;
    font-size: 40rpx;
    font-weight: 700;
    color: $primary;
    text-align: center;
    letter-spacing: 8rpx;
    background: $bg-input;
    border-radius: $radius-lg;
  }

  .code-length {
    position: absolute;
    right: 24rpx;
    top: 50%;
    transform: translateY(-50%);

    .length-text {
      font-size: $font-sm;
      font-weight: 600;
      color: $text-hint;
      transition: color 0.2s;

      &.complete { color: $success; }
    }
  }
}

// 提示
.tips-card {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 20rpx 24rpx;
  margin-bottom: 32rpx;
  box-shadow: $shadow-card;

  .tip-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 8rpx 0;

    .tip-dot {
      width: 8rpx;
      height: 8rpx;
      background: $accent;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .tip-text {
      font-size: $font-sm;
      color: $text-secondary;
    }
  }
}

// 提交按钮
.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: $bg-card;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.04);

  .btn-join {
    width: 100%;
    height: 88rpx;
    @include btn-accent;
    @include flex-center;
    font-size: $font-lg;
  }
}
</style>
