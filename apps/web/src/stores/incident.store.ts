import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  IncidentDTO,
  VoteKind,
  VoteRegisteredPayload,
  BBox,
  TriageRequest,
} from '@geoalert/contracts';
import { http } from '../shared/api/http';

export const useIncidentStore = defineStore('incidents', () => {
  const incidents = ref<Map<string, IncidentDTO>>(new Map());
  const activeIncidentId = ref<string | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastBBox = ref<BBox | null>(null);

  const incidentList = computed<IncidentDTO[]>(() => Array.from(incidents.value.values()));

  const activeIncident = computed<IncidentDTO | null>(() => {
    if (!activeIncidentId.value) return null;
    return incidents.value.get(activeIncidentId.value) || null;
  });

  const verifiedIncidents = computed<IncidentDTO[]>(() =>
    incidentList.value.filter((i) => i.status === 'VERIFIED'),
  );

  const criticalIncidents = computed<IncidentDTO[]>(() =>
    incidentList.value.filter((i) => i.severity === 'RED'),
  );

  /**
   * Carga los incidentes contenidos en el Bounding Box visible del mapa.
   */
  async function fetchIncidentsByBBox(bbox: BBox): Promise<IncidentDTO[]> {
    lastBBox.value = bbox;
    isLoading.value = true;
    error.value = null;

    try {
      const data = await http.get<IncidentDTO[]>('/api/incidents', {
        bbox: bbox.join(','),
      });

      // Actualizar mapa reactivo
      data.forEach((incident) => {
        incidents.value.set(incident.id, incident);
      });

      return data;
    } catch (err: unknown) {
      console.warn('[IncidentStore] Error cargando incidentes por BBox:', err);
      const msg = err instanceof Error ? err.message : 'Error al cargar incidentes';
      error.value = msg;
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Recarga un incidente individual desde la API (útil tras STALE_VERSION 409).
   */
  async function fetchIncidentById(id: string): Promise<IncidentDTO | null> {
    try {
      const incident = await http.get<IncidentDTO>(`/api/incidents/${id}`);
      incidents.value.set(incident.id, incident);
      return incident;
    } catch (err: unknown) {
      console.warn(`[IncidentStore] Error recargando incidente ${id}:`, err);
      return null;
    }
  }

  /**
   * Envía un nuevo reporte de incidente (con soporte multipart para fotos WebP).
   */
  async function createIncident(formData: FormData): Promise<IncidentDTO> {
    isLoading.value = true;
    error.value = null;

    try {
      const created = await http.post<IncidentDTO>('/api/incidents', formData);
      incidents.value.set(created.id, created);
      return created;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar incidente';
      error.value = msg;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Emite un voto in situ ("Confirmar" o "Desmentir") con coordenadas para geocerca <500m.
   */
  async function voteIncident(params: {
    incidentId: string;
    kind: VoteKind;
    lat: number;
    lng: number;
    comment?: string;
  }): Promise<VoteRegisteredPayload> {
    const result = await http.post<VoteRegisteredPayload>(
      `/api/incidents/${params.incidentId}/vote`,
      {
        kind: params.kind,
        lat: params.lat,
        lng: params.lng,
        comment: params.comment,
      },
    );

    applyVoteUpdate(result);
    return result;
  }

  /**
   * Actualiza el triaje de un incidente (estado y/o severidad) llamando a PATCH /api/incidents/:id/triage.
   * Utiliza bloqueo optimista con expectedVersion (T03-3).
   */
  async function updateTriage(
    incidentId: string,
    payload: TriageRequest,
  ): Promise<IncidentDTO> {
    const updated = await http.patch<IncidentDTO>(
      `/api/incidents/${incidentId}/triage`,
      payload,
    );
    incidents.value.set(updated.id, updated);
    return updated;
  }

  /**
   * Aplica la actualización de veracidad recibida vía HTTP o WebSocket.
   */
  function applyVoteUpdate(payload: VoteRegisteredPayload): void {
    const existing = incidents.value.get(payload.incidentId);
    if (existing) {
      existing.veracityScore = payload.veracityScore;
      existing.confirmCount = payload.confirmCount;
      existing.denyCount = payload.denyCount;
      existing.status = payload.status;
      incidents.value.set(payload.incidentId, { ...existing });
    }
  }

  /**
   * Inserta o reemplaza un incidente recibido por WebSocket en tiempo real.
   */
  function upsertIncident(incident: IncidentDTO): void {
    incidents.value.set(incident.id, incident);
  }

  function setActiveIncident(id: string | null): void {
    activeIncidentId.value = id;
  }

  return {
    incidents,
    incidentList,
    activeIncidentId,
    activeIncident,
    verifiedIncidents,
    criticalIncidents,
    isLoading,
    error,
    lastBBox,
    fetchIncidentsByBBox,
    fetchIncidentById,
    createIncident,
    voteIncident,
    updateTriage,
    applyVoteUpdate,
    upsertIncident,
    setActiveIncident,
  };
});
