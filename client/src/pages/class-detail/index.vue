<template>
  <view class="detail-page" v-if="classStore.currentClass">
    <!-- 状态横幅 -->
    <view class="status-banner" :class="classStore.currentClass.status">
      <view class="banner-content">
        <text class="status-label">{{ statusTitle }}</text>
        <text class="status-desc" v-if="classStore.currentClass.status === 'assembling'">
          还差 {{ remaining }} 人即可成班
        </text>
      </view>
      <view class="banner-icon">
        <text class="icon-emoji">{{ statusEmoji }}</text>
      </view>
    </view>

    <!-- 编辑模式 -->
    <view class="edit-section" v-if="isEditing">
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">班级名称</text>
          <input class="form-input" v-model="editForm.name" placeholder="班级名称" maxlength="100" />
        </view>
        <view class="form-item">
          <text class="form-label">年级标签</text>
          <picker :range="gradeOptions" :value="editGradeIndex" @change="onEditGradeChange">
            <view class="form-picker">
              <text class="picker-text" :class="{ placeholder: !editForm.grade_tag }">
                {{ editForm.grade_tag || '请选择（可选）' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">最低成班人数</text>
          <view class="stepper">
            <view class="stepper-btn" @tap="adjustEditMin(-1)"><text class="stepper-icon">−</text></view>
            <text class="stepper-value">{{ editForm.min_members }}</text>
            <view class="stepper-btn" @tap="adjustEditMin(1)"><text class="stepper-icon">+</text></view>
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">最大人数</text>
          <view class="stepper">
            <view class="stepper-btn" @tap="adjustEditMax(-1)"><text class="stepper-icon">−</text></view>
            <text class="stepper-value">{{ editForm.max_members }}</text>
            <view class="stepper-btn" @tap="adjustEditMax(1)"><text class="stepper-icon">+</text></view>
          </view>
        </view>
      </view>
      <view class="edit-actions">
        <button class="btn-save" @tap="saveEdit" :loading="saving">保存修改</button>
        <button class="btn-cancel" @tap="cancelEdit">取消</button>
      </view>
    </view>

    <!-- 查看模式 - 班级信息卡 -->
    <view class="class-card" v-if="!isEditing">
      <view class="card-header">
        <view class="class-icon" :style="{ background: getIconColor(classStore.currentClass.id) }">
          <text class="icon-letter">{{ classStore.currentClass.name.charAt(0) }}</text>
        </view>
        <view class="class-info">
          <text class="class-name">{{ classStore.currentClass.name }}</text>
          <view class="class-tags">
            <view class="tag-item" v-if="classStore.currentClass.grade_tag">
              <text class="tag-text">{{ classStore.currentClass.grade_tag }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 邀请码 -->
      <view class="invite-box">
        <view class="invite-left">
          <text class="invite-label">班级邀请码</text>
          <text class="invite-code">{{ classStore.currentClass.invite_code }}</text>
        </view>
        <button class="copy-btn" @tap="copyCode">复制</button>
      </view>

      <!-- 成员统计 -->
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-num">{{ classStore.currentClass.current_members }}</text>
          <text class="stat-label">当前人数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ classStore.currentClass.min_members }}</text>
          <text class="stat-label">成班人数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ classStore.currentClass.max_members }}</text>
          <text class="stat-label">最大人数</text>
        </view>
      </view>

      <!-- 进度条 -->
      <view class="progress-section" v-if="classStore.currentClass.status === 'assembling'">
        <view class="progress-header">
          <text class="progress-label">拼班进度</text>
          <text class="progress-value">{{ progressPercent }}%</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
      </view>
    </view>

    <!-- 创建者操作（拼班中才显示） -->
    <view class="creator-actions" v-if="isCreator && isAssembling && !isEditing">
      <view class="action-row">
        <view class="action-btn edit-btn" @tap="startEdit">
          <text class="action-icon">✏️</text>
          <text class="action-label">编辑班级</text>
        </view>
        <view class="action-btn delete-btn" @tap="handleDelete">
          <text class="action-icon">🗑️</text>
          <text class="action-label">删除班级</text>
        </view>
      </view>
    </view>

    <!-- 成员列表 -->
    <view class="members-section" v-if="!isEditing">
      <view class="section-header">
        <text class="section-title">班级成员</text>
        <text class="section-count">{{ classStore.currentClass.members.length }}人</text>
      </view>

      <view class="member-list">
        <view class="member-card" v-for="m in classStore.currentClass.members" :key="m.id" @tap="onMemberTap(m)">
          <image v-if="m.avatar" class="member-avatar" :src="m.avatar" mode="aspectFill" />
          <view v-else class="member-avatar-placeholder" :style="{ background: getAvatarBgColor(m.gender, m.user_id) }">
            <text class="avatar-emoji">{{ getAvatarEmoji(m.gender, m.user_id) }}</text>
          </view>
          <view class="member-info">
            <text class="member-name">{{ m.nickname || '未命名' }}</text>
            <view class="member-role" v-if="m.role !== 'member'">
              <text class="role-text">{{ roleText(m.role) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 成员操作弹窗 -->
    <view class="mask" v-if="showMemberAction" @tap="showMemberAction = false"></view>
    <view class="member-action-sheet" v-if="showMemberAction && selectedMember">
      <view class="sheet-header">
        <view v-if="selectedMember.avatar" class="sheet-avatar">
          <image :src="selectedMember.avatar" class="sheet-avatar-img" mode="aspectFill" />
        </view>
        <view v-else class="sheet-avatar-placeholder" :style="{ background: getAvatarBgColor(selectedMember.gender, selectedMember.user_id) }">
          <text class="avatar-emoji">{{ getAvatarEmoji(selectedMember.gender, selectedMember.user_id) }}</text>
        </view>
        <text class="sheet-name">{{ selectedMember.nickname || '未命名' }}</text>
      </view>
      <view class="sheet-body">
        <view class="sheet-item" @tap="addFriend(selectedMember)">
          <text class="sheet-icon">👋</text>
          <text class="sheet-text">加为好友</text>
        </view>
        <view class="sheet-item" @tap="chatWithMember(selectedMember)">
          <text class="sheet-icon">💬</text>
          <text class="sheet-text">发消息</text>
        </view>
      </view>
      <view class="sheet-cancel" @tap="showMemberAction = false">
        <text class="cancel-text">取消</text>
      </view>
    </view>

    <!-- 底部邀请栏 -->
    <view class="bottom-bar" v-if="!isEditing && !showMemberAction">
      <button class="btn-invite" open-type="share">邀请同学加入</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app';
import { useClassStore } from '../../stores/class';
import { useUserStore } from '../../stores/user';
import { getAvatarBgColor, getAvatarEmoji } from '../../composables/useAvatar';
import { friendshipApi } from '../../services/friendship';
import { messageApi } from '../../services/message';
import type { ClassMember } from '../../types';

const classStore = useClassStore();
const userStore = useUserStore();

const isEditing = ref(false);
const saving = ref(false);
const gradeOptions = ['不限', '初一', '初二', '初三', '高一', '高二', '高三', '大一', '大二', '大三', '大四'];

const editForm = ref({
  name: '',
  grade_tag: '',
  min_members: 2,
  max_members: 10,
});

const isCreator = computed(() =>
  classStore.currentClass?.creator_id === userStore.user?.id
);

const isAssembling = computed(() =>
  classStore.currentClass?.status === 'assembling'
);

const editGradeIndex = computed(() => {
  const idx = gradeOptions.indexOf(editForm.value.grade_tag);
  return idx >= 0 ? idx : 0;
});

onLoad(async (options) => {
  if (options?.id) {
    await classStore.fetchClassDetail(options.id);
  }
  if (!userStore.user) {
    await userStore.fetchMe();
  }
});

const statusTitle = computed(() => {
  const map: Record<string, string> = {
    assembling: '拼班进行中',
    active: '班级已激活',
    dissolved: '班级已解散',
  };
  return map[classStore.currentClass?.status || ''] || '';
});

const statusEmoji = computed(() => {
  const map: Record<string, string> = {
    assembling: '🔥',
    active: '✅',
    dissolved: '📦',
  };
  return map[classStore.currentClass?.status || ''] || '';
});

const remaining = computed(() => {
  const cls = classStore.currentClass;
  if (!cls) return 0;
  return Math.max(0, cls.min_members - cls.current_members);
});

const progressPercent = computed(() => {
  const cls = classStore.currentClass;
  if (!cls) return 0;
  return Math.min(100, Math.round((cls.current_members / cls.min_members) * 100));
});

const colors = ['#2E7D6F', '#5BA4E6', '#E8A838', '#D94545'];

function getIconColor(id: string): string {
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
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

function copyCode() {
  const code = classStore.currentClass?.invite_code;
  if (code) {
    uni.setClipboardData({
      data: code,
      success: () => uni.showToast({ title: '已复制邀请码', icon: 'success' }),
    });
  }
}

function startEdit() {
  const cls = classStore.currentClass;
  if (!cls) return;
  editForm.value = {
    name: cls.name,
    grade_tag: cls.grade_tag || '',
    min_members: cls.min_members,
    max_members: cls.max_members,
  };
  isEditing.value = true;
}

function cancelEdit() {
  isEditing.value = false;
}

function onEditGradeChange(e: any) {
  const val = gradeOptions[e.detail.value];
  editForm.value.grade_tag = val === '不限' ? '' : val;
}

function adjustEditMin(delta: number) {
  const next = editForm.value.min_members + delta;
  if (next >= 2 && next <= 30 && next <= editForm.value.max_members) {
    editForm.value.min_members = next;
  }
}

function adjustEditMax(delta: number) {
  const next = editForm.value.max_members + delta;
  const currentMembers = classStore.currentClass?.current_members || 0;
  if (next >= 2 && next <= 60 && next >= editForm.value.min_members && next >= currentMembers) {
    editForm.value.max_members = next;
  }
}

async function saveEdit() {
  if (!editForm.value.name.trim()) {
    uni.showToast({ title: '请输入班级名称', icon: 'none' });
    return;
  }
  const cls = classStore.currentClass;
  if (!cls) return;

  saving.value = true;
  try {
    await classStore.updateClass(cls.id, {
      name: editForm.value.name.trim(),
      min_members: editForm.value.min_members,
      max_members: editForm.value.max_members,
      grade_tag: editForm.value.grade_tag || undefined,
    });
    isEditing.value = false;
    uni.showToast({ title: '修改成功', icon: 'success' });
    // Refresh detail
    await classStore.fetchClassDetail(cls.id);
  } catch {
  } finally {
    saving.value = false;
  }
}

function handleDelete() {
  const cls = classStore.currentClass;
  if (!cls) return;
  uni.showModal({
    title: '确认删除',
    content: `确定要删除班级「${cls.name}」吗？此操作不可撤销，所有成员和聊天记录将被清除。`,
    confirmColor: '#D94545',
    success: async (res) => {
      if (res.confirm) {
        try {
          await classStore.deleteClass(cls.id);
          uni.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => {
            uni.navigateBack();
          }, 1000);
        } catch {
        }
      }
    },
  });
}

// === Member action popup ===
const showMemberAction = ref(false);
const selectedMember = ref<ClassMember | null>(null);

function onMemberTap(member: ClassMember) {
  if (member.user_id === userStore.user?.id) return; // Don't show for self
  selectedMember.value = member;
  showMemberAction.value = true;
}

async function addFriend(member: ClassMember) {
  showMemberAction.value = false;
  try {
    await friendshipApi.sendRequest(member.user_id);
    uni.showToast({ title: '好友请求已发送', icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: err?.message || '发送失败', icon: 'none' });
  }
}

async function chatWithMember(member: ClassMember) {
  showMemberAction.value = false;
  try {
    const res = await messageApi.createPrivateConversation(member.user_id);
    if (res.data) {
      uni.navigateTo({
        url: `/pages/chat/index?conversationId=${res.data.id}&name=${encodeURIComponent(member.nickname || '聊天')}`,
      });
    }
  } catch {
    uni.showToast({ title: '创建会话失败', icon: 'none' });
  }
}

onShareAppMessage(() => {
  const cls = classStore.currentClass;
  return {
    title: `来加入「${cls?.name}」班级吧！`,
    path: `/pages/class-join/index?code=${cls?.invite_code}`,
  };
});
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';

.detail-page {
  min-height: 100vh;
  background: $bg-page;
  padding-bottom: 160rpx;
}

// 状态横幅
.status-banner {
  @include flex-between;
  padding: 28rpx 24rpx;

  &.assembling { background: linear-gradient(135deg, #E8A838 0%, #F0C060 100%); }
  &.active { background: linear-gradient(135deg, $primary 0%, $primary-light 100%); }
  &.dissolved { background: linear-gradient(135deg, #9CA3AF 0%, #B0B8C4 100%); }

  .banner-content {
    .status-label {
      display: block;
      font-size: $font-xl;
      font-weight: 700;
      color: #fff;
    }

    .status-desc {
      display: block;
      font-size: $font-sm;
      color: rgba(255, 255, 255, 0.85);
      margin-top: 4rpx;
    }
  }

  .banner-icon {
    .icon-emoji { font-size: 48rpx; }
  }
}

// 班级信息卡
.class-card {
  margin: 16rpx 24rpx;
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 24rpx;
  box-shadow: $shadow-card;

  .card-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid $border-light;
    margin-bottom: 20rpx;
  }

  .class-icon {
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

  .class-info {
    flex: 1;

    .class-name {
      display: block;
      font-size: $font-lg;
      font-weight: 700;
      color: $text-primary;
      margin-bottom: 6rpx;
    }

    .class-tags {
      display: flex;
      gap: 8rpx;

      .tag-item {
        padding: 4rpx 14rpx;
        background: $primary-bg;
        border-radius: $radius-full;

        .tag-text {
          font-size: $font-xs;
          color: $primary;
        }
      }
    }
  }
}

// 邀请码
.invite-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background: $bg-input;
  border-radius: $radius-lg;
  margin-bottom: 20rpx;

  .invite-left {
    .invite-label {
      display: block;
      font-size: $font-sm;
      color: $text-hint;
      margin-bottom: 4rpx;
    }

    .invite-code {
      font-size: 40rpx;
      font-weight: 700;
      color: $primary;
      letter-spacing: 4rpx;
    }
  }

  .copy-btn {
    padding: 10rpx 24rpx;
    background: $primary;
    border-radius: $radius-full;
    border: none;
    font-size: $font-sm;
    font-weight: 600;
    color: #fff;

    &::after { border: none; }
  }
}

// 统计行
.stats-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-top: 1rpx solid $border-light;
  border-bottom: 1rpx solid $border-light;

  .stat-item {
    flex: 1;
    text-align: center;

    .stat-num {
      display: block;
      font-size: 36rpx;
      font-weight: 700;
      color: $primary;
    }

    .stat-label {
      display: block;
      font-size: $font-xs;
      color: $text-hint;
      margin-top: 2rpx;
    }
  }

  .stat-divider {
    width: 1rpx;
    height: 40rpx;
    background: $border-light;
  }
}

// 进度条
.progress-section {
  margin-top: 20rpx;

  .progress-header {
    @include flex-between;
    margin-bottom: 10rpx;

    .progress-label {
      font-size: $font-sm;
      color: $text-secondary;
    }

    .progress-value {
      font-size: $font-sm;
      font-weight: 700;
      color: $warning;
    }
  }

  .progress-bar {
    height: 10rpx;
    background: rgba(232, 168, 56, 0.2);
    border-radius: $radius-full;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, $warning, #F0C060);
      border-radius: $radius-full;
      transition: width 0.5s ease;
    }
  }
}

// 创建者操作
.creator-actions {
  margin: 16rpx 24rpx;

  .action-row {
    display: flex;
    gap: 12rpx;
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 20rpx;
    border-radius: $radius-xl;
    box-shadow: $shadow-card;

    .action-icon { font-size: 28rpx; }
    .action-label { font-size: $font-base; font-weight: 600; }
  }

  .edit-btn {
    background: $bg-card;
    .action-label { color: $primary; }
  }

  .delete-btn {
    background: $bg-card;
    .action-label { color: $danger; }
  }
}

// 编辑表单
.edit-section {
  margin: 16rpx 24rpx;
}

.form-card {
  background: $bg-card;
  border-radius: $radius-xl;
  overflow: hidden;
  box-shadow: $shadow-card;
}

.form-item {
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid $border-light;

  &:last-child { border-bottom: none; }

  .form-label {
    display: block;
    font-size: $font-base;
    color: $text-primary;
    font-weight: 600;
    margin-bottom: 12rpx;
  }

  .form-input {
    width: 100%;
    height: 72rpx;
    padding: 0 20rpx;
    background: $bg-input;
    border-radius: $radius-lg;
    font-size: $font-base;
    color: $text-primary;
  }

  .form-picker {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72rpx;
    padding: 0 20rpx;
    background: $bg-input;
    border-radius: $radius-lg;

    .picker-text {
      font-size: $font-base;
      color: $text-primary;
      &.placeholder { color: $text-hint; }
    }

    .picker-arrow {
      font-size: $font-lg;
      color: $text-hint;
    }
  }
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28rpx;

  .stepper-btn {
    width: 60rpx;
    height: 60rpx;
    background: $bg-input;
    border-radius: 50%;
    @include flex-center;

    &:active {
      background: $primary;
      .stepper-icon { color: #fff; }
    }

    .stepper-icon {
      font-size: 32rpx;
      color: $text-primary;
      font-weight: 300;
    }
  }

  .stepper-value {
    min-width: 64rpx;
    text-align: center;
    font-size: 40rpx;
    font-weight: 700;
    color: $primary;
  }
}

.edit-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 24rpx;

  .btn-save {
    height: 88rpx;
    background: $primary;
    color: #fff;
    font-size: $font-lg;
    font-weight: 600;
    border-radius: $radius-full;
    @include flex-center;
    border: none;

    &::after { border: none; }
  }

  .btn-cancel {
    height: 88rpx;
    background: $bg-card;
    border: 2rpx solid $border-light;
    border-radius: $radius-full;
    font-size: $font-base;
    color: $text-secondary;
    @include flex-center;

    &::after { border: none; }
  }
}

// 成员列表
.members-section {
  margin: 20rpx 24rpx;

  .section-header {
    @include flex-between;
    margin-bottom: 16rpx;

    .section-title {
      font-size: $font-base;
      font-weight: 700;
      color: $text-primary;
    }

    .section-count {
      font-size: $font-sm;
      color: $text-hint;
    }
  }

  .member-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
  }

  .member-card {
    width: calc(50% - 6rpx);
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 16rpx;
    background: $bg-card;
    border-radius: $radius-xl;
    box-shadow: $shadow-card;

    .member-avatar {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      flex-shrink: 0;
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
        @include text-ellipsis;
      }

      .member-role {
        display: inline-block;
        margin-top: 4rpx;

        .role-text {
          font-size: $font-xs;
          color: $primary;
          background: $primary-bg;
          padding: 2rpx 10rpx;
          border-radius: $radius-full;
        }
      }
    }
  }
}

// 成员操作弹窗
.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.member-action-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $bg-card;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 101;
  padding-bottom: env(safe-area-inset-bottom);

  .sheet-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 28rpx 32rpx;
    border-bottom: 1rpx solid $border-light;

    .sheet-avatar-img {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
    }

    .sheet-avatar-placeholder {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      .avatar-emoji { font-size: 32rpx; }
    }

    .sheet-name {
      font-size: $font-lg;
      font-weight: 700;
      color: $text-primary;
    }
  }

  .sheet-body {
    padding: 12rpx 0;
  }

  .sheet-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 24rpx 32rpx;

    &:active { background: $bg-page; }

    .sheet-icon { font-size: 36rpx; }

    .sheet-text {
      font-size: $font-base;
      color: $text-primary;
      font-weight: 500;
    }
  }

  .sheet-cancel {
    border-top: 1rpx solid $border-light;
    padding: 24rpx;
    @include flex-center;

    .cancel-text {
      font-size: $font-base;
      color: $text-hint;
    }
  }
}

// 底部栏
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: $bg-card;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.04);

  .btn-invite {
    width: 100%;
    height: 88rpx;
    @include btn-accent;
    @include flex-center;
    font-size: $font-lg;
  }
}
</style>
