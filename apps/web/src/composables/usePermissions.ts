import { computed } from 'vue';
import { hasPermission, type PermissionName } from '@geoalert/contracts';
import { useAuthStore } from '../stores/auth.store';

/**
 * Composable para comprobación reactiva de permisos RBAC en componentes Vue.
 */
export function usePermissions() {
  const auth = useAuthStore();

  const permissions = computed(() => auth.permissions);
  const roles = computed(() => auth.roles);
  const isAuthenticated = computed(() => auth.isAuthenticated);

  /**
   * Comprueba si el usuario actual posee un permiso requerido
   * (soporta comodines como '*' e 'incidents.*').
   */
  function can(permission: PermissionName | string): boolean {
    return hasPermission(permissions.value, permission);
  }

  /**
   * Comprueba si el usuario tiene al menos uno de los permisos indicados.
   */
  function canAny(...perms: (PermissionName | string)[]): boolean {
    return perms.some((p) => hasPermission(permissions.value, p));
  }

  /**
   * Comprueba si el usuario tiene todos los permisos indicados.
   */
  function canAll(...perms: (PermissionName | string)[]): boolean {
    return perms.every((p) => hasPermission(permissions.value, p));
  }

  return {
    can,
    canAny,
    canAll,
    permissions,
    roles,
    isAuthenticated,
  };
}
