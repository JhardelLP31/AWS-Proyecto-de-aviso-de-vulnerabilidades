<script setup lang="ts">
import { computed, ref } from 'vue';
import type { IncidentDTO, VoteKind, LatLng } from '@geoalert/contracts';
import { haversineMeters, GEOFENCE_RADIUS_M } from '@geoalert/contracts';
import { useLocationStore } from '../../stores/location.store';
import { useIncidentStore } from '../../stores/incident.store';
import { useAuthStore } from '../../stores/auth.store';
import { getSeverityBadgeClass, getSeverityLabel } from '../../shared/map/severity-style';
import { useToast } from '../../shared/ui/useToast';
import { ApiError } from '../../shared/api/http';

const props = defineProps<{
  incident: IncidentDTO;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const locationStore = useLocationStore();
const incidentStore = useIncidentStore();
const authStore = useAuthStore();
const toast = useToast();

const isVoting = ref(false);

const userCoords = computed<LatLng | null>(() => locationStore.currentCoords);
const userRole = computed(() => (authStore.isBrigade ? 'BRIGADE' : 'CITIZEN'));

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

const canVote = computed<boolean>(() => {
  return (
    !isVoting.value &&
    !locationStore.isPermissionDenied &&
    !!userCoords.value &&
    isInsideGeofence.value &&
    props.incident.status !== 'RESOLVED'
  );
});

const voteButtonTooltip = computed<string>(() => {
  if (props.incident.status === 'RESOLVED') {
    return 'Este reporte ya fue resuelto y no acepta más votos';
  }
  if (locationStore.isPermissionDenied) {
    return 'Debes activar tu GPS para validar este peligro';
  }
  if (!userCoords.value) {
    return 'Esperando coordenadas GPS precisas...';
  }
  if (!isInsideGeofence.value) {
    return `Estás a ${formatDistance(distanceMeters.value)} del peligro (debes estar a ≤500 m)`;
  }
  return 'Confirmar o desmentir peligro presente en el lugar';
});

async function submitVote(kind: VoteKind) {
  if (!canVote.value || !userCoords.value) return;

  isVoting.value = true;
  try {
    await incidentStore.voteIncident({
      incidentId: props.incident.id,
      kind,
      lat: userCoords.value.lat,
      lng: userCoords.value.lng,
    });
    toast.success(
      kind === 'CONFIRM' ? 'Confirmación registrada en terreno' : 'Desmentido registrado',
      'Validación Comunitaria',
    );
  } catch (err: unknown) {
    let msg = 'Error al emitir validación';
    if (err instanceof ApiError) {
      msg = err.message;
    } else if (err instanceof Error) {
      msg = err.message;
    }
    toast.error(msg, 'Error de Validación');
  } finally {
    isVoting.value = false;
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
  window.open(url, '_blank', 'noopener,noreferrer');
}
</script>

<template>
  <div v-if="incident" class="incident-popup-card glass-panel animate-fade-in">
    <!-- Encabezado con Severidad y Botón de Cerrar -->
    <div class="popup-top-bar">
      <div class="badge-group">
        <span class="badge" :class="getSeverityBadgeClass(incident.severity)">
          {{ getSeverityLabel(incident.severity) }}
        </span>
        <span v-if="incident.status === 'VERIFIED'" class="badge badge-green verified-tag">
          ✓ Verificado Oficial
        </span>
      </div>
      <button class="close-btn" type="button" title="Cerrar" @click="$emit('close')">✕</button>
    </div>

    <!-- Título y Metadatos -->
    <h3 class="popup-title">{{ incident.title }}</h3>
    <div class="popup-meta">
      <span class="district-meta">📍 {{ incident.district || 'Piura' }}</span>
      <span class="time-meta">🕒 {{ formatTime(incident.occurredAt || incident.createdAt) }}</span>
    </div>

    <!-- Descripción del evento -->
    <p class="popup-description">{{ incident.description }}</p>

    <!-- Fotos del incidente -->
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

    <!-- Barra de Score de Veracidad -->
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

    <!-- Geocercado in situ y Acciones de Voto -->
    <div class="geofence-section">
      <div
        class="distance-indicator"
        :class="{ 'is-near': isInsideGeofence, 'is-far': !isInsideGeofence }"
      >
        <span v-if="locationStore.isPermissionDenied">
          ⚠️ GPS denegado. Activa tu ubicación para confirmar peligros cercanos.
        </span>
        <span v-else-if="!userCoords">
          ⚠️ Obteniendo coordenadas GPS...
        </span>
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
          :disabled="!canVote"
          class="btn btn-warning vote-btn confirm-btn"
          :title="voteButtonTooltip"
          @click="submitVote('CONFIRM')"
        >
          <span v-if="isVoting" class="spinner"></span>
          <span v-else>⚠️ Confirmar Peligro</span>
        </button>

        <button
          type="button"
          :disabled="!canVote"
          class="btn btn-danger vote-btn deny-btn"
          :title="voteButtonTooltip"
          @click="submitVote('DENY')"
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

<style scoped src="./components/incident-popup.css"></style>
