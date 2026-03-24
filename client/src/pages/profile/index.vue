<template>
  <view class="profile-page">
    <!-- 顶部会员卡区域 -->
    <view class="profile-hero">
      <view class="hero-bg"></view>
      <view class="hero-content" :style="{ paddingTop: (statusBarHeight + 12) + 'px' }">
        <view class="user-row">
          <view class="avatar-wrap" @tap="isEditing ? chooseAvatar() : undefined">
            <!-- 有头像用头像 -->
            <image
              v-if="userStore.user?.avatar"
              class="avatar"
              :src="userStore.user.avatar"
              mode="aspectFill"
            />
            <!-- 无头像用emoji占位 -->
            <view v-else class="avatar-placeholder" :style="{ background: avatarBgColor }">
              <text class="avatar-emoji">{{ avatarEmoji }}</text>
            </view>
            <view class="avatar-badge" v-if="isEditing">
              <text class="badge-icon">📷</text>
            </view>
          </view>
          <view class="user-detail">
            <text class="user-name">{{ userStore.user?.nickname || '未设置昵称' }}</text>
            <view class="user-meta">
              <view class="meta-tag" v-if="userStore.user?.grade">
                <text class="tag-text">{{ userStore.user.grade }}</text>
              </view>
              <view class="meta-tag" v-if="userStore.user?.gender">
                <text class="tag-text">{{ genderText }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 虚拟班级卡 -->
        <view class="member-card">
          <view class="card-brand">
            <text class="brand-icon">🎓</text>
            <text class="brand-text">虚拟班级</text>
          </view>
          <text class="card-slogan">去标签化社交 · 平等交流学习</text>
        </view>

        <!-- 快捷入口 -->
        <view class="quick-row">
          <view class="quick-item" @tap="handleEditProfile">
            <text class="quick-icon">✏️</text>
            <text class="quick-text">编辑资料</text>
          </view>
          <view class="quick-divider"></view>
          <view class="quick-item" @tap="handleGoClass">
            <text class="quick-icon">🎫</text>
            <text class="quick-text">我的班级</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 信息卡片 - 编辑模式 -->
    <view class="info-section" v-if="isEditing">
      <text class="section-label">编辑资料</text>
      <view class="info-card">
        <view class="info-item">
          <text class="item-label">昵称 <text style="color:#D94545;">*</text></text>
          <view class="item-right">
            <input
              class="item-input"
              v-model="form.nickname"
              placeholder="请输入昵称"
              maxlength="50"
            />
          </view>
        </view>
        <view class="info-item">
          <text class="item-label">性别 <text style="color:#D94545;">*</text></text>
          <view class="item-right">
            <picker
              :range="genderOptions"
              :value="genderPickerIndex"
              @change="onGenderChange"
            >
              <view class="item-picker">
                <text class="picker-text" :class="{ placeholder: !form.gender }">
                  {{ form.gender ? genderOptions[form.gender - 1] : '请选择' }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
        </view>
        <view class="info-item">
          <text class="item-label">出生年份 <text style="color:#D94545;">*</text></text>
          <view class="item-right">
            <input
              class="item-input"
              v-model="form.birth_year"
              type="number"
              placeholder="如 2005"
            />
          </view>
        </view>
        <view class="info-item">
          <text class="item-label">年级</text>
          <view class="item-right">
            <picker
              :range="gradeOptions"
              :value="gradeIndex"
              @change="onGradeChange"
            >
              <view class="item-picker">
                <text class="picker-text" :class="{ placeholder: !form.grade }">
                  {{ form.grade || '请选择' }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
        </view>
        <view class="info-item bio-item">
          <text class="item-label">个性签名</text>
          <textarea
            class="bio-input"
            v-model="form.bio"
            placeholder="介绍一下自己吧~"
            maxlength="500"
            :auto-height="true"
          />
        </view>
      </view>

      <view class="edit-actions">
        <button class="btn-save" @tap="saveProfile" :loading="saving">保存资料</button>
        <button class="btn-cancel" @tap="cancelEdit">取消</button>
      </view>
    </view>

    <!-- 功能菜单 - 查看模式 -->
    <view class="menu-section" v-if="!isEditing">
      <text class="section-label">个人服务</text>
      <view class="service-grid">
        <view class="service-item" @tap="handleEditProfile">
          <view class="service-icon" style="background: #E8F5F0;">
            <text class="icon-emoji">📝</text>
          </view>
          <text class="service-text">编辑资料</text>
        </view>
        <view class="service-item" @tap="handleGoClass">
          <view class="service-icon" style="background: #FFF3C4;">
            <text class="icon-emoji">📚</text>
          </view>
          <text class="service-text">我的班级</text>
        </view>
        <view class="service-item" @tap="handleGoFriends">
          <view class="service-icon" style="background: #E8F0FE;">
            <text class="icon-emoji">👫</text>
          </view>
          <text class="service-text">我的好友</text>
        </view>
        <view class="service-item" @tap="handleGoMessages">
          <view class="service-icon" style="background: #FFE4E4;">
            <text class="icon-emoji">💬</text>
          </view>
          <text class="service-text">我的消息</text>
        </view>
      </view>
    </view>

    <!-- 个人信息展示 -->
    <view class="info-section" v-if="!isEditing">
      <text class="section-label">基本信息</text>
      <view class="info-card">
        <view class="info-item">
          <text class="item-label">昵称</text>
          <text class="item-value" :class="{ placeholder: !userStore.user?.nickname }">
            {{ userStore.user?.nickname || '未设置' }}
          </text>
        </view>
        <view class="info-item">
          <text class="item-label">性别</text>
          <text class="item-value" :class="{ placeholder: !userStore.user?.gender }">
            {{ genderText }}
          </text>
        </view>
        <view class="info-item">
          <text class="item-label">出生年份</text>
          <text class="item-value" :class="{ placeholder: !userStore.user?.birth_year }">
            {{ userStore.user?.birth_year || '未设置' }}
          </text>
        </view>
        <view class="info-item">
          <text class="item-label">年级</text>
          <text class="item-value" :class="{ placeholder: !userStore.user?.grade }">
            {{ userStore.user?.grade || '未设置' }}
          </text>
        </view>
        <view class="info-item">
          <text class="item-label">个性签名</text>
          <text class="item-value bio" :class="{ placeholder: !userStore.user?.bio }">
            {{ userStore.user?.bio || '这个人很懒，什么也没写~' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="action-section" v-if="!isEditing">
      <view class="action-item danger" @tap="handleLogout">
        <text class="action-text">退出登录</text>
        <text class="action-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user';
import { getAvatarBgColor, getAvatarEmoji } from '../../composables/useAvatar';

const userStore = useUserStore();
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;
const isEditing = ref(false);
const saving = ref(false);

const genderOptions = ['男', '女'];
const gradeOptions = ['初一', '初二', '初三', '高一', '高二', '高三', '大一', '大二', '大三', '大四'];

const form = ref({
  nickname: '',
  gender: 0,
  birth_year: '',
  grade: '',
  bio: '',
});

const genderText = computed(() => {
  const g = userStore.user?.gender;
  if (g === 1) return '男';
  if (g === 2) return '女';
  return '未设置';
});

const genderPickerIndex = computed(() => {
  return form.value.gender ? form.value.gender - 1 : 0;
});

const gradeIndex = computed(() => {
  const idx = gradeOptions.indexOf(form.value.grade);
  return idx >= 0 ? idx : 0;
});

const avatarBgColor = computed(() => getAvatarBgColor(userStore.user?.gender, userStore.user?.id));
const avatarEmoji = computed(() => getAvatarEmoji(userStore.user?.gender, userStore.user?.id));

onLoad((options) => {
  if (options?.edit === '1') {
    isEditing.value = true;
  }
});

onShow(() => {
  if (userStore.isEditingProfile) {
    userStore.isEditingProfile = false;
    isEditing.value = true;
  }
});

onMounted(async () => {
  if (!userStore.user) {
    await userStore.fetchMe();
  }
  fillForm();
});

function fillForm() {
  const u = userStore.user;
  if (u) {
    form.value = {
      nickname: u.nickname || '',
      gender: u.gender || 0,
      birth_year: u.birth_year ? String(u.birth_year) : '',
      grade: u.grade || '',
      bio: u.bio || '',
    };
  }
}

function handleEditProfile() {
  fillForm();
  isEditing.value = true;
}

function handleGoClass() {
  uni.switchTab({ url: '/pages/home/index' });
}

function handleGoFriends() {
  uni.switchTab({ url: '/pages/friends/index' });
}

function handleGoMessages() {
  uni.switchTab({ url: '/pages/conversations/index' });
}

function cancelEdit() {
  isEditing.value = false;
  fillForm();
}

function onGenderChange(e: any) {
  form.value.gender = Number(e.detail.value) + 1; // 0→男(1), 1→女(2)
}

function onGradeChange(e: any) {
  form.value.grade = gradeOptions[e.detail.value];
}

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: () => {
      uni.showToast({ title: '头像上传功能即将上线', icon: 'none' });
    },
  });
}

async function saveProfile() {
  if (!form.value.nickname?.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }
  if (!form.value.gender) {
    uni.showToast({ title: '请选择性别', icon: 'none' });
    return;
  }
  if (!form.value.birth_year) {
    uni.showToast({ title: '请填写出生年份', icon: 'none' });
    return;
  }

  saving.value = true;
  try {
    await userStore.updateProfile({
      nickname: form.value.nickname.trim(),
      gender: form.value.gender,
      birth_year: Number(form.value.birth_year),
      grade: form.value.grade || undefined,
      bio: form.value.bio?.trim() || undefined,
    });
    isEditing.value = false;
    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch {
  } finally {
    saving.value = false;
  }
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    confirmColor: '#2E7D6F',
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
      }
    },
  });
}
</script>

<style lang="scss">
/* 不用scoped，确保小程序样式生效 */
@import '../../styles/variables.scss';

.profile-page {
  min-height: 100vh;
  background: $bg-page;
  padding-bottom: 140rpx;
}

/* 顶部英雄区 */
.profile-hero {
  position: relative;
  overflow: hidden;
}

.profile-hero .hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(135deg, #E8F5F0 0%, #D4EDE5 100%);
}

.profile-hero .hero-content {
  position: relative;
  padding: 24rpx;
  padding-top: 24rpx;
}

/* 用户行 */
.profile-page .user-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.profile-page .avatar-wrap {
  position: relative;
  margin-right: 20rpx;
}

.profile-page .avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.8);
}

.profile-page .avatar-placeholder {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-page .avatar-emoji {
  font-size: 52rpx;
}

.profile-page .avatar-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 36rpx;
  height: 36rpx;
  background: #FBD914;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-page .badge-icon {
  font-size: 18rpx;
}

.profile-page .user-detail {
  flex: 1;
}

.profile-page .user-name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 8rpx;
}

.profile-page .user-meta {
  display: flex;
  gap: 8rpx;
}

.profile-page .meta-tag {
  padding: 4rpx 14rpx;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 9999rpx;
}

.profile-page .meta-tag .tag-text {
  font-size: 22rpx;
  color: #1B5E50;
}

/* 会员卡 */
.profile-page .member-card {
  background: linear-gradient(135deg, #2E7D6F 0%, #3A9E8E 100%);
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
}

.profile-page .card-brand {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.profile-page .brand-icon {
  font-size: 28rpx;
}

.profile-page .brand-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
}

.profile-page .card-slogan {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 快捷入口 */
.profile-page .quick-row {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24rpx;
  padding: 20rpx 0;
}

.profile-page .quick-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.profile-page .quick-icon {
  font-size: 28rpx;
}

.profile-page .quick-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #1A1A1A;
}

.profile-page .quick-divider {
  width: 1rpx;
  height: 32rpx;
  background: #EEEEEE;
}

/* 服务网格 */
.profile-page .menu-section {
  padding: 24rpx;
}

.profile-page .section-label {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 16rpx;
}

.profile-page .service-grid {
  display: flex;
  flex-wrap: wrap;
  background: #FFFFFF;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.profile-page .service-item {
  width: 25%;
  padding: 28rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.profile-page .service-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}

.profile-page .icon-emoji {
  font-size: 36rpx;
}

.profile-page .service-text {
  font-size: 24rpx;
  color: #5C5C5C;
}

/* 信息区块 */
.profile-page .info-section {
  padding: 0 24rpx;
  margin-bottom: 16rpx;
}

.profile-page .info-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.profile-page .info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.profile-page .info-item:last-child {
  border-bottom: none;
}

.profile-page .bio-item {
  flex-direction: column;
  align-items: flex-start;
}

.profile-page .bio-item .item-label {
  margin-bottom: 12rpx;
}

.profile-page .item-label {
  font-size: 28rpx;
  color: #5C5C5C;
  font-weight: 500;
}

.profile-page .item-value {
  font-size: 28rpx;
  color: #1A1A1A;
}

.profile-page .item-value.placeholder {
  color: #999;
}

.profile-page .item-value.bio {
  max-width: 400rpx;
  text-align: right;
}

.profile-page .item-right {
  flex: 1;
  text-align: right;
}

.profile-page .item-input {
  width: 100%;
  text-align: right;
  font-size: 28rpx;
  color: #1A1A1A;
}

.profile-page .item-picker {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
}

.profile-page .picker-text {
  font-size: 28rpx;
  color: #1A1A1A;
}

.profile-page .picker-text.placeholder {
  color: #999;
}

.profile-page .picker-arrow {
  font-size: 32rpx;
  color: #999;
}

.profile-page .bio-input {
  width: 100%;
  min-height: 80rpx;
  font-size: 28rpx;
  color: #1A1A1A;
  line-height: 1.6;
}

/* 编辑操作 */
.profile-page .edit-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 24rpx;
  padding: 0 24rpx;
}

.profile-page .btn-save {
  height: 88rpx;
  background: #2E7D6F;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 9999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.profile-page .btn-save::after {
  border: none;
}

.profile-page .btn-cancel {
  height: 88rpx;
  background: #FFFFFF;
  border: 2rpx solid #EEEEEE;
  border-radius: 9999rpx;
  font-size: 28rpx;
  color: #5C5C5C;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-page .btn-cancel::after {
  border: none;
}

/* 操作区 */
.profile-page .action-section {
  padding: 16rpx 24rpx;
}

.profile-page .action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.profile-page .action-item.danger .action-text {
  color: #D94545;
  font-weight: 500;
}

.profile-page .action-text {
  font-size: 28rpx;
  color: #1A1A1A;
}

.profile-page .action-arrow {
  font-size: 32rpx;
  color: #999;
}
</style>
