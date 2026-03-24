<template>
  <view class="create-page">
    <!-- 顶部提示卡片 -->
    <view class="header-card">
      <view class="header-icon">
        <text class="icon-emoji">🎓</text>
      </view>
      <view class="header-content">
        <text class="header-title">创建新班级</text>
        <text class="header-desc">创建后将获得邀请码，分享给同学一起拼班</text>
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="form-section">
      <text class="section-title">基本信息</text>

      <view class="form-card">
        <view class="form-item">
          <text class="item-label">班级名称 <text class="required">*</text></text>
          <input
            class="item-input"
            v-model="form.name"
            placeholder="给班级起个名字"
            maxlength="100"
          />
        </view>

        <view class="form-item">
          <text class="item-label">年级标签</text>
          <picker :range="gradeOptions" :value="gradeIndex" @change="onGradeChange">
            <view class="item-picker">
              <text class="picker-text" :class="{ placeholder: !form.grade_tag }">
                {{ form.grade_tag || '请选择（可选）' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
      </view>
    </view>

    <!-- 人数设置 -->
    <view class="form-section">
      <text class="section-title">人数设置</text>

      <view class="form-card">
        <view class="form-item">
          <view class="item-label-group">
            <text class="item-label">最低成班人数</text>
            <text class="item-hint">达到此人数自动成班</text>
          </view>
          <view class="stepper">
            <view class="stepper-btn" @tap="adjustMin(-1)">
              <text class="stepper-icon">−</text>
            </view>
            <text class="stepper-value">{{ form.min_members }}</text>
            <view class="stepper-btn" @tap="adjustMin(1)">
              <text class="stepper-icon">+</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <view class="item-label-group">
            <text class="item-label">最大人数</text>
            <text class="item-hint">班级成员上限</text>
          </view>
          <view class="stepper">
            <view class="stepper-btn" @tap="adjustMax(-1)">
              <text class="stepper-icon">−</text>
            </view>
            <text class="stepper-value">{{ form.max_members }}</text>
            <view class="stepper-btn" @tap="adjustMax(1)">
              <text class="stepper-icon">+</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 规则说明 -->
    <view class="rules-card">
      <view class="rule-item" v-for="(rule, idx) in rules" :key="idx">
        <view class="rule-dot"></view>
        <text class="rule-text">{{ rule }}</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button
        class="btn-submit"
        @tap="handleCreate"
        :loading="loading"
        :disabled="!form.name.trim()"
      >
        创建班级
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useClassStore } from '../../stores/class';

const classStore = useClassStore();
const loading = ref(false);

const gradeOptions = ['不限', '初一', '初二', '初三', '高一', '高二', '高三', '大一', '大二', '大三', '大四'];
const rules = ['拼班期限为 7 天', '达到最低人数自动成班', '创建后获得 8 位邀请码'];

const form = ref({
  name: '',
  grade_tag: '',
  min_members: 2,
  max_members: 10,
});

const gradeIndex = computed(() => {
  const idx = gradeOptions.indexOf(form.value.grade_tag);
  return idx >= 0 ? idx : 0;
});

function onGradeChange(e: any) {
  const val = gradeOptions[e.detail.value];
  form.value.grade_tag = val === '不限' ? '' : val;
}

function adjustMin(delta: number) {
  const next = form.value.min_members + delta;
  if (next >= 2 && next <= 30 && next <= form.value.max_members) {
    form.value.min_members = next;
  }
}

function adjustMax(delta: number) {
  const next = form.value.max_members + delta;
  if (next >= 2 && next <= 60 && next >= form.value.min_members) {
    form.value.max_members = next;
  }
}

async function handleCreate() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入班级名称', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    const cls = await classStore.createClass({
      name: form.value.name.trim(),
      min_members: form.value.min_members,
      max_members: form.value.max_members,
      grade_tag: form.value.grade_tag || undefined,
    });

    if (cls) {
      uni.showModal({
        title: '创建成功',
        content: `邀请码: ${cls.invite_code}\n分享给同学一起拼班吧！`,
        confirmText: '确定',
        showCancel: false,
        success: () => {
          uni.navigateBack();
        },
      });
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';

.create-page {
  min-height: 100vh;
  background: $bg-page;
  padding: 16rpx 24rpx;
  padding-bottom: 160rpx;
}

// 顶部提示卡片
.header-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: $bg-card;
  border-radius: $radius-xl;
  margin-bottom: 20rpx;
  box-shadow: $shadow-card;

  .header-icon {
    width: 72rpx;
    height: 72rpx;
    background: $accent;
    border-radius: $radius-lg;
    @include flex-center;

    .icon-emoji { font-size: 36rpx; }
  }

  .header-content {
    flex: 1;

    .header-title {
      display: block;
      font-size: $font-lg;
      font-weight: 700;
      color: $text-primary;
      margin-bottom: 4rpx;
    }

    .header-desc {
      font-size: $font-sm;
      color: $text-secondary;
    }
  }
}

// 表单区块
.form-section {
  margin-bottom: 20rpx;

  .section-title {
    display: block;
    font-size: $font-sm;
    font-weight: 700;
    color: $text-secondary;
    margin-bottom: 12rpx;
    padding-left: 8rpx;
  }
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

  .item-label {
    display: block;
    font-size: $font-base;
    color: $text-primary;
    font-weight: 600;
    margin-bottom: 12rpx;

    .required { color: $danger; }
  }

  .item-label-group {
    margin-bottom: 12rpx;

    .item-label { margin-bottom: 2rpx; }

    .item-hint {
      display: block;
      font-size: $font-sm;
      color: $text-hint;
    }
  }

  .item-input {
    width: 100%;
    height: 72rpx;
    padding: 0 20rpx;
    background: $bg-input;
    border-radius: $radius-lg;
    font-size: $font-base;
    color: $text-primary;
  }

  .item-picker {
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

// 步进器
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
    transition: all 0.2s;

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

// 规则说明
.rules-card {
  background: $bg-card;
  border-radius: $radius-xl;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: $shadow-card;

  .rule-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 8rpx 0;

    .rule-dot {
      width: 8rpx;
      height: 8rpx;
      background: $accent;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .rule-text {
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

  .btn-submit {
    width: 100%;
    height: 88rpx;
    @include btn-accent;
    @include flex-center;
    font-size: $font-lg;
  }
}
</style>
