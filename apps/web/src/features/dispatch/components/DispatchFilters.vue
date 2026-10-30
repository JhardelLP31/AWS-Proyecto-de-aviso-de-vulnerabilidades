<script setup lang="ts">
import type { Severity } from '@geoalert/contracts';
import { SEVERITY_LABELS } from '../../../shared/config/labels';

interface Props {
  selectedSeverity: Severity | 'ALL';
  selectedDistrict: string;
  districts?: string[];
}

withDefaults(defineProps<Props>(), {
  districts: () => [
    'Piura',
    'Castilla',
    'Veintiséis de Octubre',
    'Catacaos',
    'Cura Mori',
    'Tambogrande',
    'Chulucanas',
    'Sullana',
  ],
});

defineEmits<{
  (e: 'update:selectedSeverity', value: Severity | 'ALL'): void;
  (e: 'update:selectedDistrict', value: string): void;
}>();

const severities: (Severity | 'ALL')[] = ['ALL', 'RED', 'ORANGE', 'YELLOW', 'GREEN'];
</script>

<template>
  <div class="dispatch-filters glass-card">
    <div class="filter-group">
      <span class="filter-label">Severidad:</span>
      <div class="pills-row">
        <button
          v-for="sev in severities"
          :key="sev"
          type="button"
          class="pill-btn"
          :class="{ 'is-active': selectedSeverity === sev }"
          @click="$emit('update:selectedSeverity', sev)"
        >
          <span v-if="sev !== 'ALL'">{{ SEVERITY_LABELS[sev]?.badge }}</span>
          <span>{{ sev === 'ALL' ? 'Todos' : sev }}</span>
        </button>
      </div>
    </div>

    <div class="filter-group">
      <label class="filter-label" for="filter-district">Distrito:</label>
      <select
        id="filter-district"
        class="district-select"
        :value="selectedDistrict"
        @change="$emit('update:selectedDistrict', ($event.target as HTMLSelectElement).value)"
      >
        <option value="ALL">Todos los Distritos</option>
        <option v-for="d in districts" :key="d" :value="d">
          {{ d }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.dispatch-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  margin-bottom: 1.5rem;
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #94a3b8;
}

.pills-row {
  display: flex;
  gap: 0.35rem;
}

.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.65rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  background: #1e293b;
  border: 1px solid #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill-btn:hover {
  color: #f8fafc;
  border-color: #38bdf8;
}

.pill-btn.is-active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0369a1;
}

.district-select {
  padding: 0.375rem 0.75rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.375rem;
  color: #f8fafc;
  font-size: 0.8125rem;
  outline: none;
  cursor: pointer;
}
</style>
