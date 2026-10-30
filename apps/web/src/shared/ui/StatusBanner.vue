<script setup lang="ts">
interface Props {
  type?: 'warning' | 'danger' | 'info' | 'success';
  title?: string;
  message?: string;
  dismissible?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: 'info',
  title: '',
  message: '',
  dismissible: false,
});

defineEmits<{
  (e: 'dismiss'): void;
}>();
</script>

<template>
  <div class="status-banner" :class="`banner-${type}`" role="status">
    <div class="banner-icon" aria-hidden="true">
      <span v-if="type === 'warning'">⚠️</span>
      <span v-else-if="type === 'danger'">🛑</span>
      <span v-else-if="type === 'success'">✅</span>
      <span v-else>ℹ️</span>
    </div>

    <div class="banner-content">
      <div v-if="title" class="banner-title">{{ title }}</div>
      <div v-if="message" class="banner-message">{{ message }}</div>
      <slot></slot>
    </div>

    <button
      v-if="dismissible"
      class="banner-close"
      type="button"
      aria-label="Cerrar aviso"
      @click="$emit('dismiss')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.status-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  margin-bottom: 1rem;
  border: 1px solid transparent;
}

.banner-warning {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}

.banner-danger {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.banner-info {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
  color: #7dd3fc;
}

.banner-success {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
}

.banner-icon {
  font-size: 1rem;
  line-height: 1;
}

.banner-content {
  flex: 1;
}

.banner-title {
  font-weight: 600;
  margin-bottom: 0.15rem;
}

.banner-message {
  word-break: break-word;
}

.banner-close {
  background: transparent;
  border: none;
  color: currentColor;
  opacity: 0.7;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.banner-close:hover {
  opacity: 1;
}
</style>
