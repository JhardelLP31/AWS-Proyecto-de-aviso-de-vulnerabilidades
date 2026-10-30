<script setup lang="ts">
interface Props {
  isConnected: boolean;
}

defineProps<Props>();
</script>

<template>
  <div class="socket-badge" :class="{ 'is-connected': isConnected }">
    <span class="pulse-dot"></span>
    <span class="badge-text">
      {{ isConnected ? 'Radar en Vivo (WebSocket)' : 'Conectando radar FEN...' }}
    </span>
  </div>
</template>

<style scoped>
.socket-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.25);
  backdrop-filter: blur(8px);
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.socket-badge.is-connected {
  color: #f8fafc;
  border-color: rgba(34, 197, 94, 0.4);
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
}

.is-connected .pulse-dot {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
