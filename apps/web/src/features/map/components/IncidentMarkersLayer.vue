<script setup lang="ts">
import { watch, onUnmounted } from 'vue';
import L from 'leaflet';
import type { IncidentDTO, Severity } from '@geoalert/contracts';
import { createIncidentClusterGroup } from '../../../shared/map/cluster';
import { getSeverityColor } from '../../../shared/map/severity-style';

/** Subclase tipada de Leaflet CircleMarker sin uso de 'any' */
class IncidentCircleMarker extends L.CircleMarker {
  incidentSeverity!: Severity;
  incidentId!: string;
}

interface Props {
  map: L.Map | null;
  incidents: IncidentDTO[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'select', incident: IncidentDTO): void;
}>();

let clusterGroup: L.MarkerClusterGroup | null = null;

watch(
  () => props.map,
  (newMap) => {
    if (newMap && !clusterGroup) {
      clusterGroup = createIncidentClusterGroup();
      newMap.addLayer(clusterGroup);
      renderMarkers();
    }
  },
  { immediate: true },
);

watch(
  () => props.incidents,
  () => {
    renderMarkers();
  },
  { deep: true },
);

onUnmounted(() => {
  if (clusterGroup && props.map) {
    props.map.removeLayer(clusterGroup);
    clusterGroup.clearLayers();
    clusterGroup = null;
  }
});

function renderMarkers() {
  if (!clusterGroup) return;
  clusterGroup.clearLayers();

  props.incidents.forEach((incident) => {
    const color = getSeverityColor(incident.severity);

    const marker = new IncidentCircleMarker([incident.lat, incident.lng], {
      radius: 8,
      fillColor: color,
      color: '#ffffff',
      weight: 1.5,
      opacity: 0.95,
      fillOpacity: 0.85,
    });

    marker.incidentSeverity = incident.severity;
    marker.incidentId = incident.id;

    marker.on('click', () => {
      emit('select', incident);
    });

    clusterGroup?.addLayer(marker);
  });
}
</script>

<template>
  <!-- Capa puramente lógica en el mapa Leaflet -->
  <span style="display: none;"></span>
</template>
