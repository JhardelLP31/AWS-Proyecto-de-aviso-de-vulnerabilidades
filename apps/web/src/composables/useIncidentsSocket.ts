import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';
import {
  WS_NAMESPACE,
  WsEvents,
  type IncidentDTO,
  type VoteRegisteredPayload,
  type BBox,
} from '@geoalert/contracts';
import { useIncidentStore } from '../stores/incident.store';

/**
 * Composable para suscripción y reactividad WebSocket en tiempo real.
 * Reconciliado con celdas geohash y eventos del cuadrante de Piura.
 */
export function useIncidentsSocket() {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);
  const lastAlert = ref<string | null>(null);
  const incidentStore = useIncidentStore();

  onMounted(() => {
    // Conexión al namespace /incidents con credenciales (cookie HttpOnly)
    const socketInstance = io(WS_NAMESPACE, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.value = socketInstance;

    socketInstance.on('connect', () => {
      isConnected.value = true;
      // Re-suscribir el viewport actual si existe
      if (incidentStore.lastBBox) {
        subscribeViewport(incidentStore.lastBBox);
      }
    });

    socketInstance.on('disconnect', () => {
      isConnected.value = false;
    });

    // Nuevo reporte de peligro creado
    socketInstance.on(WsEvents.IncidentCreated, (incident: IncidentDTO) => {
      incidentStore.upsertIncident(incident);
      if (incident.severity === 'RED') {
        lastAlert.value = `¡ALERTA ROJA! ${incident.title} en ${incident.district || 'Piura'}`;
      }
    });

    // Actualización de estado / severidad
    socketInstance.on(WsEvents.IncidentUpdated, (incident: IncidentDTO) => {
      incidentStore.upsertIncident(incident);
    });

    // Voto registrado por la comunidad (recálculo en vivo de veracidad)
    socketInstance.on(WsEvents.VoteRegistered, (payload: VoteRegisteredPayload) => {
      incidentStore.applyVoteUpdate(payload);
    });

    // Reporte escalado a verificado oficialmente
    socketInstance.on(WsEvents.IncidentVerified, (payload: VoteRegisteredPayload) => {
      incidentStore.applyVoteUpdate(payload);
      lastAlert.value = `Peligro validado por brigadistas y elevado a Defensa Civil`;
    });
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
  });

  /**
   * Suscribe el socket a las celdas geográficas del viewport actual
   */
  function subscribeViewport(bbox: BBox): void {
    if (socket.value && isConnected.value) {
      socket.value.emit(WsEvents.ViewportSubscribe, { bbox });
    }
  }

  return {
    isConnected,
    lastAlert,
    subscribeViewport,
  };
}
