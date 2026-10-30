<template>
  <div v-if="incident" class="incident-popup-card glass-panel animate-fade-in">
    <!-- Encabezado con Severidad y Botón de Cerrar -->
    <div class="popup-top-bar">
      <div class="badge-group">
        <span class="badge" :class="`badge-${incident.severity.toLowerCase()}`">
          {{ formatSeverity(incident.severity) }}
        </span>
        <span v-if="incident.status === 'VERIFIED'" class="badge badge-green verified-tag">
          ✓ Verificado Oficial
        </span>
      </div>
      <button @click="$emit('close')" class="close-btn" title="Cerrar">✕</button>
    </div>

    <!-- Título y Metadatos -->
    <h3 class="popup-title">{{ incident.title }}</h3>
    <div class="popup-meta">
      <span class="district-meta">📍 {{ incident.district || 'Piura' }}</span>
      <span class="time-meta">🕒 {{ formatTime(incident.occurredAt || incident.createdAt) }}</span>
    </div>

    <!-- Descripción del evento -->
    <p class="popup-description">{{ incident.description }}</p>

    <!-- Fotos del incidente si existen -->
    <div v-if="incident.photos && incident.photos.length > 0" class="popup-photos">
      <img
        v-for="(photo, index) in incident.photos"
        :key="index"
        :src="photo.url"
        alt="Foto del incidente"
        class="popup-photo-thumb"
        @click="openFullImage(photo.url)"
      />
    </div>

    <!-- Barra de Score de Veracidad Comunitaria -->
    <div class="veracity-box">
      <div class="veracity-header">
        <span class="veracity-label">Score de Veracidad Comunitaria:</span>
        <span class="veracity-score" :class="{ 'is-high': incident.veracityScore >= 5 }">
          {{ Number(incident.veracityScore).toFixed(1) }} pts
        </span>
      </div>
      <div class="votes-tally">
        <span class="vote-stat positive">👍 {{ incident.confirmCount }} confirmaciones</span>
        <span class="vote-stat negative">👎 {{ incident.denyCount }} desmentidos</span>
      </div>
    </div>

    <!-- Geocercado in situ y Acciones de Voto Estilo Waze -->
    <div class="geofence-section">
      <div class="distance-indicator" :class="{ 'is-near': isInsideGeofence, 'is-far': !isInsideGeofence }">
        <span v-if="!userCoords">⚠️ Active su GPS para validar este reporte in situ</span>
        <span v-else-if="isInsideGeofence">
          📍 Estás a <strong>{{ Math.round(distanceMeters) }}m</strong> (Dentro del radio de 500m)
        </span>
        <span v-else>
          📍 Estás a <strong>{{ formatDistance(distanceMeters) }}</strong> (Muy lejos para validar &gt;500m)
        </span>
      </div>

      <!-- Botones de Voto Rápido -->
      <div class="vote-actions">
        <button
          type="button"
          @click="submitVote('CONFIRM')"
          :disabled="!isInsideGeofence || isVoting"
          class="btn btn-warning vote-btn confirm-btn"
          title="Confirmar peligro presente en el lugar"
        >
          <span v-if="isVoting" class="spinner"></span>
          <span v-else>⚠️ Confirmar Peligro</span>
        </button>

        <button
          type="button"
          @click="submitVote('DENY')"
          :disabled="!isInsideGeofence || isVoting"
          class="btn btn-danger vote-btn deny-btn"
          title="Desmentir reporte falso o ya resuelto"
        >
          <span v-if="isVoting" class="spinner"></span>
          <span v-else>Desmentir</span>
        </button>
      </div>

      <small v-if="userRole === 'BRIGADE'" class="brigade-bonus-hint">
        🎖️ Tu voto de Brigadista cuenta con multiplicador de confianza
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { IncidentDTO, VoteKind, LatLng } from '@geoalert/contracts';
import { haversineMeters, GEOFENCE_RADIUS_M } from '@geoalert/contracts';
import { useLocationStore } from '../../stores/location.store';
import { useIncidentStore } from '../../stores/incident.store';
import { useAuthStore } from '../../stores/auth.store';

const props = defineProps<{
  incident: IncidentDTO;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const locationStore = useLocationStore();
const incidentStore = useIncidentStore();
const authStore = useAuthStore();

const isVoting = ref(false);

const userCoords = computed<LatLng | null>(() => locationStore.currentCoords);
const userRole = computed(() => (authStore.isBrigade ? 'BRIGADE' : 'CITIZEN'));

// Distancia calculada con la fórmula de Haversine del paquete de contratos
const distanceMeters = computed<number>(() => {
  if (!userCoords.value) return 999999;
  return haversineMeters(userCoords.value, {
    lat: props.incident.lat,
    lng: props.incident.lng,
  });
});

const isInsideGeofence = computed<boolean>(() => {
  return distanceMeters.value <= GEOFENCE_RADIUS_M;
});

async function submitVote(kind: VoteKind) {
  if (!userCoords.value || !isInsideGeofence.value) return;

  isVoting.value = true;
  try {
    await incidentStore.voteIncident({
      incidentId: props.incident.id,
      kind,
      lat: userCoords.value.lat,
      lng: userCoords.value.lng,
    });
  } catch (err: any) {
    alert(err?.message || 'Error al emitir validación');
  } finally {
    isVoting.value = false;
  }
}

function formatSeverity(sev: string): string {
  switch (sev) {
    case 'RED': return 'Rojo · Crítico';
    case 'ORANGE': return 'Naranja · Grave';
    case 'YELLOW': return 'Amarillo · Alerta';
    default: return 'Verde · Normal';
  }
}

function formatDistance(m: number): string {
  if (m > 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function openFullImage(url: string) {
  window.open(url, '_blank');
}
</script>

<style scoped>
.incident-popup-card {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 92%;
  max-width: 480px;
  max-height: 82vh;
  overflow-y: auto;
  padding: 1.25rem 1.4rem;
  z-index: 600;
  pointer-events: auto;
  border-radius: var(--radius-lg);
}

.popup-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.65rem;
}

.badge-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.verified-tag {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-dim);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--trans-fast);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.popup-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.3;
}

.popup-meta {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.775rem;
  color: var(--text-dim);
  margin-top: 0.25rem;
}

.popup-description {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin: 0.75rem 0;
  line-height: 1.45;
}

.popup-photos {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  overflow-x: auto;
}

.popup-photo-thumb {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: transform var(--trans-fast);
}

.popup-photo-thumb:hover {
  transform: scale(1.05);
}

.veracity-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.85rem;
  margin-bottom: 0.75rem;
}

.veracity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.veracity-label {
  font-size: 0.775rem;
  font-weight: 600;
  color: var(--text-dim);
}

.veracity-score {
  font-size: 1rem;
  font-weight: 800;
  color: #38bdf8;
}

.veracity-score.is-high {
  color: #34d399;
}

.votes-tally {
  display: flex;
  gap: 1rem;
  margin-top: 0.35rem;
}

.vote-stat {
  font-size: 0.725rem;
  font-weight: 600;
}

.vote-stat.positive {
  color: #34d399;
}

.vote-stat.negative {
  color: #f87171;
}

.geofence-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.distance-indicator {
  font-size: 0.75rem;
  padding: 0.4rem 0.65rem;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  text-align: center;
}

.distance-indicator.is-near {
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.1);
}

.distance-indicator.is-far {
  color: var(--text-muted);
}

.vote-actions {
  display: flex;
  gap: 0.65rem;
}

.vote-btn {
  flex: 1;
  padding: 0.65rem;
  font-size: 0.825rem;
}

.brigade-bonus-hint {
  text-align: center;
  font-size: 0.7rem;
  color: #fbbf24;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
