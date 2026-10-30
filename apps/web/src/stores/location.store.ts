import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LatLng } from '@geoalert/contracts';

// Coordenadas céntricas de Piura (Plaza de Armas / Río Piura)
export const PIURA_CENTER: LatLng = {
  lat: -5.1945,
  lng: -80.6328,
};

export const useLocationStore = defineStore('location', () => {
  const currentCoords = ref<LatLng | null>(null);
  const accuracyMeters = ref<number>(0);
  const isTracking = ref<boolean>(false);
  const error = ref<string | null>(null);

  let watchId: number | null = null;

  /**
   * Inicia el rastreo continuo de alta precisión para geocercado in situ.
   */
  function startTracking() {
    if (!navigator.geolocation) {
      error.value = 'Geolocalización no soportada en este dispositivo';
      return;
    }

    if (watchId !== null) return;

    isTracking.value = true;
    error.value = null;

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        currentCoords.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        accuracyMeters.value = position.coords.accuracy;
      },
      (err) => {
        console.warn('[LocationStore] Error de GPS:', err.message);
        error.value = err.message;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
    );
  }

  /**
   * Detiene el rastreo para ahorrar batería en campo.
   */
  function stopTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    isTracking.value = false;
  }

  return {
    currentCoords,
    accuracyMeters,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
});
