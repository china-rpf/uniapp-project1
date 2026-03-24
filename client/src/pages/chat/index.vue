<template>
  <view class="chat-page">
    <!-- 消息列表 -->
    <scroll-view
      class="message-list"
      :scroll-y="true"
      :scroll-into-view="scrollAnchor"
      @scrolltoupper="loadMore"
    >
      <view style="height: 20rpx;"></view>

      <view v-for="msg in chatStore.messages" :key="msg.id" :id="'msg-' + msg.id">
        <!-- 撤回消息 -->
        <view class="msg-recalled" v-if="msg.recalled">
          <text class="recalled-text">消息已撤回</text>
        </view>

        <!-- 对方消息（左侧） -->
        <view class="msg-row msg-left" v-else-if="msg.sender_id !== userStore.user?.id">
          <image
            v-if="msg.sender?.avatar"
            class="msg-avatar"
            :src="msg.sender.avatar"
            mode="aspectFill"
          />
          <view v-else class="msg-avatar-placeholder" :style="{ background: getAvatarBgColor(msg.sender?.gender, msg.sender_id) }">
            <text class="avatar-emoji">{{ getAvatarEmoji(msg.sender?.gender, msg.sender_id) }}</text>
          </view>
          <view class="msg-body">
            <text class="msg-name">{{ msg.sender?.nickname || '匿名用户' }}</text>
            <image
              class="bubble-img"
              v-if="msg.type === 'image'"
              :src="fullUrl(msg.content)"
              mode="widthFix"
              @tap="previewImage(fullUrl(msg.content))"
            />
            <view class="msg-bubble bubble-left" v-else>
              <text class="bubble-text" v-if="msg.type === 'text'">{{ msg.content }}</text>
              <view class="voice-bubble" v-else-if="msg.type === 'voice'" @tap="playVoice(msg.content)">
                <text class="voice-icon">🎵</text>
                <view class="voice-bars">
                  <view class="voice-bar"></view>
                  <view class="voice-bar"></view>
                  <view class="voice-bar"></view>
                </view>
                <text class="voice-duration">语音</text>
              </view>
              <view class="audio-bubble" v-else-if="msg.type === 'audio'" @tap="playVoice(msg.content)">
                <text class="audio-icon">🎵</text>
                <view class="audio-info">
                  <text class="audio-title">{{ msg.metadata?.filename || '音频文件' }}</text>
                  <text class="audio-size">{{ formatFileSize(msg.metadata?.size) }}</text>
                </view>
              </view>
              <view class="file-bubble" v-else-if="msg.type === 'file'" @tap="openFile(msg.content)">
                <text class="file-icon">📄</text>
                <view class="file-info">
                  <text class="file-name">{{ msg.metadata?.filename || '文件' }}</text>
                  <text class="file-size">{{ formatFileSize(msg.metadata?.size) }}</text>
                </view>
              </view>
              <view class="file-bubble" v-else>
                <text class="file-icon">📎</text>
                <text class="file-name bubble-text">{{ msg.content }}</text>
              </view>
            </view>
            <text class="msg-time">{{ formatTime(msg.created_at) }}</text>
          </view>
        </view>

        <!-- 自己消息（右侧） -->
        <view class="msg-row msg-right" v-else>
          <view class="msg-body">
            <image
              class="bubble-img"
              v-if="msg.type === 'image'"
              :src="fullUrl(msg.content)"
              mode="widthFix"
              @tap="previewImage(fullUrl(msg.content))"
            />
            <view class="msg-bubble bubble-right" v-else>
              <text class="bubble-text-self" v-if="msg.type === 'text'">{{ msg.content }}</text>
              <view class="voice-bubble voice-bubble-self" v-else-if="msg.type === 'voice'" @tap="playVoice(msg.content)">
                <text class="voice-duration-self">语音</text>
                <view class="voice-bars">
                  <view class="voice-bar voice-bar-self"></view>
                  <view class="voice-bar voice-bar-self"></view>
                  <view class="voice-bar voice-bar-self"></view>
                </view>
                <text class="voice-icon-self">🎵</text>
              </view>
              <view class="audio-bubble audio-bubble-self" v-else-if="msg.type === 'audio'" @tap="playVoice(msg.content)">
                <text class="audio-icon-self">🎵</text>
                <view class="audio-info">
                  <text class="audio-title-self">{{ msg.metadata?.filename || '音频文件' }}</text>
                  <text class="audio-size-self">{{ formatFileSize(msg.metadata?.size) }}</text>
                </view>
              </view>
              <view class="file-bubble file-bubble-self" v-else-if="msg.type === 'file'" @tap="openFile(msg.content)">
                <text class="file-icon-self">📄</text>
                <view class="file-info">
                  <text class="file-name-self">{{ msg.metadata?.filename || '文件' }}</text>
                  <text class="file-size-self">{{ formatFileSize(msg.metadata?.size) }}</text>
                </view>
              </view>
              <view class="file-bubble" v-else>
                <text class="file-icon">📎</text>
                <text class="file-name bubble-text-self">{{ msg.content }}</text>
              </view>
            </view>
            <text class="msg-time msg-time-right">{{ formatTime(msg.created_at) }}</text>
          </view>
          <image
            v-if="userStore.user?.avatar"
            class="msg-avatar"
            :src="userStore.user.avatar"
            mode="aspectFill"
          />
          <view v-else class="msg-avatar-placeholder" :style="{ background: selfAvatarBg }">
            <text class="avatar-emoji">{{ selfAvatarEmoji }}</text>
          </view>
        </view>
      </view>

      <view style="height: 20rpx;" id="msg-bottom"></view>
    </scroll-view>

    <!-- 输入区域 -->
    <view class="input-bar">
      <view class="plus-btn" @tap="togglePanel">
        <text class="plus-icon">{{ showPanel ? '×' : '+' }}</text>
      </view>
      <input
        class="input-field"
        v-model="inputText"
        placeholder="输入消息..."
        :adjust-position="true"
        confirm-type="send"
        @confirm="sendMessage"
        @focus="showPanel = false"
      />
      <view class="send-btn" :class="{ 'send-active': inputText.trim() }" @tap="sendMessage">
        <text class="send-icon">➤</text>
      </view>
    </view>

    <!-- 多媒体操作面板 -->
    <view class="action-panel" v-if="showPanel">
      <view class="panel-grid">
        <view class="panel-item" @tap="chooseImage">
          <view class="panel-icon-wrap" style="background: #E8F5F0;">
            <text class="panel-icon">📷</text>
          </view>
          <text class="panel-label">图片</text>
        </view>
        <view class="panel-item" @tap="takePhoto">
          <view class="panel-icon-wrap" style="background: #FFF3C4;">
            <text class="panel-icon">📸</text>
          </view>
          <text class="panel-label">拍照</text>
        </view>
        <view class="panel-item" @tap="chooseAudio">
          <view class="panel-icon-wrap" style="background: #E3F2FD;">
            <text class="panel-icon">🎵</text>
          </view>
          <text class="panel-label">音乐</text>
        </view>
        <view class="panel-item" @tap="chooseFile">
          <view class="panel-icon-wrap" style="background: #F3E5F5;">
            <text class="panel-icon">📄</text>
          </view>
          <text class="panel-label">文档</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useChatStore } from '../../stores/chat';
import { useUserStore } from '../../stores/user';
import { useSocket } from '../../composables/useSocket';
import { getAvatarBgColor, getAvatarEmoji } from '../../composables/useAvatar';
import { http } from '../../services/http';

const BASE_URL = 'http://192.168.1.5:3000';

const chatStore = useChatStore();
const userStore = useUserStore();
const { connected, emit, on, off } = useSocket();

const selfAvatarBg = computed(() => getAvatarBgColor(userStore.user?.gender, userStore.user?.id));
const selfAvatarEmoji = computed(() => getAvatarEmoji(userStore.user?.gender, userStore.user?.id));

const conversationId = ref('');
const conversationName = ref('');
const inputText = ref('');
const scrollAnchor = ref('msg-bottom');
const hasMore = ref(true);
const cursor = ref<string | undefined>();
const sendingMessage = ref(false);
const showPanel = ref(false);
const uploading = ref(false);

function fullUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return BASE_URL + url;
}

function formatTime(time: string): string {
  if (!time) return '';
  const date = new Date(time);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function onNewMessage(data: any) {
  if (data.conversation_id === conversationId.value) {
    chatStore.addMessage(data);
    scrollToBottom();
  }
}

function onTyping(_data: any) {}

function onRecalled(data: any) {
  const msg = chatStore.messages.find(m => m.id === data.message_id);
  if (msg) {
    msg.recalled = true;
  }
}

onLoad(async (options) => {
  if (options?.conversationId) {
    conversationId.value = options.conversationId;
    conversationName.value = decodeURIComponent(options.name || '聊天');
    uni.setNavigationBarTitle({ title: conversationName.value });

    chatStore.clearMessages();
    await chatStore.fetchMessages(conversationId.value);
    scrollToBottom();

    // 标记消息为已读
    chatStore.markAsRead(conversationId.value);

    if (connected.value) {
      emit('conversation:join', conversationId.value);
    }

    on('chat:message', onNewMessage);
    on('chat:typing', onTyping);
    on('chat:recalled', onRecalled);
  }
});

onUnload(() => {
  off('chat:message', onNewMessage);
  off('chat:typing', onTyping);
  off('chat:recalled', onRecalled);

  if (connected.value && conversationId.value) {
    emit('conversation:leave', conversationId.value);
  }
});

async function loadMore() {
  if (!hasMore.value || chatStore.loading) return;
  const oldestMsg = chatStore.messages[0];
  if (oldestMsg) {
    cursor.value = oldestMsg.id;
    await chatStore.fetchMessages(conversationId.value, cursor.value);
  }
}

async function sendMessage() {
  const content = inputText.value.trim();
  if (!content || sendingMessage.value) return;

  const savedInput = content;
  inputText.value = '';
  sendingMessage.value = true;

  try {
    await chatStore.sendMessage({
      conversation_id: conversationId.value,
      type: 'text',
      content,
    });
    scrollToBottom();
  } catch (err) {
    console.error('Send message failed:', err);
    inputText.value = savedInput;
    uni.showToast({ title: '发送失败，请重试', icon: 'none' });
  } finally {
    sendingMessage.value = false;
  }
}

function togglePanel() {
  showPanel.value = !showPanel.value;
}

async function sendImageMessage(filePath: string) {
  if (uploading.value) return;
  uploading.value = true;
  uni.showLoading({ title: '发送中...' });

  try {
    const uploadRes = await http.upload<{ url: string }>(filePath);
    if (uploadRes.data?.url) {
      await chatStore.sendMessage({
        conversation_id: conversationId.value,
        type: 'image',
        content: uploadRes.data.url,
      });
      scrollToBottom();
    }
  } catch (err) {
    console.error('Image upload failed:', err);
    uni.showToast({ title: '图片发送失败', icon: 'none' });
  } finally {
    uploading.value = false;
    uni.hideLoading();
  }
}

function chooseImage() {
  showPanel.value = false;
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album'],
    success: (res) => {
      if (res.tempFilePaths?.length) {
        sendImageMessage(res.tempFilePaths[0]);
      }
    },
  });
}

function takePhoto() {
  showPanel.value = false;
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera'],
    success: (res) => {
      if (res.tempFilePaths?.length) {
        sendImageMessage(res.tempFilePaths[0]);
      }
    },
  });
}

function chooseAudio() {
  showPanel.value = false;
  // #ifdef MP-WEIXIN
  // 小程序只能从聊天记录选择文件
  uni.showModal({
    title: '选择音频',
    content: '请从微信聊天记录中选择音频文件',
    confirmText: '去选择',
    success: (modalRes) => {
      if (modalRes.confirm) {
        uni.chooseMessageFile({
          count: 1,
          type: 'file',
          extension: ['mp3', 'wav', 'aac', 'm4a', 'amr', 'flac', 'ogg'],
          success: (res) => {
            if (res.tempFiles?.length) {
              const file = res.tempFiles[0];
              sendFileMessage(file.path, 'audio', file.name, file.size);
            }
          },
          fail: (err) => {
            console.error('chooseMessageFile failed:', err);
            uni.showToast({ title: '选择取消或失败', icon: 'none' });
          },
        });
      }
    }
  });
  // #endif
  // #ifdef H5
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'audio/*';
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      sendFileMessage(file, 'audio', file.name, file.size);
    }
  };
  input.click();
  // #endif
}

function chooseFile() {
  showPanel.value = false;
  // #ifdef MP-WEIXIN
  // 小程序只能从聊天记录选择文件
  uni.showModal({
    title: '选择文档',
    content: '请从微信聊天记录中选择文档文件',
    confirmText: '去选择',
    success: (modalRes) => {
      if (modalRes.confirm) {
        uni.chooseMessageFile({
          count: 1,
          type: 'file',
          extension: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar'],
          success: (res) => {
            if (res.tempFiles?.length) {
              const file = res.tempFiles[0];
              sendFileMessage(file.path, 'file', file.name, file.size);
            }
          },
          fail: (err) => {
            console.error('chooseMessageFile failed:', err);
            uni.showToast({ title: '选择取消或失败', icon: 'none' });
          },
        });
      }
    }
  });
  // #endif
  // #ifdef H5
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar';
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      sendFileMessage(file, 'file', file.name, file.size);
    }
  };
  input.click();
  // #endif
}

async function sendFileMessage(filePath: string | File, msgType: 'audio' | 'file', filename: string, fileSize: number) {
  if (uploading.value) return;
  uploading.value = true;
  uni.showLoading({ title: '发送中...' });

  try {
    const uploadRes = await http.upload<{ url: string; filename: string; size: number }>(filePath);
    if (uploadRes.data?.url) {
      await chatStore.sendMessage({
        conversation_id: conversationId.value,
        type: msgType,
        content: uploadRes.data.url,
        metadata: {
          filename: filename || uploadRes.data.filename,
          size: fileSize || uploadRes.data.size,
        },
      } as any);
      scrollToBottom();
    }
  } catch (err) {
    console.error('File upload failed:', err);
    uni.showToast({ title: '文件发送失败', icon: 'none' });
  } finally {
    uploading.value = false;
    uni.hideLoading();
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function openFile(url: string) {
  const fullFileUrl = fullUrl(url);
  // #ifdef MP-WEIXIN
  uni.downloadFile({
    url: fullFileUrl,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          fail: () => {
            uni.showToast({ title: '无法打开此文件', icon: 'none' });
          },
        });
      }
    },
    fail: () => {
      uni.showToast({ title: '下载失败', icon: 'none' });
    },
  });
  // #endif
  // #ifdef H5
  window.open(fullFileUrl, '_blank');
  // #endif
}

function onImageError(e: any) {
  console.error('Image load error:', e);
}

function scrollToBottom() {
  nextTick(() => {
    scrollAnchor.value = '';
    setTimeout(() => {
      scrollAnchor.value = 'msg-bottom';
    }, 50);
  });
}

function previewImage(url: string) {
  const allImages = chatStore.messages
    .filter(m => m.type === 'image' && !m.recalled)
    .map(m => fullUrl(m.content));
  uni.previewImage({
    current: url,
    urls: allImages.length ? allImages : [url],
  });
}

function playVoice(url: string) {
  const innerAudioContext = uni.createInnerAudioContext();
  innerAudioContext.src = fullUrl(url);
  innerAudioContext.play();
}
</script>

<style lang="scss">
/* 不用scoped，确保小程序样式生效 */

.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #EDEDED;
}

.message-list {
  flex: 1;
  padding: 0 20rpx;
}

/* ===== 撤回消息 ===== */
.msg-recalled {
  text-align: center;
  padding: 16rpx 0;
}

.recalled-text {
  font-size: 24rpx;
  color: #999;
  background: rgba(0, 0, 0, 0.05);
  padding: 6rpx 24rpx;
  border-radius: 20rpx;
}

/* ===== 消息行 ===== */
.msg-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 28rpx;
}

.msg-left {
  flex-direction: row;
}

.msg-right {
  flex-direction: row-reverse;
}

/* ===== 头像 ===== */
.msg-avatar {
  width: 76rpx;
  height: 76rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
  background: #ddd;
}

.msg-avatar-placeholder {
  width: 76rpx;
  height: 76rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-avatar-placeholder .avatar-emoji {
  font-size: 38rpx;
}

/* ===== 消息体 ===== */
.msg-body {
  max-width: 65%;
  margin: 0 16rpx;
  display: flex;
  flex-direction: column;
}

.msg-right .msg-body {
  align-items: flex-end;
}

/* ===== 发送者名称 ===== */
.msg-name {
  font-size: 24rpx;
  color: #888;
  margin-bottom: 8rpx;
  font-weight: 500;
}

/* ===== 气泡 ===== */
.msg-bubble {
  padding: 18rpx 24rpx;
  word-break: break-word;
  line-height: 1;
}

.bubble-left {
  background: #FFFFFF;
  border-radius: 6rpx 24rpx 24rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.bubble-right {
  background: #2E7D6F;
  border-radius: 24rpx 6rpx 24rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(46, 125, 111, 0.3);
}

/* ===== 气泡文字 ===== */
.bubble-text {
  font-size: 30rpx;
  color: #1A1A1A;
  line-height: 1.6;
}

.bubble-text-self {
  font-size: 30rpx;
  color: #FFFFFF;
  line-height: 1.6;
}

.bubble-img {
  width: 320rpx;
  max-width: 320rpx;
  border-radius: 12rpx;
  display: block;
}

/* ===== 语音气泡 ===== */
.voice-bubble {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 160rpx;
}

.voice-bubble-self {
  flex-direction: row-reverse;
}

.voice-icon {
  font-size: 32rpx;
}

.voice-icon-self {
  font-size: 32rpx;
}

.voice-bars {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.voice-bar {
  width: 6rpx;
  background: #1A1A1A;
  border-radius: 3rpx;
}

.voice-bar:nth-child(1) { height: 16rpx; }
.voice-bar:nth-child(2) { height: 24rpx; }
.voice-bar:nth-child(3) { height: 18rpx; }

.voice-bar-self {
  background: #FFFFFF;
}

.voice-duration {
  font-size: 24rpx;
  color: #666;
}

.voice-duration-self {
  font-size: 24rpx;
  color: #FFFFFF;
}

/* ===== 文件气泡 ===== */
.file-bubble {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.file-icon {
  font-size: 32rpx;
}

.file-name {
  max-width: 260rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 音频气泡 ===== */
.audio-bubble {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 200rpx;
  padding: 8rpx 0;
}

.audio-icon {
  font-size: 40rpx;
}

.audio-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.audio-title {
  font-size: 28rpx;
  color: #1A1A1A;
  max-width: 260rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-size {
  font-size: 22rpx;
  color: #999;
}

/* ===== 音频气泡(自己) ===== */
.audio-bubble-self .audio-icon {
  font-size: 40rpx;
  filter: brightness(10);
}

.audio-title-self {
  font-size: 28rpx;
  color: #FFFFFF;
  max-width: 260rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audio-size-self {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
}

/* ===== 文件气泡(带信息) ===== */
.file-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.file-name-self {
  font-size: 28rpx;
  color: #FFFFFF;
  max-width: 260rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size-self {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
}

.file-icon-self {
  font-size: 32rpx;
}

.file-size {
  font-size: 22rpx;
  color: #999;
}

/* ===== 时间 ===== */
.msg-time {
  font-size: 20rpx;
  color: #BBB;
  margin-top: 6rpx;
}

.msg-time-right {
  text-align: right;
}

/* ===== 输入区域 ===== */
.input-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  background: #F7F7F7;
  border-top: 1rpx solid #E5E5E5;
  gap: 12rpx;
}

.plus-btn {
  width: 68rpx;
  height: 68rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1rpx solid #E8E8E8;
}

.plus-icon {
  font-size: 40rpx;
  color: #666;
  font-weight: 300;
}

.input-field {
  flex: 1;
  height: 76rpx;
  background: #FFFFFF;
  border-radius: 38rpx;
  padding: 0 28rpx !important;
  font-size: 30rpx;
  border: 1rpx solid #E8E8E8;
}

.send-btn {
  width: 68rpx;
  height: 68rpx;
  background: #D5D5D5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.send-active {
  background: #2E7D6F !important;
}

.send-icon {
  font-size: 36rpx;
  color: #FFFFFF;
}

/* ===== 操作面板 ===== */
.action-panel {
  background: #F7F7F7;
  border-top: 1rpx solid #E5E5E5;
  padding: 24rpx 40rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.panel-grid {
  display: flex;
  gap: 40rpx;
}

.panel-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.panel-icon-wrap {
  width: 100rpx;
  height: 100rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-icon {
  font-size: 44rpx;
}

.panel-label {
  font-size: 24rpx;
  color: #666;
}
</style>
