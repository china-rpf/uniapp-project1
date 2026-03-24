<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { useUserStore } from './stores/user';
import { useSocket } from './composables/useSocket';

onLaunch(() => {
  console.log('App Launch');
  const userStore = useUserStore();
  const { connect } = useSocket();

  // Auto login and connect WebSocket if token exists
  const token = uni.getStorageSync('token');
  if (token) {
    userStore.fetchMe();
    connect(token);
  }
});
</script>

<style>
page {
  background-color: #F5F5F5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* 全局样式重置 */
view, text {
  box-sizing: border-box;
}

button {
  margin: 0;
  padding: 0;
}
</style>
