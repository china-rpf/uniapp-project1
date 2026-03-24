<template>
  <view class="conversations-page">
    <!-- 顶部 -->
    <view class="page-header" :style="{ paddingTop: (statusBarHeight + 12) + 'px' }">
      <text class="header-title">消息</text>
      <text class="header-count" v-if="totalUnread > 0">{{ totalUnread }}条未读</text>
    </view>

    <!-- 会话列表 -->
    <view class="conversation-list" v-if="chatStore.conversations.length > 0">
      <view
        class="conversation-card"
        v-for="item in chatStore.conversations"
        :key="item.id"
        @tap="openChat(item)"
      >
        <view class="avatar-section">
          <view class="avatar-wrap" :class="item.type">
            <text class="avatar-icon">{{ item.type === 'private' ? '👤' : '👥' }}</text>
          </view>
          <view class="unread-dot" v-if="item.unread_count > 0">
            <text class="dot-num" v-if="item.unread_count <= 99">{{ item.unread_count }}</text>
            <text class="dot-num" v-else>99+</text>
          </view>
        </view>

        <view class="conversation-body">
          <view class="conversation-top">
            <text class="conversation-name">{{ getConversationName(item) }}</text>
            <text class="conversation-time">{{ formatTime(item.last_message_at) }}</text>
          </view>
          <text class="last-message">{{ item.last_message || '暂无消息' }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!chatStore.loading">
      <view class="empty-circle">
        <text class="empty-emoji">💬</text>
      </view>
      <text class="empty-title">暂无会话</text>
      <text class="empty-desc">加入班级后可开始群聊</text>
      <button class="empty-btn" @tap="goHome">去加入班级</button>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="chatStore.loading">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useChatStore } from '../../stores/chat';
import type { Conversation } from '../../types';

const chatStore = useChatStore();
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;

const totalUnread = computed(() =>
  chatStore.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
);

onShow(() => {
  chatStore.fetchConversations();
});

function getConversationName(item: Conversation): string {
  return item.type === 'private' ? '私聊' : '班级群聊';
}

function formatTime(time: string | null): string {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function openChat(item: Conversation) {
  uni.navigateTo({
    url: `/pages/chat/index?conversationId=${item.id}&name=${encodeURIComponent(getConversationName(item))}`,
  });
}

function goHome() {
  uni.switchTab({ url: '/pages/home/index' });
}
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';

.conversations-page {
  min-height: 100vh;
  background: $bg-page;
  padding-bottom: 120rpx;
}

// 头部
.page-header {
  @include flex-between;
  background: $bg-card;
  padding: 24rpx 32rpx;
  box-shadow: $shadow-sm;

  .header-title {
    font-size: $font-2xl;
    font-weight: 700;
    color: $text-primary;
  }

  .header-count {
    font-size: $font-sm;
    color: $primary;
    background: $primary-bg;
    padding: 6rpx 16rpx;
    border-radius: $radius-full;
  }
}

// 会话列表
.conversation-list {
  padding: 16rpx 24rpx;

  .conversation-card {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx;
    background: $bg-card;
    border-radius: $radius-xl;
    margin-bottom: 12rpx;
    box-shadow: $shadow-card;
    transition: all 0.2s ease;

    &:active {
      transform: scale(0.98);
      background: $bg-hover;
    }
  }

  .avatar-section {
    position: relative;

    .avatar-wrap {
      width: 80rpx;
      height: 80rpx;
      border-radius: $radius-lg;
      @include flex-center;

      &.private { background: $bg-green; }
      &.group { background: $accent-light; }

      .avatar-icon {
        font-size: 36rpx;
      }
    }

    .unread-dot {
      position: absolute;
      top: -6rpx;
      right: -6rpx;
      min-width: 32rpx;
      height: 32rpx;
      padding: 0 8rpx;
      background: $danger;
      border-radius: $radius-full;
      @include flex-center;
      border: 3rpx solid $bg-card;

      .dot-num {
        font-size: 18rpx;
        font-weight: 700;
        color: #fff;
      }
    }
  }

  .conversation-body {
    flex: 1;
    min-width: 0;

    .conversation-top {
      @include flex-between;
      margin-bottom: 6rpx;
    }

    .conversation-name {
      font-size: $font-base;
      font-weight: 600;
      color: $text-primary;
    }

    .conversation-time {
      font-size: $font-xs;
      color: $text-hint;
      flex-shrink: 0;
    }

    .last-message {
      font-size: $font-sm;
      color: $text-hint;
      @include text-ellipsis;
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 48rpx;

  .empty-circle {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    background: $bg-green;
    @include flex-center;
    margin-bottom: 28rpx;

    .empty-emoji { font-size: 64rpx; }
  }

  .empty-title {
    font-size: $font-xl;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8rpx;
  }

  .empty-desc {
    font-size: $font-base;
    color: $text-secondary;
    margin-bottom: 32rpx;
  }

  .empty-btn {
    padding: 16rpx 48rpx;
    @include btn-primary;
    @include flex-center;
  }
}

// 加载状态
.loading-state {
  @include flex-center;
  padding: 60rpx 0;

  .loading-text {
    font-size: $font-base;
    color: $text-hint;
  }
}
</style>
