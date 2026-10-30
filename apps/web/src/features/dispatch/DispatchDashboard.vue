<template>
  <div class="dispatch-dashboard-container">
    <div class="dashboard-inner">
      <!-- Encabezado de Despacho COER -->
      <div class="dispatch-header">
        <div>
          <span class="badge badge-red pulse-badge">CENTRO DE OPERACIONES DE EMERGENCIA REGIONAL</span>
          <h1 class="dispatch-title">Consola de Despacho y Triaje FEN — Piura</h1>
          <p class="dispatch-subtitle">
            Monitoreo en tiempo real de reportes comunitarios verificados para envío de brigadas de rescate y motobombas.
          </p>
        </div>

        <div class="dispatch-actions">
          <router-link to="/" class="btn btn-ghost">
            🗺️ Ver en Mapa
          </router-link>
        </div>
      </div>

      <!-- Métricas Clave de Operaciones -->
      <div class="metrics-grid">
        <div class="metric-card glass-card">
          <span class="metric-icon">🌊</span>
          <div class="metric-info">
            <span class="metric-value">{{ incidentStore.incidentList.length }}</span>
            <span class="metric-label">Reportes Totales en Cuenca</span>
          </div>
        </div>

        <div class="metric-card glass-card">
          <span class="metric-icon">✅</span>
          <div class="metric-info">
            <span class="metric-value text-green">{{ incidentStore.verifiedIncidents.length }}</span>
            <span class="metric-label">Validados por Brigadas</span>
          </div>
        </div>

        <div class="metric-card glass-card">
          <span class="metric-icon">🚨</span>
          <div class="metric-info">
            <span class="metric-value text-red">{{ incidentStore.criticalIncidents.length }}</span>
            <span class="metric-label">Alertas Críticas (Rojas)</span>
          </div>
        </div>

        <div class="metric-card glass-card">
          <span class="metric-icon">📍</span>
          <div class="metric-info">
            <span class="metric-value">{{ activeDistrictsCount }}</span>
            <span class="metric-label">Distritos Afectados</span>
          </div>
        </div>
      </div>

      <!-- Filtros de la Cola de Triaje -->
      <div class="triage-toolbar glass-card">
        <div class="filter-group">
          <label class="filter-label">Filtrar Severidad:</label>
          <div class="filter-pills">
            <button
              v-for="sev in ['ALL', 'RED', 'ORANGE', 'YELLOW', 'GREEN'] as const"
              :key="sev"
              class="filter-pill"
              :class="{ 'is-active': selectedSeverity === sev }"
              @click="selectedSeverity = sev"
            >
              {{ sev === 'ALL' ? 'Todos' : sev }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label" for="district-filter">Distrito:</label>
          <select id="district-filter" v-model="selectedDistrict" class="form-select district-select">
            <option value="ALL">Todos los Distritos</option>
            <option value="Piura">Piura Centro</option>
            <option value="Castilla">Castilla</option>
            <option value="Veintiséis de Octubre">Veintiséis de Octubre</option>
            <option value="Catacaos">Catacaos</option>
            <option value="Cura Mori">Cura Mori</option>
            <option value="Tambogrande">Tambogrande</option>
            <option value="Chulucanas">Chulucanas</option>
          </select>
        </div>
      </div>

      <!-- Cola de Incidentes para Triaje -->
      <div class="incidents-table-container glass-panel">
        <table class="dispatch-table">
          <thead>
            <tr>
              <th>Severidad</th>
              <th>Evento / Título</th>
              <th>Distrito</th>
              <th>Veracidad</th>
              <th>Estado</th>
              <th>Acción de Despacho</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="incident in filteredIncidents"
              :key="incident.id"
              class="incident-row"
              :class="{ 'row-critical': incident.severity === 'RED' }"
            >
              <td>
                <span class="badge" :class="`badge-${incident.severity.toLowerCase()}`">
                  {{ incident.severity }}
                </span>
              </td>

              <td>
                <strong class="incident-title-cell">{{ incident.title }}</strong>
                <p class="incident-desc-cell">{{ incident.description }}</p>
              </td>

              <td>
                <span class="district-badge">📍 {{ incident.district || 'Piura' }}</span>
              </td>

              <td>
                <div class="veracity-cell">
                  <span class="score-badge">{{ Number(incident.veracityScore).toFixed(1) }}</span>
                  <small>+{{ incident.confirmCount }} / -{{ incident.denyCount }}</small>
                </div>
              </td>

              <td>
                <span class="status-pill" :class="`status-${incident.status.toLowerCase()}`">
                  {{ incident.status }}
                </span>
              </td>

              <td>
                <div class="action-buttons">
                  <button
                    class="btn btn-primary btn-xs"
                    @click="dispatchTeam(incident)"
                    title="Despachar brigadistas a este punto"
                  >
                    🚀 Despachar
                  </button>

                  <button
                    class="btn btn-ghost btn-xs"
                    @click="updateTriageStatus(incident, 'RESOLVED')"
                    title="Marcar como resuelto / drenado"
                  >
                    ✓
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredIncidents.length === 0">
              <td colspan="6" class="empty-state">
                No hay alertas activas que coincidan con los filtros aplicados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { IncidentDTO, Severity } from '@geoalert/contracts';
import { useIncidentStore } from '../../stores/incident.store';

const incidentStore = useIncidentStore();

const selectedSeverity = ref<Severity | 'ALL'>('ALL');
const selectedDistrict = ref<string>('ALL');

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

function dispatchTeam(incident: IncidentDTO) {
  alert(`Despacho de brigada INDECI / Bomberos registrado para: "${incident.title}"`);
}

function updateTriageStatus(incident: IncidentDTO, newStatus: string) {
  incident.status = newStatus as any;
  incidentStore.upsertIncident({ ...incident });
}
</script>

<style scoped>
.dispatch-dashboard-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  background-color: var(--bg-deep);
}

.dashboard-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.dispatch-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.pulse-badge {
  font-size: 0.65rem;
  margin-bottom: 0.4rem;
}

.dispatch-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.dispatch-subtitle {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-top: 0.25rem;
  max-width: 750px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.15rem;
}

.metric-icon {
  font-size: 2rem;
}

.metric-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main);
  font-family: var(--font-display);
}

.text-green {
  color: var(--sev-green);
}

.text-red {
  color: var(--sev-red);
}

.metric-label {
  display: block;
  font-size: 0.725rem;
  color: var(--text-dim);
  font-weight: 600;
  text-transform: uppercase;
}

.triage-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-dim);
}

.filter-pills {
  display: flex;
  gap: 0.35rem;
}

.filter-pill {
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  color: var(--text-dim);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--trans-fast);
}

.filter-pill:hover,
.filter-pill.is-active {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
  color: #38bdf8;
}

.district-select {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
}

.incidents-table-container {
  overflow-x: auto;
}

.dispatch-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.dispatch-table th {
  padding: 0.9rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dispatch-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.825rem;
  vertical-align: middle;
}

.incident-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.row-critical {
  background: rgba(239, 68, 68, 0.03);
}

.incident-title-cell {
  display: block;
  color: var(--text-main);
  font-size: 0.9rem;
}

.incident-desc-cell {
  font-size: 0.775rem;
  color: var(--text-dim);
  margin-top: 0.2rem;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.district-badge {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.veracity-cell {
  display: flex;
  flex-direction: column;
}

.score-badge {
  font-weight: 800;
  color: #38bdf8;
}

.status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}

.status-verified {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.status-pending {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.action-buttons {
  display: flex;
  gap: 0.45rem;
}

.btn-xs {
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
}
</style>
