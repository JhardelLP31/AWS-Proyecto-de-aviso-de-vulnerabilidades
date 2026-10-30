<template>
  <div class="legend-panel glass-card">
    <div class="legend-header">
      <span class="legend-title">Semáforo de Emergencia FEN</span>
    </div>

    <div class="legend-items">
      <div v-for="(config, sev) in SEVERITY_CONFIGS" :key="sev" class="legend-item">
        <span class="color-dot" :style="{ backgroundColor: config.color, boxShadow: `0 0 6px ${config.glowColor}` }"></span>
        <span class="legend-label">{{ config.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SEVERITY_CONFIGS } from '../../shared/map/severity-style';
</script>

<style scoped>
.legend-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 500;
  padding: 0.75rem 0.9rem;
  max-width: 250px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  pointer-events: auto;
}

.legend-header {
  margin-bottom: 0.5rem;
}

.legend-title {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 0.725rem;
  color: var(--text-main);
  white-space: nowrap;
}
</style>
