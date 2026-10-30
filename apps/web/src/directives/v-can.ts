import type { Directive, DirectiveBinding } from 'vue';
import { hasPermission } from '@geoalert/contracts';
import { useAuthStore } from '../stores/auth.store';

function checkAccess(binding: DirectiveBinding<string | string[]>): boolean {
  const auth = useAuthStore();
  const required = binding.value;
  if (!required) return true;

  if (Array.isArray(required)) {
    return required.every((p) => hasPermission(auth.permissions, p));
  }
  return hasPermission(auth.permissions, required);
}

function updateElement(el: HTMLElement, binding: DirectiveBinding<string | string[]>): void {
  const hasAccess = checkAccess(binding);
  const isDisableMode = binding.modifiers.disable;

  if (hasAccess) {
    if (isDisableMode) {
      el.removeAttribute('disabled');
      el.removeAttribute('aria-disabled');
      el.classList.remove('permission-disabled');
      el.style.pointerEvents = '';
      el.style.opacity = '';
    } else {
      el.style.display = '';
    }
  } else {
    if (isDisableMode) {
      el.setAttribute('disabled', 'true');
      el.setAttribute('aria-disabled', 'true');
      const requiredStr = Array.isArray(binding.value) ? binding.value.join(', ') : binding.value;
      el.setAttribute('title', `Acción bloqueada: Permiso requerido [${requiredStr}]`);
      el.classList.add('permission-disabled');
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.45';
    } else {
      el.style.display = 'none';
    }
  }
}

/**
 * Directiva reactiva v-can para restringir elementos del DOM.
 * Uso:
 *   v-can="'incidents.create'"             -> oculta el elemento si no tiene el permiso
 *   v-can.disable="'incidents.verify'"     -> deshabilita el botón/input con tooltip explicativo
 */
export const vCan: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    updateElement(el, binding);
  },
  updated(el, binding) {
    updateElement(el, binding);
  },
};
