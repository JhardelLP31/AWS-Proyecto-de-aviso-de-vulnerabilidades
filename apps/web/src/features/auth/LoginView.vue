<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { env } from '../../shared/config/env';
import type { DemoProfile } from '../../shared/config/demo-profiles';
import { ApiError } from '../../shared/api/http';
import BaseField from '../../shared/ui/BaseField.vue';
import BaseButton from '../../shared/ui/BaseButton.vue';
import StatusBanner from '../../shared/ui/StatusBanner.vue';
import DemoProfiles from './components/DemoProfiles.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

function handleSelectProfile(profile: DemoProfile) {
  email.value = profile.email;
  password.value = profile.password;
}

async function handleLogin() {
  if (!email.value || !password.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    await authStore.login(email.value, password.value);
    const redirectPath = (route.query.redirect as string) || '/';
    router.push(redirectPath);
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        errorMessage.value = 'Correo o contraseña incorrectos';
      } else if (err.status === 429) {
        errorMessage.value = 'Demasiados intentos fallidos. Por seguridad, espera un minuto.';
      } else {
        errorMessage.value = err.message || 'Error en el servidor de autenticación';
      }
    } else if (err instanceof Error) {
      errorMessage.value = err.message;
    } else {
      errorMessage.value = 'Error de conexión con el servidor';
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="login-view-container">
    <div class="login-card glass-panel">
      <header class="login-header">
        <div class="logo-circle">
          <span class="logo-emoji">🚨</span>
        </div>
        <h1 class="login-title">GeoAlert Piura</h1>
        <p class="login-subtitle">Sistema de Respuesta y Monitoreo FEN</p>
      </header>

      <StatusBanner
        v-if="errorMessage"
        type="danger"
        :message="errorMessage"
        dismissible
        @dismiss="errorMessage = null"
      />

      <form class="login-form" @submit.prevent="handleLogin">
        <BaseField id="login-email" label="Correo Electrónico" required>
          <input
            id="login-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="usuario@demo.pe"
            :disabled="isLoading"
          />
        </BaseField>

        <BaseField id="login-password" label="Contraseña de Acceso" required>
          <input
            id="login-password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            :disabled="isLoading"
          />
        </BaseField>

        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          :loading="isLoading"
          style="width: 100%; margin-top: 0.5rem;"
        >
          Iniciar Sesión
        </BaseButton>
      </form>

      <div class="register-hint">
        <span>¿Eres un vecino o brigadista nuevo?</span>
        <router-link to="/register" class="register-link">Crear cuenta comunitaria</router-link>
      </div>

      <DemoProfiles
        v-if="env.isDemoMode"
        @select="handleSelectProfile"
      />

      <footer class="login-footer">
        <span class="security-indicator">🔒 Cookie HttpOnly segura + CSRF en memoria</span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-view-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: radial-gradient(circle at 50% 30%, #0c1b33 0%, #060b14 100%);
}
.login-card {
  width: 100%;
  max-width: 32rem;
  padding: 2rem;
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
}
.login-header { text-align: center; margin-bottom: 1.5rem; }
.logo-circle {
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 0.75rem;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}
.login-title { font-size: 1.5rem; font-weight: 700; color: #f8fafc; margin: 0 0 0.25rem; }
.login-subtitle { font-size: 0.875rem; color: #94a3b8; margin: 0; }
.register-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.25rem 0 0;
  font-size: 0.8125rem;
  color: #94a3b8;
}
.register-link { color: #38bdf8; font-weight: 600; text-decoration: none; }
.register-link:hover { text-decoration: underline; }
.login-footer { margin-top: 1.5rem; text-align: center; font-size: 0.75rem; color: #64748b; }
</style>
