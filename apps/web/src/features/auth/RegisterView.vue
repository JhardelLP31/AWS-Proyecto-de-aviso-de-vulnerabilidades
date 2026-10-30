<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { ApiError } from '../../shared/api/http';
import BaseField from '../../shared/ui/BaseField.vue';
import BaseSelect from '../../shared/ui/BaseSelect.vue';
import BaseButton from '../../shared/ui/BaseButton.vue';
import StatusBanner from '../../shared/ui/StatusBanner.vue';

const router = useRouter();
const authStore = useAuthStore();

const displayName = ref('');
const email = ref('');
const district = ref('Piura');
const phone = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const districtOptions = [
  { value: 'Piura', label: 'Piura Centro' },
  { value: 'Castilla', label: 'Castilla' },
  { value: 'Veintiséis de Octubre', label: 'Veintiséis de Octubre' },
  { value: 'Catacaos', label: 'Catacaos' },
  { value: 'Cura Mori', label: 'Cura Mori' },
  { value: 'Tambogrande', label: 'Tambogrande' },
  { value: 'Chulucanas', label: 'Chulucanas' },
  { value: 'Sullana', label: 'Sullana' },
];

async function handleRegister() {
  if (!email.value || !password.value || !displayName.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    const payload: {
      email: string;
      password: string;
      displayName: string;
      district?: string;
      phone?: string;
    } = {
      email: email.value.trim().toLowerCase(),
      password: password.value,
      displayName: displayName.value.trim(),
      district: district.value,
    };

    if (phone.value.trim()) {
      payload.phone = phone.value.trim();
    }

    await authStore.register(payload);
    router.push('/');
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      const details = err.details && typeof err.details === 'object' ? err.details : null;
      const code = details && 'code' in details ? String(details.code) : '';

      if (err.status === 409 || code === 'EMAIL_ALREADY_REGISTERED') {
        errorMessage.value = 'Este correo ya se encuentra registrado. Inicia sesión directamente.';
      } else if (err.status === 400) {
        if (details && 'message' in details && Array.isArray(details.message)) {
          errorMessage.value = details.message.join('. ');
        } else {
          errorMessage.value =
            'La contraseña no cumple los requisitos (mín. 8 caracteres, mayúscula, minúscula, número y símbolo).';
        }
      } else {
        errorMessage.value = err.message || 'Error al procesar el registro';
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
  <div class="register-view-container">
    <div class="register-card glass-panel">
      <header class="register-header">
        <div class="logo-circle">
          <span class="logo-emoji">🛡️</span>
        </div>
        <h1 class="register-title">Registro Comunitario</h1>
        <p class="register-subtitle">Únete a la red de respuesta ante emergencias climáticas</p>
      </header>

      <StatusBanner
        v-if="errorMessage"
        type="danger"
        :message="errorMessage"
        dismissible
        @dismiss="errorMessage = null"
      />

      <form class="register-form" @submit.prevent="handleRegister">
        <BaseField id="reg-name" label="Nombre y Apellido" required>
          <input
            id="reg-name"
            v-model="displayName"
            type="text"
            required
            autocomplete="name"
            placeholder="Ej. María Flores"
            :disabled="isLoading"
          />
        </BaseField>

        <BaseField id="reg-email" label="Correo Electrónico" required>
          <input
            id="reg-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="maria.flores@piura.pe"
            :disabled="isLoading"
          />
        </BaseField>

        <div class="form-row">
          <BaseField id="reg-district" label="Distrito / Sector" required>
            <BaseSelect
              id="reg-district"
              v-model="district"
              :options="districtOptions"
              :disabled="isLoading"
            />
          </BaseField>

          <BaseField id="reg-phone" label="Celular (Opcional)">
            <input
              id="reg-phone"
              v-model="phone"
              type="tel"
              autocomplete="tel"
              placeholder="987654321"
              maxlength="9"
              :disabled="isLoading"
            />
          </BaseField>
        </div>

        <BaseField
          id="reg-password"
          label="Contraseña Segura"
          hint="Ej: Piura2026! o Segura123# (mín. 8 caracteres)"
          required
        >
          <input
            id="reg-password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
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
          Crear Cuenta y Entrar
        </BaseButton>
      </form>

      <footer class="register-footer">
        <span>¿Ya estás registrado?</span>
        <router-link to="/login" class="login-link">Iniciar sesión aquí</router-link>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.register-view-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: radial-gradient(circle at 50% 30%, #0c1b33 0%, #060b14 100%);
}
.register-card {
  width: 100%;
  max-width: 32rem;
  padding: 2rem;
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
}
.register-header { text-align: center; margin-bottom: 1.5rem; }
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
.register-title { font-size: 1.5rem; font-weight: 700; color: #f8fafc; margin: 0 0 0.25rem; }
.register-subtitle { font-size: 0.875rem; color: #94a3b8; margin: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
@media (max-width: 480px) { .form-row { grid-template-columns: 1fr; gap: 0; } }
.register-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  font-size: 0.8125rem;
  color: #94a3b8;
}
.login-link { color: #38bdf8; font-weight: 600; text-decoration: none; }
.login-link:hover { text-decoration: underline; }
</style>
