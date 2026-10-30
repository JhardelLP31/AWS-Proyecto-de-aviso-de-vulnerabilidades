<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { RISK_DISCLAIMER, type RiskForecastResponse } from '@geoalert/contracts';
import { http } from '../../shared/api/http';
import { SEVERITY_LABELS } from '../../shared/config/labels';
import StatusBanner from '../../shared/ui/StatusBanner.vue';
import RiskDistrictsPanel from './RiskDistrictsPanel.vue';

const precipitationMm = ref<number>(45);
const forecastData = ref<RiskForecastResponse | null>(null);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

onMounted(() => {
  fetchForecast();
});

watch(precipitationMm, () => {
  fetchForecast();
});

async function fetchForecast() {
  isLoading.value = true;
  error.value = null;
  try {
    const data = await http.get<RiskForecastResponse>('/api/risk/forecast', {
      precipitationMm: precipitationMm.value,
    });
    forecastData.value = data;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error al obtener pronóstico';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="risk-forecast-container">
    <div class="forecast-inner">
      <header class="forecast-header">
        <router-link to="/" class="back-link">← Volver al Mapa</router-link>
        <h1 class="page-title">Simulador de Impacto por Lluvias FEN</h1>
        <p class="page-subtitle">
          Análisis predictivo distrital ante precipitaciones extremas en la región Piura.
        </p>
      </header>

      <!-- Aviso Legal Obligatorio de Misión Crítica (RISK_DISCLAIMER de contratos) -->
      <StatusBanner
        type="info"
        title="Aviso de Referencia Histórica"
        :message="RISK_DISCLAIMER"
      />

      <!-- Control Deslizante de Lluvia (mm) -->
      <section class="slider-card glass-panel">
        <div class="slider-header">
          <label for="rain-slider" class="slider-label">Precipitación Acumulada Esperada:</label>
          <div class="slider-badge">
            <span class="rain-value">{{ precipitationMm }}</span>
            <span class="rain-unit">mm / 24h</span>
          </div>
        </div>

        <input
          id="rain-slider"
          v-model.number="precipitationMm"
          type="range"
          min="5"
          max="180"
          step="5"
          class="rain-range-slider"
          :disabled="isLoading"
        />

        <div class="slider-scale">
          <span>5 mm (Llovizna)</span>
          <span>40 mm (Fuerte)</span>
          <span>80 mm (Torrencial)</span>
          <span>150+ mm (Histórico FEN)</span>
        </div>
      </section>

      <!-- Resultados del Pronóstico por Distrito -->
      <div v-if="isLoading" class="loading-box">
        <span class="spinner" aria-hidden="true"></span>
        <span>Calculando probabilidades con modelo histórico...</span>
      </div>

      <div v-else-if="error" class="error-box">
        <span>⚠️ {{ error }}</span>
      </div>

      <div v-else-if="forecastData" class="forecast-grid">
        <div
          v-for="d in forecastData.districts"
          :key="d.district"
          class="district-forecast-card"
          :style="{ borderTopColor: SEVERITY_LABELS[d.expectedSeverity]?.color }"
        >
          <div class="card-top">
            <h3 class="district-name">{{ d.district }}</h3>
            <span
              class="severity-badge"
              :style="{
                backgroundColor: `${SEVERITY_LABELS[d.expectedSeverity]?.color}25`,
                color: SEVERITY_LABELS[d.expectedSeverity]?.color,
              }"
            >
              {{ SEVERITY_LABELS[d.expectedSeverity]?.badge }} {{ d.expectedSeverity }}
            </span>
          </div>

          <div v-if="d.extrapolated" class="extrapolated-tag">
            ⚠️ Baja confianza (extrapolado)
          </div>

          <div class="forecast-stats">
            <div class="stat-item">
              <span class="stat-label">Damnificados est.:</span>
              <span class="stat-val">{{ Math.round(d.expectedDamnificados) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Muestra histórica:</span>
              <span class="stat-val">{{ d.sampleSize }} eventos</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Ranking Detallado de Distritos -->
      <RiskDistrictsPanel />
    </div>
  </div>
</template>

<style scoped>
.risk-forecast-container {
  min-height: 100vh;
  padding: 1.5rem 2rem;
  background-color: #060b14;
  overflow-y: auto;
}
.forecast-inner { max-width: 1100px; margin: 0 auto; }
.forecast-header { margin-bottom: 1.5rem; }
.back-link { color: #38bdf8; text-decoration: none; font-size: 0.8125rem; font-weight: 600; display: inline-block; margin-bottom: 0.5rem; }
.page-title { font-size: 1.75rem; font-weight: 800; color: #f8fafc; margin: 0 0 0.25rem; }
.page-subtitle { font-size: 0.875rem; color: #94a3b8; margin: 0; }
.slider-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.slider-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.slider-label { font-size: 0.875rem; font-weight: 700; color: #f8fafc; }
.slider-badge {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  padding: 0.35rem 0.75rem;
  background: #0284c7;
  border-radius: 0.5rem;
}
.rain-value { font-size: 1.25rem; font-weight: 800; color: #ffffff; }
.rain-unit { font-size: 0.75rem; color: #e0f2fe; }
.rain-range-slider {
  width: 100%;
  height: 0.5rem;
  accent-color: #38bdf8;
  cursor: pointer;
}
.slider-scale {
  display: flex;
  justify-content: space-between;
  font-size: 0.6875rem;
  color: #64748b;
  margin-top: 0.5rem;
}
.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
.district-forecast-card {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid #334155;
  border-top-width: 4px;
  border-radius: 0.5rem;
  padding: 1rem;
}
.card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.district-name { font-size: 0.9375rem; font-weight: 700; color: #f8fafc; margin: 0; }
.severity-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 0.25rem;
}
.extrapolated-tag {
  display: inline-block;
  font-size: 0.6875rem;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.15);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}
.forecast-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #94a3b8;
  border-top: 1px solid #1e293b;
  padding-top: 0.5rem;
}
.stat-val { font-weight: 700; color: #f8fafc; margin-left: 0.25rem; }
.loading-box, .error-box { padding: 2rem; text-align: center; color: #94a3b8; }
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
