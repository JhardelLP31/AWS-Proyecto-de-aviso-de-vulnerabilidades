import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MeDTO } from '@geoalert/contracts';
import { PERMISSIONS } from '@geoalert/contracts';
import { http, setCsrfToken, fetchCsrfToken, UnauthorizedError } from '../shared/api/http';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<MeDTO | null>(null);
  const isLoading = ref<boolean>(false);
  const isInitialized = ref<boolean>(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);
  const permissions = computed<string[]>(() => user.value?.permissions || []);
  const roles = computed<string[]>(() => user.value?.roles || []);
  const displayName = computed<string>(() => user.value?.displayName || 'Vecino');

  const isBrigade = computed(() =>
    roles.value.includes('BRIGADE') || permissions.value.includes(PERMISSIONS.IncidentsVoteBrigade),
  );

  const isAuthority = computed(() =>
    roles.value.includes('DISPATCH') ||
    roles.value.includes('COER') ||
    permissions.value.includes(PERMISSIONS.AlertsReceive),
  );

  /**
   * Inicia sesión validando credenciales contra /api/auth/login.
   * La cookie HttpOnly la gestiona el navegador; el token CSRF queda en memoria.
   */
  async function login(email: string, password: string): Promise<MeDTO> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await http.post<{ user: MeDTO; csrfToken: string }>('/api/auth/login', {
        email,
        password,
      });

      user.value = response.user;
      if (response.csrfToken) {
        setCsrfToken(response.csrfToken);
      }
      return response.user;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al iniciar sesión';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Registra un nuevo usuario comunitario vía POST /api/auth/register.
   */
  async function register(payload: {
    email: string;
    password: string;
    displayName: string;
    district?: string;
    phone?: string;
  }): Promise<MeDTO> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await http.post<{ user: MeDTO; csrfToken: string }>('/api/auth/register', payload);
      user.value = response.user;
      if (response.csrfToken) {
        setCsrfToken(response.csrfToken);
      }
      return response.user;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error al registrarse';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Cierra sesión destruyendo la cookie en el backend.
   */
  async function logout(): Promise<void> {
    isLoading.value = true;
    try {
      await http.post('/api/auth/logout');
    } catch (err) {
      console.warn('[AuthStore] Error durante logout:', err);
    } finally {
      user.value = null;
      setCsrfToken(null);
      isLoading.value = false;
    }
  }

  /**
   * Intenta recuperar la sesión activa del usuario al cargar la página.
   */
  async function fetchMe(): Promise<MeDTO | null> {
    if (isInitialized.value && user.value) return user.value;

    isLoading.value = true;
    error.value = null;

    try {
      // Intentar refrescar CSRF token
      await fetchCsrfToken();

      const profile = await http.get<MeDTO>('/api/auth/me');
      user.value = profile;
      return profile;
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        user.value = null;
      }
      return null;
    } finally {
      isLoading.value = false;
      isInitialized.value = true;
    }
  }

  return {
    user,
    isLoading,
    isInitialized,
    error,
    isAuthenticated,
    permissions,
    roles,
    displayName,
    isBrigade,
    isAuthority,
    login,
    register,
    logout,
    fetchMe,
  };
});
