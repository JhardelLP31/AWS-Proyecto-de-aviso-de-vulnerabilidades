import { ref } from 'vue';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

const toasts = ref<ToastMessage[]>([]);

export function useToast() {
  function add(type: ToastType, message: string, title?: string, duration = 4500): string {
    const id = Math.random().toString(36).slice(2, 9);
    toasts.value.push({ id, type, message, title, duration });

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
    return id;
  }

  function remove(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    info: (msg: string, title?: string) => add('info', msg, title),
    success: (msg: string, title?: string) => add('success', msg, title),
    warning: (msg: string, title?: string) => add('warning', msg, title),
    error: (msg: string, title?: string) => add('error', msg, title),
    remove,
  };
}
