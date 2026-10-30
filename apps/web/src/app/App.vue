<template>
  <div class="app-layout">
    <!-- Barra Superior de Misión Crítica -->
    <header class="top-nav">
      <!-- Marca y Estado FEN -->
      <router-link to="/" class="brand-badge">
        <div class="brand-icon">🌊</div>
        <div>
          <span class="brand-title">GeoAlert</span>
          <span class="brand-tag">Piura FEN</span>
        </div>
      </router-link>

      <!-- Enlaces de Navegación -->
      <nav class="nav-links">
        <router-link to="/" class="nav-btn" active-class="active">
          <span>🗺️</span>
          <span>Mapa en Vivo</span>
        </router-link>

        <router-link
          to="/report"
          v-can="'incidents.create'"
          class="nav-btn"
          active-class="active"
        >
          <span>📸</span>
          <span>Reportar Peligro</span>
        </router-link>

        <router-link
          to="/dispatch"
          v-can="'alerts.receive'"
          class="nav-btn"
          active-class="active"
        >
          <span>🚨</span>
          <span>Despacho COER</span>
        </router-link>
      </nav>

      <!-- Estado de Red y Sesión -->
      <div class="user-nav-actions">
        <!-- Indicador de Red (Online / Offline FEN) -->
        <div class="network-status" :class="{ 'is-offline': !isOnline }">
          <span class="pulse-indicator" :class="isOnline ? 'pulse-green' : 'pulse-amber'"></span>
          <span class="status-label">{{ isOnline ? 'En Línea' : 'Sin Señal (Offline)' }}</span>
        </div>

        <!-- Usuario Autenticado -->
        <template v-if="authStore.isAuthenticated">
          <div class="user-chip">
            <span class="user-name">{{ authStore.displayName }}</span>
            <span
              v-if="authStore.isAuthority"
              class="badge badge-red user-role-badge"
            >
              COER
            </span>
            <span
              v-else-if="authStore.isBrigade"
              class="badge badge-yellow user-role-badge"
            >
              Brigadista
            </span>
            <span v-else class="badge badge-green user-role-badge">Vecino</span>
          </div>

          <button @click="handleLogout" class="btn btn-ghost btn-sm" title="Cerrar sesión">
            Cerrar
          </button>
        </template>

        <!-- Invitado -->
        <template v-else>
          <router-link to="/login" class="btn btn-primary btn-sm">
            Acceder
          </router-link>
        </template>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const isOnline = ref(navigator.onLine);

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
};

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.user-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.network-status {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.65rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  color: var(--text-dim);
}

.network-status.is-offline {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

.pulse-green {
  background-color: var(--sev-green);
  color: var(--sev-green);
}

.pulse-amber {
  background-color: var(--sev-yellow);
  color: var(--sev-yellow);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.user-name {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--text-main);
}

.user-role-badge {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.775rem;
}

/* Transiciones de página */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
