<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet.heat';
import type { BBox, RiskHeatCell } from '@geoalert/contracts';
import { http } from '../../../shared/api/http';

interface Props {
  map: L.Map | null;
  visible: boolean;
  bbox: BBox | null;
}

const props = defineProps<Props>();

let heatLayer: L.Layer | null = null;
const isLoading = ref<boolean>(false);

watch(
  [() => props.map, () => props.visible, () => props.bbox],
  async ([newMap, isVisible, currentBBox]) => {
    if (!newMap || !isVisible) {
      removeHeatLayer();
      return;
    }
    await loadAndRenderHeatmap(newMap, currentBBox);
  },
  { immediate: true },
);

onUnmounted(() => {
  removeHeatLayer();
});

function removeHeatLayer() {
  if (heatLayer && props.map) {
    props.map.removeLayer(heatLayer);
    heatLayer = null;
  }
}

async function loadAndRenderHeatmap(mapInstance: L.Map, bbox: BBox | null) {
  if (!bbox) return;

  isLoading.value = true;
  try {
    const cells = await http.get<RiskHeatCell[]>('/api/risk/heatmap', {
      bbox: bbox.join(','),
    });

    removeHeatLayer();

    if (!cells || cells.length === 0) return;

    // Convertir celdas a puntos [lat, lng, intensidad]
    const heatPoints: [number, number, number][] = cells.map((c) => [
      c.lat,
      c.lng,
      c.weight,
    ]);

    const heatFactory = (L as unknown as { heatLayer: (pts: [number, number, number][], opts: unknown) => L.Layer }).heatLayer;

    if (typeof heatFactory === 'function') {
      heatLayer = heatFactory(heatPoints, {
        radius: 25,
        blur: 18,
        maxZoom: 15,
        max: 1.0,
        gradient: {
          0.2: '#22c55e',
          0.5: '#eab308',
          0.7: '#f97316',
          1.0: '#ef4444',
        },
      });
      heatLayer.addTo(mapInstance);
    }
  } catch (err: unknown) {
    console.warn('[RiskHeatLayer] Error cargando celdas de calor:', err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <span style="display: none;"></span>
</template>
