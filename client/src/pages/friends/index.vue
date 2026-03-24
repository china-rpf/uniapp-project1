<template>
  <view class="friends-page">
    <!-- 头部 -->
    <view class="page-header" :style="{ paddingTop: (statusBarHeight + 12) + 'px' }">
      <text class="header-title">好友</text>
      <view class="header-right">
        <text class="friend-count" v-if="acceptedFriends.length > 0">{{ acceptedFriends.length }}位好友</text>
        <view class="add-friend-btn" @tap="showAddPanel = true">
          <text class="add-icon">+</text>
        </view>
      </view>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-bar">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'friends' }"
        @tap="activeTab = 'friends'"
      >
        <text class="tab-text">好友列表</text>
        <view class="tab-line" v-if="activeTab === 'friends'"></view>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'pending' }"
        @tap="activeTab = 'pending'"
      >
        <text class="tab-text">好友请求</text>
        <view class="tab-badge" v-if="pendingCount > 0">
          <text class="badge-num">{{ pendingCount }}</text>
        </view>
        <view class="tab-line" v-if="activeTab === 'pending'"></view>
      </view>
    </view>

    <!-- 好友列表 -->
    <view class="list-section" v-if="activeTab === 'friends'">
      <view class="friend-card" v-for="friend in acceptedFriends" :key="friend.id">
        <view class="friend-main" @tap="openChat(friend)">
          <image v-if="friend.avatar" class="friend-avatar" :src="friend.avatar" mode="aspectFill" />
          <view v-else class="friend-avatar-placeholder" :style="{ background: getAvatarBgColor(friend.gender, friend.user_id) }">
            <text class="avatar-emoji">{{ getAvatarEmoji(friend.gender, friend.user_id) }}</text>
          </view>
          <view class="friend-body">
            <text class="friend-name">{{ friend.nickname || '未命名用户' }}</text>
            <text class="friend-bio" v-if="friend.bio">{{ friend.bio }}</text>
            <text class="friend-type">{{ friendTypeText(friend.type) }}</text>
          </view>
        </view>
        <view class="friend-actions">
          <view class="chat-btn" @tap="openChat(friend)">
            <text class="btn-text">聊天</text>
          </view>
          <view class="delete-btn" @tap.stop="handleDeleteFriend(friend)">
            <text class="delete-icon">×</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="acceptedFriends.length === 0 && !loading">
        <view class="empty-circle">
          <text class="empty-emoji">👫</text>
        </view>
        <text class="empty-title">暂无好友</text>
        <text class="empty-desc">点击右上角 + 从班级同学中添加好友</text>
      </view>
    </view>

    <!-- 好友请求 -->
    <view class="list-section" v-if="activeTab === 'pending'">
      <view class="request-card" v-for="request in pendingRequests" :key="request.id">
        <image v-if="request.avatar" class="request-avatar" :src="request.avatar" mode="aspectFill" />
        <view v-else class="request-avatar-placeholder" :style="{ background: getAvatarBgColor(request.gender, request.user_id) }">
          <text class="avatar-emoji">{{ getAvatarEmoji(request.gender, request.user_id) }}</text>
        </view>
        <view class="request-body">
          <text class="request-name">{{ request.nickname || '未命名用户' }}</text>
          <text class="request-desc">请求成为{{ friendTypeText(request.type) }}</text>
        </view>
        <view class="request-actions">
          <button class="btn-accept" @tap.stop="respondRequest(request, true)">接受</button>
          <button class="btn-reject" @tap.stop="respondRequest(request, false)">拒绝</button>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="pendingRequests.length === 0 && !loading">
        <view class="empty-circle">
          <text class="empty-emoji">📭</text>
        </view>
        <text class="empty-title">暂无好友请求</text>
        <text class="empty-desc">新的好友请求会显示在这里</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 添加好友弹窗 -->
    <view class="mask" v-if="showAddPanel" @tap="showAddPanel = false"></view>
    <view class="add-panel" v-if="showAddPanel">
      <view class="panel-header">
        <text class="panel-title">添加好友</text>
        <view class="panel-close" @tap="showAddPanel = false">
          <text class="close-icon">×</text>
        </view>
      </view>

      <!-- 班级选择 -->
      <view class="class-selector" v-if="classList.length > 0">
        <scroll-view :scroll-x="true" class="class-scroll">
          <view
            class="class-chip"
            :class="{ active: selectedClassId === cls.id }"
            v-for="cls in classList"
            :key="cls.id"
            @tap="selectClass(cls.id)"
          >
            <text class="chip-text">{{ cls.name }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 成员列表 -->
      <scroll-view :scroll-y="true" class="member-scroll">
        <view class="member-item" v-for="m in classMembers" :key="m.user_id">
          <view v-if="m.avatar" class="member-avatar">
            <image :src="m.avatar" class="member-avatar-img" mode="aspectFill" />
          </view>
          <view v-else class="member-avatar-placeholder" :style="{ background: getAvatarBgColor(m.gender, m.user_id) }">
            <text class="avatar-emoji">{{ getAvatarEmoji(m.gender, m.user_id) }}</text>
          </view>
          <view class="member-info">
            <text class="member-name">{{ m.nickname || '未命名' }}</text>
            <text class="member-role" v-if="m.role !== 'member'">{{ roleText(m.role) }}</text>
          </view>
          <view class="member-action">
            <view v-if="isSelf(m.user_id)" class="status-tag self-tag">
              <text class="status-text">自己</text>
            </view>
            <view v-else-if="isFriend(m.user_id)" class="status-tag friend-tag">
              <text class="status-text">已是好友</text>
            </view>
            <button v-else class="btn-add" @tap.stop="sendFriendRequest(m.user_id)">
              <text class="btn-add-text">加好友</text>
            </button>
          </view>
        </view>

        <view class="empty-state" v-if="classMembers.length === 0 && !loadingMembers">
          <text class="empty-desc">{{ classList.length === 0 ? '你还没有加入任何班级' : '请选择一个班级' }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { friendshipApi } from '../../services/friendship';
import { messageApi } from '../../services/message';
import { classApi } from '../../services/class';
import { useUserStore } from '../../stores/user';
import { getAvatarBgColor, getAvatarEmoji } from '../../composables/useAvatar';
import type { Friendship, ClassInfo, ClassMember } from '../../types';

const userStore = useUserStore();
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;
const activeTab = ref<'friends' | 'pending'>('friends');
const friends = ref<Friendship[]>([]);
const pendingRequests = ref<Friendship[]>([]);
const loading = ref(false);

// Add friend panel state
const showAddPanel = ref(false);
const classList = ref<ClassInfo[]>([]);
const selectedClassId = ref('');
const classMembers = ref<ClassMember[]>([]);
const loadingMembers = ref(false);
const friendUserIds = ref<Set<string>>(new Set());

const acceptedFriends = computed(() =>
  friends.value.filter(f => f.status === 'accepted')
);

const pendingCount = computed(() => pendingRequests.value.length);

onShow(async () => {
  await fetchData();
});

async function fetchData() {
  loading.value = true;
  try {
    const [friendsRes, pendingRes] = await Promise.all([
      friendshipApi.getFriends(undefined, 'accepted'),
      friendshipApi.getPendingRequests(),
    ]);
    if (friendsRes.data) {
      friends.value = friendsRes.data;
      friendUserIds.value = new Set(friendsRes.data.map(f => f.user_id || f.addressee_id));
    }
    if (pendingRes.data) pendingRequests.value = pendingRes.data;
  } catch (err) {
    console.error('Fetch friends failed:', err);
    uni.showToast({ title: '加载好友列表失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function friendTypeText(type: string): string {
  const map: Record<string, string> = {
    friend: '好友',
    bestie: '闺蜜',
    bro: '兄弟',
  };
  return map[type] || '好友';
}

function roleText(role: string): string {
  const map: Record<string, string> = {
    creator: '创建者',
    teacher: '班主任',
    monitor: '班长',
    committee: '班委',
  };
  return map[role] || '';
}

async function respondRequest(request: Friendship, accept: boolean) {
  const userId = request.user_id || request.requester_id;
  if (!userId) {
    uni.showToast({ title: '操作失败：用户信息缺失', icon: 'none' });
    return;
  }

  try {
    await friendshipApi.respondRequest(userId, accept);
    uni.showToast({ title: accept ? '已成为好友' : '已拒绝', icon: 'success' });
    await fetchData();
  } catch (err) {
    console.error('Respond request failed:', err);
    uni.showToast({ title: '操作失败，请重试', icon: 'none' });
  }
}

async function openChat(friend: Friendship) {
  const userId = friend.user_id || friend.addressee_id;
  if (!userId) {
    uni.showToast({ title: '无法发起聊天', icon: 'none' });
    return;
  }

  try {
    const res = await messageApi.createPrivateConversation(userId);
    if (res.data) {
      uni.navigateTo({
        url: `/pages/chat/index?conversationId=${res.data.id}&name=${encodeURIComponent(friend.nickname || '聊天')}`,
      });
    }
  } catch (err) {
    console.error('Open chat failed:', err);
    uni.showToast({ title: '创建会话失败', icon: 'none' });
  }
}

function handleDeleteFriend(friend: Friendship) {
  const userId = friend.user_id || friend.addressee_id;
  if (!userId) return;

  uni.showModal({
    title: '删除好友',
    content: `确定要删除好友「${friend.nickname || '未命名用户'}」吗？`,
    confirmColor: '#D94545',
    success: async (res) => {
      if (res.confirm) {
        try {
          await friendshipApi.deleteFriend(userId);
          uni.showToast({ title: '已删除好友', icon: 'success' });
          await fetchData();
        } catch {
          uni.showToast({ title: '删除失败，请重试', icon: 'none' });
        }
      }
    },
  });
}

// === Add friend panel logic ===

function isSelf(userId: string): boolean {
  return userId === userStore.user?.id;
}

function isFriend(userId: string): boolean {
  return friendUserIds.value.has(userId);
}

async function selectClass(classId: string) {
  selectedClassId.value = classId;
  loadingMembers.value = true;
  try {
    const res = await classApi.getDetail(classId);
    if (res.data) {
      classMembers.value = res.data.members;
    }
  } catch {
    uni.showToast({ title: '加载成员失败', icon: 'none' });
  } finally {
    loadingMembers.value = false;
  }
}

async function sendFriendRequest(userId: string) {
  try {
    await friendshipApi.sendRequest(userId);
    uni.showToast({ title: '好友请求已发送', icon: 'success' });
  } catch (err: any) {
    const msg = err?.message || '发送失败';
    uni.showToast({ title: msg, icon: 'none' });
  }
}

// Load class list when panel opens
import { watch } from 'vue';
watch(showAddPanel, async (val) => {
  if (val) {
    try {
      const res = await classApi.getMyClasses();
      if (res.data) {
        classList.value = res.data;
        if (res.data.length > 0 && !selectedClassId.value) {
          await selectClass(res.data[0].id);
        }
      }
    } catch {
      uni.showToast({ title: '加载班级列表失败', icon: 'none' });
    }
  }
});
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';

.friends-page {
  min-height: 100vh;
  background: $bg-page;
  padding-bottom: 120rpx;
}

// 头部
.page-header {
  @include flex-between;
  background: $bg-card;
  padding: 24rpx 32rpx 0;

  .header-title {
    font-size: $font-2xl;
    font-weight: 700;
    color: $text-primary;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .friend-count {
    font-size: $font-sm;
    color: $text-hint;
  }

  .add-friend-btn {
    width: 56rpx;
    height: 56rpx;
    background: $primary;
    border-radius: 50%;
    @include flex-center;

    .add-icon {
      font-size: 36rpx;
      color: #fff;
      font-weight: 300;
      line-height: 1;
    }
  }
}

// Tab 栏
.tab-bar {
  display: flex;
  background: $bg-card;
  padding: 0 24rpx;
  box-shadow: $shadow-sm;

  .tab-item {
    position: relative;
    padding: 20rpx 24rpx;
    display: flex;
    align-items: center;
    gap: 6rpx;

    .tab-text {
      font-size: $font-base;
      color: $text-hint;
      font-weight: 500;
      transition: all 0.2s;
    }

    &.active {
      .tab-text {
        color: $primary;
        font-weight: 700;
      }
    }

    .tab-line {
      position: absolute;
      bottom: 0;
      left: 24rpx;
      right: 24rpx;
      height: 4rpx;
      background: $primary;
      border-radius: $radius-full;
    }

    .tab-badge {
      min-width: 28rpx;
      height: 28rpx;
      padding: 0 8rpx;
      background: $danger;
      border-radius: $radius-full;
      @include flex-center;

      .badge-num {
        font-size: 18rpx;
        font-weight: 700;
        color: #fff;
      }
    }
  }
}

// 列表区
.list-section {
  padding: 16rpx 24rpx;
}

// 好友卡片
.friend-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background: $bg-card;
  border-radius: $radius-xl;
  margin-bottom: 12rpx;
  box-shadow: $shadow-card;

  .friend-main {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex: 1;
    min-width: 0;
  }

  .friend-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .friend-avatar-placeholder {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .avatar-emoji { font-size: 40rpx; }
  }

  .friend-body {
    flex: 1;
    min-width: 0;

    .friend-name {
      display: block;
      font-size: $font-base;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 4rpx;
    }

    .friend-bio {
      display: block;
      font-size: $font-sm;
      color: $text-hint;
      @include text-ellipsis;
      margin-bottom: 4rpx;
    }

    .friend-type {
      font-size: $font-xs;
      color: $primary;
      background: $primary-bg;
      padding: 2rpx 10rpx;
      border-radius: $radius-full;
    }
  }

  .friend-actions {
    display: flex;
    align-items: center;
    gap: 10rpx;
    flex-shrink: 0;
  }

  .chat-btn {
    padding: 12rpx 24rpx;
    background: $primary;
    border-radius: $radius-full;

    .btn-text {
      font-size: $font-sm;
      font-weight: 600;
      color: #fff;
    }
  }

  .delete-btn {
    width: 48rpx;
    height: 48rpx;
    background: #F5F5F5;
    border-radius: 50%;
    @include flex-center;

    .delete-icon {
      font-size: 32rpx;
      color: #999;
      line-height: 1;
    }
  }
}

// 好友请求
.request-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background: $bg-card;
  border-radius: $radius-xl;
  margin-bottom: 12rpx;
  box-shadow: $shadow-card;

  .request-avatar {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .request-avatar-placeholder {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .avatar-emoji { font-size: 36rpx; }
  }

  .request-body {
    flex: 1;
    min-width: 0;

    .request-name {
      display: block;
      font-size: $font-base;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 4rpx;
    }

    .request-desc {
      font-size: $font-sm;
      color: $text-secondary;
    }
  }

  .request-actions {
    display: flex;
    gap: 8rpx;
    flex-shrink: 0;

    .btn-accept, .btn-reject {
      padding: 10rpx 20rpx;
      border-radius: $radius-full;
      border: none;
      font-size: $font-sm;
      font-weight: 600;

      &::after { border: none; }
    }

    .btn-accept {
      background: $primary;
      color: #fff;
    }

    .btn-reject {
      background: $bg-page;
      color: $text-secondary;
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 48rpx;

  .empty-circle {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background: $bg-green;
    @include flex-center;
    margin-bottom: 24rpx;

    .empty-emoji { font-size: 56rpx; }
  }

  .empty-title {
    font-size: $font-lg;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8rpx;
  }

  .empty-desc {
    font-size: $font-base;
    color: $text-secondary;
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

// === 添加好友弹窗 ===
.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.add-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $bg-card;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 101;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);

  .panel-header {
    @include flex-between;
    padding: 28rpx 32rpx 16rpx;
    border-bottom: 1rpx solid $border-light;

    .panel-title {
      font-size: $font-lg;
      font-weight: 700;
      color: $text-primary;
    }

    .panel-close {
      width: 48rpx;
      height: 48rpx;
      @include flex-center;

      .close-icon {
        font-size: 40rpx;
        color: $text-hint;
        line-height: 1;
      }
    }
  }
}

.class-selector {
  padding: 16rpx 24rpx 0;

  .class-scroll {
    white-space: nowrap;
  }

  .class-chip {
    display: inline-block;
    padding: 10rpx 24rpx;
    margin-right: 12rpx;
    background: $bg-page;
    border-radius: $radius-full;
    border: 2rpx solid transparent;

    &.active {
      background: $primary-bg;
      border-color: $primary;

      .chip-text {
        color: $primary;
        font-weight: 600;
      }
    }

    .chip-text {
      font-size: $font-sm;
      color: $text-secondary;
    }
  }
}

.member-scroll {
  flex: 1;
  max-height: 60vh;
  padding: 12rpx 24rpx;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid $border-light;

  &:last-child { border-bottom: none; }

  .member-avatar-img {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
  }

  .member-avatar-placeholder {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .avatar-emoji { font-size: 32rpx; }
  }

  .member-info {
    flex: 1;
    min-width: 0;

    .member-name {
      display: block;
      font-size: $font-base;
      font-weight: 500;
      color: $text-primary;
    }

    .member-role {
      font-size: $font-xs;
      color: $primary;
    }
  }

  .member-action {
    flex-shrink: 0;
  }

  .status-tag {
    padding: 8rpx 20rpx;
    border-radius: $radius-full;

    .status-text {
      font-size: $font-sm;
      font-weight: 500;
    }
  }

  .self-tag {
    background: $bg-page;
    .status-text { color: $text-hint; }
  }

  .friend-tag {
    background: $primary-bg;
    .status-text { color: $primary; }
  }

  .btn-add {
    padding: 8rpx 24rpx;
    background: $primary;
    border-radius: $radius-full;
    border: none;

    &::after { border: none; }

    .btn-add-text {
      font-size: $font-sm;
      font-weight: 600;
      color: #fff;
    }
  }
}
</style>
