<template>
  <view class="home-page">
    <!-- 顶部黄色横幅区 -->
    <view class="hero-section">
      <view class="hero-bg"></view>
      <view class="hero-content" :style="{ paddingTop: (statusBarHeight + 12) + 'px' }">
        <!-- 用户信息行 -->
        <view class="user-bar">
          <view class="user-info" @tap="goProfile">
            <image
              v-if="userStore.user?.avatar"
              class="user-avatar"
              :src="userStore.user.avatar"
              mode="aspectFill"
            />
            <view v-else class="user-avatar-placeholder" :style="{ background: avatarBgColor }">
              <text class="avatar-emoji">{{ avatarEmoji }}</text>
            </view>
            <view class="user-text">
              <text class="user-greeting">{{ greetingText }}，{{ userStore.user?.nickname || '同学' }}</text>
              <text class="user-desc" v-if="classStore.myClasses.length > 0">你已加入 {{ classStore.myClasses.length }} 个班级</text>
              <text class="user-desc" v-else>快来加入你的第一个班级吧</text>
            </view>
          </view>
        </view>

        <!-- 快捷操作区 -->
        <view class="quick-actions">
          <view class="action-card" @tap="goCreateClass">
            <view class="action-icon create-icon">
              <text class="icon-text">+</text>
            </view>
            <view class="action-info">
              <text class="action-title">创建班级</text>
              <text class="action-desc">发起新的拼班</text>
            </view>
          </view>
          <view class="action-card" @tap="goJoinClass">
            <view class="action-icon join-icon">
              <text class="icon-text">🔗</text>
            </view>
            <view class="action-info">
              <text class="action-title">加入班级</text>
              <text class="action-desc">输入邀请码</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-section" v-if="classStore.myClasses.length > 0">
      <view class="stat-card">
        <view class="stat-icon" style="background: #E8F5F0;">
          <text class="stat-emoji">📚</text>
        </view>
        <text class="stat-num">{{ classStore.myClasses.length }}</text>
        <text class="stat-label">我的班级</text>
      </view>
      <view class="stat-card">
        <view class="stat-icon" style="background: #FFF3C4;">
          <text class="stat-emoji">✅</text>
        </view>
        <text class="stat-num">{{ activeClassCount }}</text>
        <text class="stat-label">已成班</text>
      </view>
      <view class="stat-card">
        <view class="stat-icon" style="background: #FFE4E4;">
          <text class="stat-emoji">🔥</text>
        </view>
        <text class="stat-num">{{ assemblingCount }}</text>
        <text class="stat-label">拼班中</text>
      </view>
    </view>

    <!-- 班级列表 -->
    <view class="section" v-if="classStore.myClasses.length > 0">
      <view class="section-header">
        <text class="section-title">我的班级</text>
        <view class="section-more" @tap="goJoinClass">
          <text class="more-text">查看更多</text>
          <text class="more-arrow">›</text>
        </view>
      </view>

      <view class="class-list">
        <view
          class="class-card"
          v-for="item in classStore.myClasses"
          :key="item.id"
          @tap="goClassDetail(item.id)"
        >
          <view class="card-left">
            <view class="card-icon" :style="{ background: getIconColor(item.id) }">
              <text class="icon-letter">{{ item.name.charAt(0) }}</text>
            </view>
          </view>
          <view class="card-body">
            <view class="card-top">
              <text class="card-name">{{ item.name }}</text>
              <view class="card-badge" :class="item.status">
                <text class="badge-text">{{ statusText(item.status) }}</text>
              </view>
            </view>
            <view class="card-bottom">
              <text class="card-members">{{ item.current_members }}/{{ item.max_members }}人</text>
              <text class="card-grade" v-if="item.grade_tag">{{ item.grade_tag }}</text>
            </view>
          </view>
          <view class="card-arrow">
            <text class="arrow-icon">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!classStore.loading">
      <view class="empty-illustration">
        <view class="empty-circle">
          <text class="empty-emoji">📚</text>
        </view>
      </view>
      <text class="empty-title">还没有加入班级</text>
      <text class="empty-desc">创建或加入一个班级，开始结识新同学吧</text>
      <view class="empty-actions">
        <button class="btn-primary" @tap="goCreateClass">创建班级</button>
        <button class="btn-outline" @tap="goJoinClass">输入邀请码加入</button>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="classStore.loading">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useClassStore } from '../../stores/class';
import { useUserStore } from '../../stores/user';
import { getAvatarBgColor, getAvatarEmoji } from '../../composables/useAvatar';

const classStore = useClassStore();
const userStore = useUserStore();

const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;

const avatarBgColor = computed(() => getAvatarBgColor(userStore.user?.gender, userStore.user?.id));
const avatarEmoji = computed(() => getAvatarEmoji(userStore.user?.gender, userStore.user?.id));

onShow(() => {
  classStore.fetchMyClasses();
});

const greetingText = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
});

const activeClassCount = computed(() =>
  classStore.myClasses.filter(c => c.status === 'active').length
);

const assemblingCount = computed(() =>
  classStore.myClasses.filter(c => c.status === 'assembling').length
);

const colors = ['#2E7D6F', '#5BA4E6', '#E8A838', '#D94545', '#7B68EE', '#00995B'];

function getIconColor(id: string): string {
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    assembling: '拼班中',
    active: '已成班',
    dissolved: '已解散',
  };
  return map[status] || status;
}

function goCreateClass() {
  uni.navigateTo({ url: '/pages/class-create/index' });
}

function goJoinClass() {
  uni.navigateTo({ url: '/pages/class-join/index' });
}

function goClassDetail(id: string) {
  uni.navigateTo({ url: `/pages/class-detail/index?id=${id}` });
}

function goProfile() {
  uni.switchTab({ url: '/pages/profile/index' });
}
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';

.home-page {
  min-height: 100vh;
  background: $bg-page;
  padding-bottom: 140rpx;
}

// 顶部英雄区
.hero-section {
  position: relative;
  overflow: hidden;

  .hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    @include gradient-yellow;
  }

  .hero-content {
    position: relative;
    padding: 24rpx 24rpx 32rpx;
  }
}

.user-bar {
  margin-bottom: 24rpx;

  .user-info {
    display: flex;
    align-items: center;

    .user-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(255, 255, 255, 0.6);
      margin-right: 16rpx;
    }

    .user-avatar-placeholder {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(255, 255, 255, 0.6);
      margin-right: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      .avatar-emoji { font-size: 40rpx; }
    }

    .user-text {
      flex: 1;

      .user-greeting {
        display: block;
        font-size: $font-lg;
        font-weight: 700;
        color: $text-primary;
      }

      .user-desc {
        display: block;
        font-size: $font-sm;
        color: $text-secondary;
        margin-top: 4rpx;
      }
    }
  }
}

// 快捷操作
.quick-actions {
  display: flex;
  gap: 16rpx;

  .action-card {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 16rpx;
    background: rgba(255, 255, 255, 0.85);
    border-radius: $radius-xl;
    backdrop-filter: blur(10px);

    &:active {
      transform: scale(0.97);
      background: rgba(255, 255, 255, 0.95);
    }
  }

  .action-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: $radius-lg;
    @include flex-center;
    flex-shrink: 0;

    &.create-icon {
      background: $primary;
      .icon-text { color: #fff; font-size: 36rpx; font-weight: 300; }
    }

    &.join-icon {
      background: $bg-green;
      .icon-text { font-size: 28rpx; }
    }
  }

  .action-info {
    flex: 1;
    min-width: 0;

    .action-title {
      display: block;
      font-size: $font-base;
      font-weight: 600;
      color: $text-primary;
    }

    .action-desc {
      display: block;
      font-size: $font-xs;
      color: $text-hint;
      margin-top: 2rpx;
    }
  }
}

// 统计区
.stats-section {
  display: flex;
  gap: 12rpx;
  padding: 20rpx 24rpx;

  .stat-card {
    flex: 1;
    background: $bg-card;
    border-radius: $radius-xl;
    padding: 20rpx 16rpx;
    text-align: center;
    box-shadow: $shadow-card;

    .stat-icon {
      width: 56rpx;
      height: 56rpx;
      border-radius: 50%;
      @include flex-center;
      margin: 0 auto 8rpx;

      .stat-emoji { font-size: 28rpx; }
    }

    .stat-num {
      display: block;
      font-size: 40rpx;
      font-weight: 700;
      color: $text-primary;
    }

    .stat-label {
      display: block;
      font-size: $font-xs;
      color: $text-hint;
      margin-top: 4rpx;
    }
  }
}

// 区块
.section {
  padding: 0 24rpx;

  .section-header {
    @include flex-between;
    margin-bottom: 16rpx;

    .section-title {
      font-size: $font-lg;
      font-weight: 700;
      color: $text-primary;
    }

    .section-more {
      display: flex;
      align-items: center;

      .more-text {
        font-size: $font-sm;
        color: $text-hint;
      }

      .more-arrow {
        font-size: $font-lg;
        color: $text-hint;
        margin-left: 4rpx;
      }
    }
  }
}

// 班级列表
.class-list {
  .class-card {
    display: flex;
    align-items: center;
    padding: 20rpx;
    background: $bg-card;
    border-radius: $radius-xl;
    margin-bottom: 12rpx;
    box-shadow: $shadow-card;
    transition: all 0.2s ease;

    &:active {
      transform: scale(0.98);
    }
  }

  .card-left {
    margin-right: 16rpx;

    .card-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: $radius-lg;
      @include flex-center;

      .icon-letter {
        font-size: 32rpx;
        font-weight: 700;
        color: #fff;
      }
    }
  }

  .card-body {
    flex: 1;
    min-width: 0;

    .card-top {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-bottom: 8rpx;

      .card-name {
        font-size: $font-base;
        font-weight: 600;
        color: $text-primary;
        @include text-ellipsis;
        flex: 1;
      }

      .card-badge {
        padding: 4rpx 12rpx;
        border-radius: $radius-full;
        flex-shrink: 0;

        .badge-text { font-size: $font-xs; font-weight: 500; }

        &.assembling {
          background: $warning-light;
          .badge-text { color: $warning; }
        }

        &.active {
          background: $success-light;
          .badge-text { color: $success; }
        }

        &.dissolved {
          background: rgba(153, 153, 153, 0.1);
          .badge-text { color: $text-hint; }
        }
      }
    }

    .card-bottom {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .card-members {
        font-size: $font-sm;
        color: $text-hint;
      }

      .card-grade {
        font-size: $font-xs;
        color: $primary;
        background: $primary-bg;
        padding: 2rpx 10rpx;
        border-radius: $radius-full;
      }
    }
  }

  .card-arrow {
    margin-left: 8rpx;

    .arrow-icon {
      font-size: 36rpx;
      color: $text-light;
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 48rpx;

  .empty-illustration {
    margin-bottom: 32rpx;

    .empty-circle {
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      background: $bg-green;
      @include flex-center;

      .empty-emoji { font-size: 72rpx; }
    }
  }

  .empty-title {
    font-size: $font-xl;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 12rpx;
  }

  .empty-desc {
    font-size: $font-base;
    color: $text-secondary;
    margin-bottom: 40rpx;
    text-align: center;
  }

  .empty-actions {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    width: 100%;
    max-width: 480rpx;

    .btn-primary {
      height: 88rpx;
      @include btn-accent;
      @include flex-center;
      font-size: $font-lg;
    }

    .btn-outline {
      height: 88rpx;
      @include btn-secondary;
      @include flex-center;
    }
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
