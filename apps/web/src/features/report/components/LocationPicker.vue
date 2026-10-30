<script setup lang="ts">
import { computed } from 'vue';
import type { LatLng } from '@geoalert/contracts';
import BaseButton from '../../../shared/ui/BaseButton.vue';

interface Props {
  modelValue: LatLng | null;
  accuracyMeters?: number | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  accuracyMeters: null,
  disabled: false,
});

defineEmits<{
  (e: 'update:modelValue', value: LatLng): void;
  (e: 'locate'): void;
}>();

const coordsDisplay = computed(() => {
  if (!props.modelValue) return 'Sin coordenadas fijadas';
  return `${props.modelValue.lat.toFixed(5)}, ${props.modelValue.lng.toFixed(5)}`;
});
</script>

<template>
  <div class="location-picker">
    <div class="coords-bar">
      <input
        type="text"
        readonly
        :value="coordsDisplay"
        class="coords-input"
        :placeholder="'📍 Coordenadas'"
      />
      <BaseButton
        variant="secondary"
        size="sm"
        :disabled="disabled"
        @click="$emit('locate')"
      >
        📍 Fijar GPS
      </BaseButton>
    </div>

    <div v-if="accuracyMeters" class="accuracy-hint">
      Precisión GPS: ±{{ Math.round(accuracyMeters) }} metros
    </div>
  </div>
</template>

<style scoped>
.location-picker {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.coords-bar {
  display: flex;
  gap: 0.5rem;
}

.coords-input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  color: #94a3b8;
  font-family: monospace;
  font-size: 0.8125rem;
  outline: none;
}

.accuracy-hint {
  font-size: 0.6875rem;
  color: #38bdf8;
}
</style>
