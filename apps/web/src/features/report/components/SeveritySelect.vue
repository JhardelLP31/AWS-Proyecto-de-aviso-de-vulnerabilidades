<script setup lang="ts">
import type { Severity } from '@geoalert/contracts';
import { SEVERITY_OPTIONS, SEVERITY_LABELS } from '../../../shared/config/labels';

interface Props {
  modelValue: Severity;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

defineEmits<{
  (e: 'update:modelValue', value: Severity): void;
}>();
</script>

<template>
  <select
    id="incident-severity"
    :value="modelValue"
    :disabled="disabled"
    class="severity-select"
    :style="{ borderColor: SEVERITY_LABELS[modelValue]?.color }"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value as Severity)"
  >
    <option
      v-for="opt in SEVERITY_OPTIONS"
      :key="opt.value"
      :value="opt.value"
    >
      {{ opt.label }}
    </option>
  </select>
</template>

<style scoped>
.severity-select {
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
  transition: border-color 0.2s ease;
}

.severity-select:focus {
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

.severity-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
