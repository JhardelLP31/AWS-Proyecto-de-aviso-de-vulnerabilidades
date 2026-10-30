<template>
  <div class="login-view-container">
    <div class="radar-bg"></div>

    <div class="login-card glass-panel">
      <!-- Encabezado de la Tarjeta -->
      <div class="login-header">
        <div class="logo-circle">
          <span class="logo-emoji">🚨</span>
        </div>
        <h1 class="login-title">GeoAlert Piura</h1>
        <p class="login-subtitle">Sistema de Respuesta y Monitoreo FEN</p>
      </div>

      <!-- Alerta de Error -->
      <div v-if="errorMessage" class="error-banner animate-fade-in">
        <span>⚠️ {{ errorMessage }}</span>
      </div>

      <!-- Formulario de Autenticación -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label" for="login-email">Correo Institucional o Ciudadano</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            required
            placeholder="usuario@piura.gob.pe"
            class="form-input"
            :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="login-password">Contraseña de Acceso</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="form-input"
            :disabled="isLoading"
          />
        </div>

        <button type="submit" class="btn btn-primary w-full submit-btn" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>Iniciar Sesión Segura</span>
        </button>
      </form>

      <!-- Accesos Rápidos para Prueba / Hackathon -->
      <div class="demo-profiles-section">
        <div class="divider">
          <span>PERFILES DE ACCESO RÁPIDO</span>
        </div>
        <div class="profile-grid">
          <button
            type="button"
            class="profile-chip"
            @click="fillCredentials('vecino@piura.gob.pe', 'Vecino2026!')"
            title="Ciudadano común: reporte y voto vecinal"
          >
            <span class="chip-icon">👤</span>
            <div class="chip-text">
              <strong>Vecino</strong>
              <small>Reporte & Voto</small>
            </div>
          </button>

          <button
            type="button"
            class="profile-chip brigade-chip"
            @click="fillCredentials('brigadista@indeci.gob.pe', 'Brigada2026!')"
            title="Brigadista INDECI: Voto con bonificación de veracidad"
          >
            <span class="chip-icon">🦺</span>
            <div class="chip-text">
              <strong>Brigadista</strong>
              <small>Bonus Veracidad</small>
            </div>
          </button>

          <button
            type="button"
            class="profile-chip coer-chip"
            @click="fillCredentials('coer@regionpiura.gob.pe', 'Coer2026!')"
            title="Autoridad COER: Despacho y verificación oficial"
          >
            <span class="chip-icon">🏢</span>
            <div class="chip-text">
              <strong>COER Piura</strong>
              <small>Despacho en Vivo</small>
            </div>
          </button>

          <button
            type="button"
            class="profile-chip admin-chip"
            @click="fillCredentials('admin@geoalert.pe', 'Admin2026!')"
            title="Superadmin: Control total RBAC"
          >
            <span class="chip-icon">⚡</span>
            <div class="chip-text">
              <strong>Superadmin</strong>
              <small>Acceso Global</small>
            </div>
          </button>
        </div>
      </div>

      <!-- Pie de Seguridad -->
      <div class="login-footer">
        <span class="security-indicator">🔒 Conexión cifrada con Cookies HttpOnly & CSRF en memoria</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

function fillCredentials(userEmail: string, userPass: string) {
  email.value = userEmail;
  password.value = userPass;
}

async function handleLogin() {
  if (!email.value || !password.value) return;

  isLoading.value = true;
  errorMessage.value = null;

  try {
    await authStore.login(email.value, password.value);
    const redirectPath = (route.query.redirect as string) || '/';
    router.push(redirectPath);
  } catch (err: any) {
    errorMessage.value = err.message || 'Error de credenciales o de conexión';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-view-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: var(--bg-deep);
  overflow-y: auto;
}

/* Efecto de radar de fondo */
.radar-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(5, 8, 17, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: radar-pulse 6s infinite ease-in-out;
}

@keyframes radar-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  padding: 2.25rem 2rem;
  border-radius: var(--radius-lg);
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.logo-circle {
  width: 58px;
  height: 58px;
  margin: 0 auto 0.85rem;
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.3), rgba(37, 99, 235, 0.2));
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.25);
}

.logo-emoji {
  font-size: 28px;
}

.login-title {
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff 30%, #93c5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-subtitle {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-top: 0.25rem;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  padding: 0.65rem 0.9rem;
  border-radius: var(--radius-md);
  font-size: 0.825rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
}

.w-full {
  width: 100%;
}

.submit-btn {
  padding: 0.75rem;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.demo-profiles-section {
  margin-top: 1.75rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin-bottom: 1rem;
}

.divider::before, .divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-subtle);
}

.divider span {
  padding: 0 0.65rem;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.55rem;
}

.profile-chip {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.65rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-main);
  cursor: pointer;
  transition: all var(--trans-fast);
  text-align: left;
}

.profile-chip:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: var(--border-bright);
  transform: translateY(-1px);
}

.chip-icon {
  font-size: 1.2rem;
}

.chip-text strong {
  display: block;
  font-size: 0.775rem;
  font-weight: 600;
}

.chip-text small {
  display: block;
  font-size: 0.65rem;
  color: var(--text-dim);
}

.brigade-chip:hover {
  border-color: rgba(245, 158, 11, 0.4);
}

.coer-chip:hover {
  border-color: rgba(56, 189, 248, 0.4);
}

.login-footer {
  margin-top: 1.5rem;
  text-align: center;
}

.security-indicator {
  font-size: 0.7rem;
  color: var(--text-muted);
}
</style>
