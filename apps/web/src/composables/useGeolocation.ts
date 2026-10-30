import { computed, onMounted } from 'vue';
import { useLocationStore, PIURA_CENTER } from '../stores/location.store';

/**
 * Composable useGeolocation para consumo reactivo en vistas y mapa.
 * Notifica al usuario de forma no bloqueante si el GPS está desactivado o denegado.
 */
export function useGeolocation(autoStart = false) {
  const store = useLocationStore();

  onMounted(() => {
    if (autoStart) {
      store.startTracking();
    }
  });

  return {
    coords: computed(() => store.currentCoords),
    accuracyMeters: computed(() => store.accuracyMeters),
    isTracking: computed(() => store.isTracking),
    isPermissionDenied: computed(() => store.isPermissionDenied),
    permissionWarning: computed(() => store.permissionWarning),
    fallbackCenter: PIURA_CENTER,
    startTracking: store.startTracking,
    stopTracking: store.stopTracking,
    dismissWarning: store.dismissWarning,
  };
}
