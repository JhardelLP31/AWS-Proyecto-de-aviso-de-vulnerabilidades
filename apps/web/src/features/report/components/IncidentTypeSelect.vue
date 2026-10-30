<script setup lang="ts">
import type { IncidentType } from '@geoalert/contracts';
import { INCIDENT_TYPE_OPTIONS } from '../../../shared/config/labels';

interface Props {
  modelValue: IncidentType;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});

defineEmits<{
  (e: 'update:modelValue', value: IncidentType): void;
}>();
</script>

<template>
  <select
    id="incident-type"
    :value="modelValue"
    :disabled="disabled"
    class="incident-select"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value as IncidentType)"
  >
    <option
      v-for="opt in INCIDENT_TYPE_OPTIONS"
      :key="opt.value"
      :value="opt.value"
    >
      {{ opt.label }}
    </option>
  </select>
</template>

<style scoped>
.incident-select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  color: #f8fafc;
  font-family: inherit;
  font-size: 0.875rem;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
}

.incident-select:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

.incident-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
