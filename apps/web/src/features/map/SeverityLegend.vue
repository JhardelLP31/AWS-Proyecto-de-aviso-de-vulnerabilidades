<template>
  <div class="legend-panel glass-card">
    <div class="legend-header">
      <span class="legend-title">Semáforo de Emergencia FEN</span>
    </div>

    <div class="legend-items">
      <div class="legend-item">
        <span class="color-dot dot-red"></span>
        <span class="legend-label">Crítico (Dique / Desborde)</span>
      </div>

      <div class="legend-item">
        <span class="color-dot dot-orange"></span>
        <span class="legend-label">Grave (Cuenca colapsada)</span>
      </div>

      <div class="legend-item">
        <span class="color-dot dot-yellow"></span>
        <span class="legend-label">Moderado (Encharcamiento)</span>
      </div>

      <div class="legend-item">
        <span class="color-dot dot-green"></span>
        <span class="legend-label">Normal / Controlado</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.legend-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 500;
  padding: 0.75rem 0.9rem;
  max-width: 230px;
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

.dot-red {
  background-color: var(--sev-red);
  box-shadow: 0 0 6px var(--sev-red-glow);
}

.dot-orange {
  background-color: var(--sev-orange);
  box-shadow: 0 0 6px var(--sev-orange-glow);
}

.dot-yellow {
  background-color: var(--sev-yellow);
  box-shadow: 0 0 6px var(--sev-yellow-glow);
}

.dot-green {
  background-color: var(--sev-green);
  box-shadow: 0 0 6px var(--sev-green-glow);
}

.legend-label {
  font-size: 0.75rem;
  color: var(--text-main);
  white-space: nowrap;
}
</style>
