<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import L from 'leaflet';
import type { IncidentDTO, BBox } from '@geoalert/contracts';
import { useIncidentStore } from '../../stores/incident.store';
import { useLocationStore, PIURA_CENTER } from '../../stores/location.store';
import { useIncidentsSocket } from '../../composables/useIncidentsSocket';
import SeverityLegend from './SeverityLegend.vue';
import IncidentPopup from './IncidentPopup.vue';
import StatusBanner from '../../shared/ui/StatusBanner.vue';
import MapCanvas from './components/MapCanvas.vue';
import IncidentMarkersLayer from './components/IncidentMarkersLayer.vue';
import LocateMeButton from './components/LocateMeButton.vue';
import SocketStatusBadge from './components/SocketStatusBadge.vue';
import MapLayerToggle from './components/MapLayerToggle.vue';
import RiskHeatLayer from './components/RiskHeatLayer.vue';

const incidentStore = useIncidentStore();
const locationStore = useLocationStore();
const { isConnected, lastAlert, subscribeViewport } = useIncidentsSocket();

const mapInstance = shallowRef<L.Map | null>(null);
const selectedIncident = ref<IncidentDTO | null>(null);
const showRiskLayer = ref<boolean>(false);
const currentBBox = ref<BBox | null>(null);
let userMarker: L.CircleMarker | null = null;

function onMapReady(map: L.Map) {
  mapInstance.value = map;
  locationStore.startTracking();
}

function onBBoxChange(bbox: BBox) {
  currentBBox.value = bbox;
  incidentStore.fetchIncidentsByBBox(bbox);
  subscribeViewport(bbox);
}

function onSelectIncident(incident: IncidentDTO) {
  selectedIncident.value = incident;
  incidentStore.setActiveIncident(incident.id);
}

function centerOnUser() {
  if (!mapInstance.value) return;

  if (locationStore.currentCoords && !locationStore.isPermissionDenied) {
    mapInstance.value.flyTo(
      [locationStore.currentCoords.lat, locationStore.currentCoords.lng],
      15,
      { duration: 1.2 },
    );
  } else {
    mapInstance.value.flyTo([PIURA_CENTER.lat, PIURA_CENTER.lng], 13);
  }
}

// Actualizar marcador del usuario reactivamente
watch(
  () => locationStore.currentCoords,
  (coords) => {
    if (!mapInstance.value || !coords) return;

    if (!userMarker) {
      userMarker = L.circleMarker([coords.lat, coords.lng], {
        radius: 9,
        fillColor: '#38bdf8',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      }).addTo(mapInstance.value);
    } else {
      userMarker.setLatLng([coords.lat, coords.lng]);
    }
  },
);
</script>

<template>
  <div class="disaster-map-wrapper">
    <!-- Lienzo del Mapa con basemap local (pmtiles / none) -->
    <MapCanvas @ready="onMapReady" @bbox-change="onBBoxChange" />

    <!-- Capa de Marcadores y Clustering Semafórico -->
    <IncidentMarkersLayer
      :map="mapInstance"
      :incidents="incidentStore.incidentList"
      @select="onSelectIncident"
    />

    <!-- Capa de Calor de Riesgo Histórico FEN (T03-4) -->
    <RiskHeatLayer
      :map="mapInstance"
      :visible="showRiskLayer"
      :bbox="currentBBox"
    />

    <!-- Estado de Socket en Vivo -->
    <SocketStatusBadge :is-connected="isConnected" />

    <!-- Selector de Capas -->
    <MapLayerToggle
      v-model:show-risk-layer="showRiskLayer"
      :has-risk-layer="true"
    />

    <!-- Leyenda de Niveles Semafóricos -->
    <SeverityLegend />

    <!-- Botón Flotante para Centrar en GPS -->
    <LocateMeButton
      :is-permission-denied="locationStore.isPermissionDenied"
      @click="centerOnUser"
    />

    <!-- Alertas Flotantes No Bloqueantes -->
    <div class="floating-alerts-stack">
      <StatusBanner
        v-if="locationStore.permissionWarning"
        type="warning"
        :message="locationStore.permissionWarning"
        dismissible
        @dismiss="locationStore.dismissWarning"
      />

      <StatusBanner
        v-if="lastAlert"
        type="danger"
        :message="lastAlert"
        dismissible
        @dismiss="lastAlert = null"
      />
    </div>

    <!-- Popup Interactivo de Detalle y Voto In Situ -->
    <IncidentPopup
      v-if="selectedIncident"
      :incident="selectedIncident"
      @close="selectedIncident = null"
    />
  </div>
</template>

<style scoped>
.disaster-map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #060b14;
}

.floating-alerts-stack {
  position: absolute;
  top: 3.5rem;
  left: 1rem;
  right: 1rem;
  max-width: 32rem;
  z-index: 500;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
