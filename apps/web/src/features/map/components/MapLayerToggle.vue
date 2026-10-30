<script setup lang="ts">
interface Props {
  showRiskLayer?: boolean;
  hasRiskLayer?: boolean;
}

withDefaults(defineProps<Props>(), {
  showRiskLayer: false,
  hasRiskLayer: true,
});

defineEmits<{
  (e: 'update:showRiskLayer', val: boolean): void;
}>();
</script>

<template>
  <div class="layer-toggle-panel">
    <div class="toggle-item">
      <span class="toggle-icon">🚨</span>
      <span class="toggle-label">Alertas FEN</span>
      <span class="toggle-status active">Activo</span>
    </div>

    <div v-if="hasRiskLayer" class="toggle-item">
      <span class="toggle-icon">🌧️</span>
      <span class="toggle-label">Riesgo Histórico</span>
      <input
        type="checkbox"
        :checked="showRiskLayer"
        class="toggle-checkbox"
        @change="$emit('update:showRiskLayer', ($event.target as HTMLInputElement).checked)"
      />
    </div>
  </div>
</template>

<style scoped>
.layer-toggle-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 500;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 0.5rem;
  backdrop-filter: blur(8px);
  font-size: 0.75rem;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #cbd5e1;
}

.toggle-status.active {
  color: #4ade80;
  font-size: 0.6875rem;
  font-weight: 700;
}

.toggle-checkbox {
  cursor: pointer;
  accent-color: #38bdf8;
}
</style>
