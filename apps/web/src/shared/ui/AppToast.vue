<script setup lang="ts">
import { useToast } from './useToast';

const { toasts, remove } = useToast();
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-card"
        :class="`toast-${toast.type}`"
        role="alert"
      >
        <div class="toast-icon">
          <span v-if="toast.type === 'success'">✔</span>
          <span v-else-if="toast.type === 'error'">✖</span>
          <span v-else-if="toast.type === 'warning'">⚠</span>
          <span v-else>ℹ</span>
        </div>
        <div class="toast-content">
          <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button
          class="toast-close"
          type="button"
          aria-label="Cerrar notificación"
          @click="remove(toast.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  max-width: 26rem;
  width: calc(100vw - 2.5rem);
  pointer-events: none;
}

.toast-card {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  color: #fff;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.4;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toast-success {
  background: rgba(16, 185, 129, 0.95);
  border-color: #059669;
}

.toast-error {
  background: rgba(239, 68, 68, 0.95);
  border-color: #dc2626;
}

.toast-warning {
  background: rgba(245, 158, 11, 0.95);
  color: #1f2937;
  border-color: #d97706;
}

.toast-info {
  background: rgba(37, 99, 235, 0.95);
  border-color: #1d4ed8;
}

.toast-icon {
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.toast-message {
  word-break: break-word;
}

.toast-close {
  background: transparent;
  border: none;
  color: currentColor;
  opacity: 0.7;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.toast-close:hover {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(2rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-1rem);
}
</style>
