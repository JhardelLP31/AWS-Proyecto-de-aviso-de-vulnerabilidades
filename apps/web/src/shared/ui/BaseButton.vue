<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'danger' | 'warning' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
});

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();
</script>

<template>
  <button
    :type="type"
    class="base-btn"
    :class="[`btn-${variant}`, `btn-${size}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner" aria-hidden="true"></span>
    <span class="btn-label" :class="{ 'label-hidden': loading }">
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-family: inherit;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  border: 1px solid transparent;
  outline: none;
  line-height: 1.25;
  user-select: none;
}

.base-btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.45);
}

.base-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.2);
}

/* Sizes */
.btn-sm {
  padding: 0.375rem 0.625rem;
  font-size: 0.75rem;
}

.btn-md {
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
}

.btn-lg {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
}

/* Variants */
.btn-primary {
  background: #0284c7;
  color: #ffffff;
  border-color: #0369a1;
}

.btn-primary:hover:not(:disabled) {
  background: #0369a1;
}

.btn-danger {
  background: #dc2626;
  color: #ffffff;
  border-color: #b91c1c;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-warning {
  background: #d97706;
  color: #ffffff;
  border-color: #b45309;
}

.btn-warning:hover:not(:disabled) {
  background: #b45309;
}

.btn-secondary {
  background: #1e293b;
  color: #f1f5f9;
  border-color: #334155;
}

.btn-secondary:hover:not(:disabled) {
  background: #334155;
}

.btn-ghost {
  background: transparent;
  color: #94a3b8;
  border-color: transparent;
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
}

/* Loading Spinner */
.spinner {
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.label-hidden {
  visibility: hidden;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
