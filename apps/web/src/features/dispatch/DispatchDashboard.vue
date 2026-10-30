<script setup lang="ts">
import { ref, computed } from 'vue';
import type { IncidentDTO, Severity, IncidentStatus } from '@geoalert/contracts';
import { useIncidentStore } from '../../stores/incident.store';
import { useToast } from '../../shared/ui/useToast';
import { ApiError } from '../../shared/api/http';
import DispatchFilters from './components/DispatchFilters.vue';
import IncidentQueueTable from './components/IncidentQueueTable.vue';

const incidentStore = useIncidentStore();
const toast = useToast();

const selectedSeverity = ref<Severity | 'ALL'>('ALL');
const selectedDistrict = ref<string>('ALL');
const processingIncidentId = ref<string | null>(null);

const activeDistrictsCount = computed(() => {
  const districts = new Set(incidentStore.incidentList.map((i) => i.district).filter(Boolean));
  return districts.size;
});

const filteredIncidents = computed<IncidentDTO[]>(() => {
  return incidentStore.incidentList.filter((item) => {
    const matchSev = selectedSeverity.value === 'ALL' || item.severity === selectedSeverity.value;
    const matchDist = selectedDistrict.value === 'ALL' || item.district === selectedDistrict.value;
    return matchSev && matchDist;
  });
});

async function handleTriage(
  incident: IncidentDTO,
  patch: { status?: IncidentStatus; severity?: Severity },
) {
  processingIncidentId.value = incident.id;
  const currentVersion = (incident as unknown as { version?: number }).version ?? 0;

  try {
    await incidentStore.updateTriage(incident.id, {
      ...patch,
      expectedVersion: currentVersion,
    });
    toast.success('Triaje persistido en la API exitosamente', 'Despacho COER');
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 409) {
      toast.warning(
        'Otro operador actualizó este incidente. Recargando datos...',
        'Conflicto de Versión (409)',
      );
      await incidentStore.fetchIncidentById(incident.id);
    } else {
      const msg = err instanceof Error ? err.message : 'Error al persistir triaje';
      toast.error(msg, 'Error de Despacho');
    }
  } finally {
    processingIncidentId.value = null;
  }
}
</script>

<template>
  <div class="dispatch-dashboard-container">
    <div class="dashboard-inner">
      <header class="dispatch-header">
        <div>
          <span class="badge-coer">CENTRO DE OPERACIONES DE EMERGENCIA REGIONAL</span>
          <h1 class="dispatch-title">Consola de Despacho y Triaje FEN — Piura</h1>
          <p class="dispatch-subtitle">
            Monitoreo en tiempo real de reportes comunitarios y triaje oficial de Defensa Civil.
          </p>
        </div>

        <router-link to="/" class="btn-map">
          🗺️ Ver Mapa
        </router-link>
      </header>

      <!-- Métricas Clave de Operaciones -->
      <section class="metrics-grid">
        <div class="metric-card">
          <span class="metric-icon">🌊</span>
          <div class="metric-info">
            <span class="metric-value">{{ incidentStore.incidentList.length }}</span>
            <span class="metric-label">Reportes Totales</span>
          </div>
        </div>

        <div class="metric-card">
          <span class="metric-icon">✅</span>
          <div class="metric-info">
            <span class="metric-value text-green">{{ incidentStore.verifiedIncidents.length }}</span>
            <span class="metric-label">Validados en Terreno</span>
          </div>
        </div>

        <div class="metric-card">
          <span class="metric-icon">🚨</span>
          <div class="metric-info">
            <span class="metric-value text-red">{{ incidentStore.criticalIncidents.length }}</span>
            <span class="metric-label">Alertas Críticas (Rojas)</span>
          </div>
        </div>

        <div class="metric-card">
          <span class="metric-icon">📍</span>
          <div class="metric-info">
            <span class="metric-value">{{ activeDistrictsCount }}</span>
            <span class="metric-label">Distritos Afectados</span>
          </div>
        </div>
      </section>

      <!-- Barra de Filtros -->
      <DispatchFilters
        v-model:selected-severity="selectedSeverity"
        v-model:selected-district="selectedDistrict"
      />

      <!-- Tabla de Incidentes en Cola -->
      <IncidentQueueTable
        :incidents="filteredIncidents"
        :processing-incident-id="processingIncidentId"
        @triage="handleTriage"
      />
    </div>
  </div>
</template>

<style scoped>
.dispatch-dashboard-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  background-color: #060b14;
}
.dashboard-inner { max-width: 1200px; margin: 0 auto; }
.dispatch-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.badge-coer {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 0.25rem;
  margin-bottom: 0.35rem;
}
.dispatch-title { font-size: 1.75rem; font-weight: 800; color: #f8fafc; margin: 0 0 0.25rem; }
.dispatch-subtitle { font-size: 0.875rem; color: #94a3b8; margin: 0; }
.btn-map {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.875rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  color: #f8fafc;
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 600;
}
.btn-map:hover { border-color: #38bdf8; }
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 0.75rem;
}
.metric-icon { font-size: 1.75rem; }
.metric-info { display: flex; flex-direction: column; }
.metric-value { font-size: 1.5rem; font-weight: 800; color: #f8fafc; line-height: 1.1; }
.text-green { color: #4ade80; }
.text-red { color: #f87171; }
.metric-label { font-size: 0.75rem; color: #94a3b8; }
</style>
