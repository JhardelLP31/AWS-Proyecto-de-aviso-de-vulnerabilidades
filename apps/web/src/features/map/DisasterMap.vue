<template>
  <div class="disaster-map-wrapper">
    <!-- Contenedor del Mapa Leaflet -->
    <div id="leaflet-map-canvas" class="map-viewport"></div>

    <!-- Leyenda Semafórica -->
    <SeverityLegend />

    <!-- Indicador Flotante de Conexión en Tiempo Real -->
    <div class="ws-floating-status" :class="{ 'is-active': isConnected }">
      <span class="pulse-dot" :class="isConnected ? 'dot-active' : 'dot-inactive'"></span>
      <span>{{ isConnected ? 'Alertas en Vivo (WebSocket)' : 'Conectando radar...' }}</span>
    </div>

    <!-- Banner de Alerta Crítica Reciente -->
    <div v-if="lastAlert" class="alert-banner-floating animate-fade-in">
      <span class="alert-icon">🚨</span>
      <span class="alert-text">{{ lastAlert }}</span>
      <button @click="lastAlert = null" class="alert-close-btn">✕</button>
    </div>

    <!-- Botón Flotante para Centrar en mi Ubicación -->
    <button
      type="button"
      @click="centerOnUser"
      class="my-location-fab"
      title="Centrar en mi posición GPS"
    >
      🎯
    </button>

    <!-- Popup Interactivo de Detalle y Voto In Situ -->
    <IncidentPopup
      v-if="selectedIncident"
      :incident="selectedIncident"
      @close="selectedIncident = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { IncidentDTO, BBox, Severity } from '@geoalert/contracts';
import SeverityLegend from './SeverityLegend.vue';
import IncidentPopup from './IncidentPopup.vue';
import { useIncidentStore } from '../../stores/incident.store';
import { useLocationStore, PIURA_CENTER } from '../../stores/location.store';
import { useIncidentsSocket } from '../../composables/useIncidentsSocket';

const incidentStore = useIncidentStore();
const locationStore = useLocationStore();
const { isConnected, lastAlert, subscribeViewport } = useIncidentsSocket();

const selectedIncident = ref<IncidentDTO | null>(null);

let map: L.Map | null = null;
let clusterGroup: L.MarkerClusterGroup | null = null;
let userMarker: L.CircleMarker | null = null;

onMounted(() => {
  initMap();
  locationStore.startTracking();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

function initMap() {
  // Inicializar mapa centrado en Piura con Canvas rendering para alto desempeño
  map = L.map('leaflet-map-canvas', {
    preferCanvas: true,
    zoomControl: false,
    minZoom: 9,
    maxZoom: 18,
  }).setView([PIURA_CENTER.lat, PIURA_CENTER.lng], 13);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Capa de cartografía Dark Matter optimizada para emergencias
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap, © CartoDB, INDECI Piura',
  }).addTo(map);

  // Grupo de Clustering Semafórico: El cluster adopta el color de la peor severidad
  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 45,
    iconCreateFunction: (cluster) => {
      const markers = cluster.getAllChildMarkers();
      let worstSeverity: Severity = 'GREEN';

      for (const m of markers) {
        const sev = (m as any).incidentSeverity as Severity;
        if (sev === 'RED') {
          worstSeverity = 'RED';
          break;
        }
        if (sev === 'ORANGE') worstSeverity = 'ORANGE';
        else if (sev === 'YELLOW' && worstSeverity !== 'ORANGE') worstSeverity = 'YELLOW';
      }

      const count = cluster.getChildCount();
      const colorClass = `cluster-${worstSeverity.toLowerCase()}`;

      return L.divIcon({
        html: `<div class="custom-cluster-badge ${colorClass}"><span>${count}</span></div>`,
        className: 'custom-cluster-wrapper',
        iconSize: L.point(40, 40),
      });
    },
  });

  map.addLayer(clusterGroup);

  // Cargar incidentes al mover o hacer zoom en el mapa
  map.on('moveend', handleMapMove);

  // Trigger inicial de carga
  handleMapMove();
}

function handleMapMove() {
  if (!map) return;

  const bounds = map.getBounds();
  const bbox: BBox = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ];

  incidentStore.fetchIncidentsByBBox(bbox);
  subscribeViewport(bbox);
}

// Reactividad: refrescar marcadores cuando cambia la lista de incidentes
watch(
  () => incidentStore.incidentList,
  (incidents) => {
    renderMarkers(incidents);
  },
  { deep: true },
);

function renderMarkers(incidents: IncidentDTO[]) {
  if (!clusterGroup) return;

  clusterGroup.clearLayers();

  incidents.forEach((item) => {
    const color = getSeverityColor(item.severity);

    const marker = L.circleMarker([item.lat, item.lng], {
      radius: 8,
      fillColor: color,
      color: '#ffffff',
      weight: 1.5,
      opacity: 0.95,
      fillOpacity: 0.85,
    });

    (marker as any).incidentSeverity = item.severity;

    marker.on('click', () => {
      selectedIncident.value = item;
      incidentStore.setActiveIncident(item.id);
    });

    clusterGroup?.addLayer(marker);
  });
}

// Reactividad: actualizar posición del usuario en el mapa
watch(
  () => locationStore.currentCoords,
  (coords) => {
    if (!map || !coords) return;

    if (!userMarker) {
      userMarker = L.circleMarker([coords.lat, coords.lng], {
        radius: 9,
        fillColor: '#38bdf8',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      }).addTo(map);
    } else {
      userMarker.setLatLng([coords.lat, coords.lng]);
    }
  },
);

function centerOnUser() {
  if (locationStore.currentCoords && map) {
    map.flyTo([locationStore.currentCoords.lat, locationStore.currentCoords.lng], 15, {
      duration: 1.2,
    });
  } else if (map) {
    map.flyTo([PIURA_CENTER.lat, PIURA_CENTER.lng], 13);
  }
}

function getSeverityColor(sev: Severity): string {
  switch (sev) {
    case 'RED': return '#ef4444';
    case 'ORANGE': return '#f97316';
    case 'YELLOW': return '#f59e0b';
    default: return '#10b981';
  }
}
</script>

<style scoped>
.disaster-map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-viewport {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.ws-floating-status {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(13, 21, 39, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  padding: 0.35rem 0.85rem;
  font-size: 0.75rem;
  color: var(--text-dim);
  box-shadow: var(--shadow-sm);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-active {
  background-color: var(--sev-green);
  box-shadow: 0 0 6px var(--sev-green);
}

.dot-inactive {
  background-color: var(--text-muted);
}

.alert-banner-floating {
  position: absolute;
  top: 3.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 550;
  background: rgba(220, 38, 38, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-pill);
  padding: 0.5rem 1.25rem;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5);
  font-size: 0.825rem;
  font-weight: 700;
}

.alert-close-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 12px;
  margin-left: 0.5rem;
}

.my-location-fab {
  position: absolute;
  bottom: 2rem;
  right: 1.5rem;
  z-index: 500;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--trans-fast);
}

.my-location-fab:hover {
  transform: scale(1.08);
  border-color: #38bdf8;
}
</style>

<style>
/* Estilos globales para Leaflet MarkerCluster con colores de severidad FEN */
.custom-cluster-wrapper {
  background: transparent;
  border: none;
}

.custom-cluster-badge {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8rem;
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.cluster-red {
  background: radial-gradient(circle, #ef4444 60%, #b91c1c 100%);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.7);
  animation: pulse-ring 2s infinite;
}

.cluster-orange {
  background: radial-gradient(circle, #f97316 60%, #c2410c 100%);
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.6);
}

.cluster-yellow {
  background: radial-gradient(circle, #eab308 60%, #a16207 100%);
  color: #1e293b;
}

.cluster-green {
  background: radial-gradient(circle, #10b981 60%, #047857 100%);
}
</style>
