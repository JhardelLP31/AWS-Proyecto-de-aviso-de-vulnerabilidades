<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import type { BBox } from '@geoalert/contracts';
import { PIURA_CENTER } from '../../../stores/location.store';
import { createBasemapLayer } from '../../../shared/map/basemap';

const emit = defineEmits<{
  (e: 'ready', map: L.Map): void;
  (e: 'bbox-change', bbox: BBox): void;
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
let mapInstance: L.Map | null = null;

onMounted(() => {
  if (!mapContainer.value) return;

  mapInstance = L.map(mapContainer.value, {
    preferCanvas: true,
    zoomControl: false,
    minZoom: 9,
    maxZoom: 18,
  }).setView([PIURA_CENTER.lat, PIURA_CENTER.lng], 13);

  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  // Mapa base 100% local (sin conexiones externas)
  const basemap = createBasemapLayer();
  basemap.addTo(mapInstance);

  mapInstance.on('moveend', emitBBox);
  emit('ready', mapInstance);
  emitBBox();
});

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});

function emitBBox() {
  if (!mapInstance) return;
  const bounds = mapInstance.getBounds();
  const bbox: BBox = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ];
  emit('bbox-change', bbox);
}
</script>

<template>
  <div ref="mapContainer" class="map-canvas-viewport"></div>
</template>

<style scoped>
.map-canvas-viewport {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  background-color: #060b14;
}
</style>
