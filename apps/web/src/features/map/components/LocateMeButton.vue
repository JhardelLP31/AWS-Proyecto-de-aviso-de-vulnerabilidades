<script setup lang="ts">
interface Props {
  isPermissionDenied?: boolean;
}

withDefaults(defineProps<Props>(), {
  isPermissionDenied: false,
});

defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <button
    type="button"
    class="locate-fab"
    :class="{ 'is-disabled': isPermissionDenied }"
    :title="isPermissionDenied ? 'GPS no disponible: centrar en Piura' : 'Centrar mapa en mi posición GPS'"
    @click="$emit('click')"
  >
    <span class="fab-icon">🎯</span>
  </button>
</template>

<style scoped>
.locate-fab {
  position: absolute;
  bottom: 2rem;
  right: 1.25rem;
  z-index: 500;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #1e293b;
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
}

.locate-fab:hover:not(.is-disabled) {
  transform: scale(1.08);
  background: #0284c7;
  border-color: #38bdf8;
}

.locate-fab.is-disabled {
  opacity: 0.7;
  filter: grayscale(0.5);
}
</style>
