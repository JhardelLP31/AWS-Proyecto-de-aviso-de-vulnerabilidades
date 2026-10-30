<script setup lang="ts">
import type { IncidentDTO, IncidentStatus, Severity } from '@geoalert/contracts';
import { SEVERITY_LABELS, STATUS_LABELS } from '../../../shared/config/labels';
import TriageActions from './TriageActions.vue';

interface Props {
  incidents: IncidentDTO[];
  processingIncidentId?: string | null;
}

withDefaults(defineProps<Props>(), {
  processingIncidentId: null,
});

defineEmits<{
  (e: 'triage', incident: IncidentDTO, payload: { status?: IncidentStatus; severity?: Severity }): void;
}>();
</script>

<template>
  <div class="table-wrapper">
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
          v-for="incident in incidents"
          :key="incident.id"
          class="incident-row"
          :class="{ 'row-critical': incident.severity === 'RED' }"
        >
          <td>
            <span
              class="severity-badge"
              :style="{ backgroundColor: `${SEVERITY_LABELS[incident.severity]?.color}25`, color: SEVERITY_LABELS[incident.severity]?.color }"
            >
              {{ SEVERITY_LABELS[incident.severity]?.badge }} {{ incident.severity }}
            </span>
          </td>

          <td>
            <strong class="incident-title">{{ incident.title }}</strong>
            <p class="incident-desc">{{ incident.description }}</p>
          </td>

          <td>
            <span class="district-badge">📍 {{ incident.district || 'Piura' }}</span>
          </td>

          <td>
            <div class="veracity-cell">
              <span class="score-badge">{{ Number(incident.veracityScore).toFixed(1) }}</span>
              <small class="votes-meta">+{{ incident.confirmCount }} / -{{ incident.denyCount }}</small>
            </div>
          </td>

          <td>
            <span class="status-pill" :class="`status-${incident.status.toLowerCase()}`">
              {{ STATUS_LABELS[incident.status]?.badge }} {{ STATUS_LABELS[incident.status]?.label }}
            </span>
          </td>

          <td>
            <TriageActions
              :incident="incident"
              :is-processing="processingIncidentId === incident.id"
              @triage="(payload) => $emit('triage', incident, payload)"
            />
          </td>
        </tr>

        <tr v-if="incidents.length === 0">
          <td colspan="6" class="empty-state">
            No hay alertas activas que coincidan con los filtros aplicados.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.dispatch-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.8125rem;
}

.dispatch-table th {
  padding: 0.875rem 1rem;
  background: #0f172a;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.6875rem;
  border-bottom: 1px solid #334155;
}

.dispatch-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  vertical-align: middle;
}

.incident-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.row-critical {
  background: rgba(239, 68, 68, 0.04);
}

.severity-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 700;
  font-size: 0.75rem;
}

.incident-title {
  display: block;
  font-size: 0.875rem;
  color: #f8fafc;
  margin-bottom: 0.15rem;
}

.incident-desc {
  margin: 0;
  color: #94a3b8;
  font-size: 0.75rem;
  max-width: 24rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.district-badge {
  color: #cbd5e1;
  font-size: 0.75rem;
}

.veracity-cell {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.score-badge {
  font-weight: 700;
  color: #38bdf8;
}

.votes-meta {
  color: #64748b;
  font-size: 0.6875rem;
}

.status-pill {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  background: #1e293b;
  color: #94a3b8;
}

.status-verified {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.status-resolved {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.status-dismissed {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.empty-state {
  text-align: center;
  padding: 2.5rem !important;
  color: #64748b;
  font-style: italic;
}
</style>
