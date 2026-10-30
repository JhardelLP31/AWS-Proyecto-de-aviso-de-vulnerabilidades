<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { DistrictRiskSummary } from '@geoalert/contracts';
import { http } from '../../shared/api/http';

const summaries = ref<DistrictRiskSummary[]>([]);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

onMounted(async () => {
  isLoading.value = true;
  try {
    const data = await http.get<DistrictRiskSummary[]>('/api/risk/districts');
    summaries.value = data;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error al cargar ranking histórico';
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="districts-panel">
    <header class="panel-header">
      <h3 class="panel-title">Ranking de Vulnerabilidad por Distrito (SINPAD 2010–2023)</h3>
      <span class="panel-subtitle">Basado en 5,000 emergencias históricas de INDECI Piura</span>
    </header>

    <div v-if="isLoading" class="loading-state">
      <span class="spinner" aria-hidden="true"></span>
      <span>Cargando análisis territorial...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <span>⚠️ {{ error }}</span>
    </div>

    <div v-else class="table-responsive">
      <table class="risk-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Distrito</th>
            <th>Score Riesgo</th>
            <th>Eventos Históricos</th>
            <th>% Críticos (Rojo)</th>
            <th>Damnificados</th>
            <th>Vulnerabilidad Suelo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(d, index) in summaries" :key="d.district" class="risk-row">
            <td class="rank-col">{{ index + 1 }}</td>
            <td class="district-col">
              <strong>{{ d.district }}</strong>
            </td>
            <td>
              <span class="score-badge">{{ Math.round(d.riskScore) }} / 100</span>
            </td>
            <td>{{ d.events }}</td>
            <td>
              <span :class="{ 'text-red': d.criticalShare > 0.3 }">
                {{ Math.round(d.criticalShare * 100) }}%
              </span>
            </td>
            <td>{{ d.damnificados.toLocaleString('es-PE') }}</td>
            <td>
              <div class="vuln-bar-wrapper">
                <div
                  class="vuln-bar"
                  :style="{ width: `${Math.round(d.soilVulnerability * 100)}%` }"
                ></div>
                <small>{{ (d.soilVulnerability * 100).toFixed(0) }}%</small>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.districts-panel {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-top: 1.5rem;
}
.panel-header { margin-bottom: 1rem; }
.panel-title { font-size: 1.125rem; font-weight: 700; color: #f8fafc; margin: 0 0 0.25rem; }
.panel-subtitle { font-size: 0.75rem; color: #94a3b8; }
.table-responsive { overflow-x: auto; }
.risk-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  text-align: left;
}
.risk-table th {
  padding: 0.625rem 0.75rem;
  color: #94a3b8;
  font-size: 0.6875rem;
  text-transform: uppercase;
  border-bottom: 1px solid #334155;
}
.risk-table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  color: #cbd5e1;
}
.rank-col { font-weight: 700; color: #38bdf8; }
.district-col { color: #f8fafc; }
.score-badge {
  display: inline-block;
  padding: 0.15rem 0.45rem;
  border-radius: 0.25rem;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-weight: 700;
}
.text-red { color: #f87171; font-weight: 700; }
.vuln-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 6rem;
}
.vuln-bar {
  height: 0.5rem;
  background: #f59e0b;
  border-radius: 0.25rem;
}
.loading-state, .error-state {
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
}
.spinner {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(56, 189, 248, 0.3);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 0.5rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
