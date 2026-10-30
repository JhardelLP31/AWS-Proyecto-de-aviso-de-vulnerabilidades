<script setup lang="ts">
import BaseButton from './BaseButton.vue';

interface Props {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  confirmVariant: 'primary',
  loading: false,
});

defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
  (e: 'close'): void;
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        @click.self="$emit('cancel')"
      >
        <div class="modal-dialog">
          <header class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button
              class="modal-close"
              type="button"
              aria-label="Cerrar modal"
              @click="$emit('cancel')"
            >
              ×
            </button>
          </header>

          <section class="modal-body">
            <p v-if="message" class="modal-message">{{ message }}</p>
            <slot></slot>
          </section>

          <footer class="modal-footer">
            <BaseButton
              variant="ghost"
              :disabled="loading"
              @click="$emit('cancel')"
            >
              {{ cancelText }}
            </BaseButton>
            <BaseButton
              :variant="confirmVariant"
              :loading="loading"
              @click="$emit('confirm')"
            >
              {{ confirmText }}
            </BaseButton>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-dialog {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  max-width: 28rem;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #334155;
}

.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #f8fafc;
}

.modal-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.modal-close:hover {
  color: #f8fafc;
}

.modal-body {
  padding: 1.25rem;
  color: #cbd5e1;
  font-size: 0.875rem;
  line-height: 1.5;
}

.modal-message {
  margin: 0;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: #0f172a;
  border-top: 1px solid #334155;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
