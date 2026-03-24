import { ref } from 'vue';

const connected = ref(false);
let socketTask: UniApp.SocketTask | null = null;
const listeners = new Map<string, Set<(data: any) => void>>();

const BASE_WS_URL = 'ws://192.168.1.5:3000';

export function useSocket() {
  function connect(token: string) {
    if (socketTask) return;

    socketTask = uni.connectSocket({
      url: `${BASE_WS_URL}/socket.io/?EIO=4&transport=websocket&token=${token}`,
      success: () => {},
    });

    uni.onSocketOpen(() => {
      connected.value = true;
      console.log('WebSocket connected');
    });

    uni.onSocketMessage((res) => {
      try {
        // Socket.IO protocol parsing (simplified)
        const msg = String(res.data);
        if (msg.startsWith('42')) {
          const payload = JSON.parse(msg.slice(2));
          const [event, data] = payload;
          const handlers = listeners.get(event);
          if (handlers) {
            handlers.forEach(fn => fn(data));
          }
        }
      } catch {
        // ignore parse errors
      }
    });

    uni.onSocketClose(() => {
      connected.value = false;
      socketTask = null;
      console.log('WebSocket disconnected');
      // Auto reconnect after 3s
      setTimeout(() => {
        if (!connected.value) connect(token);
      }, 3000);
    });

    uni.onSocketError(() => {
      connected.value = false;
      socketTask = null;
    });
  }

  function emit(event: string, data: any) {
    if (socketTask && connected.value) {
      uni.sendSocketMessage({
        data: `42${JSON.stringify([event, data])}`,
      });
    }
  }

  function on(event: string, handler: (data: any) => void) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(handler);
  }

  function off(event: string, handler: (data: any) => void) {
    listeners.get(event)?.delete(handler);
  }

  function disconnect() {
    if (socketTask) {
      uni.closeSocket();
      socketTask = null;
      connected.value = false;
    }
  }

  return { connected, connect, emit, on, off, disconnect };
}
