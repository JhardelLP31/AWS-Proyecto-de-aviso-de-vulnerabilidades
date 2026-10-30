<script setup lang="ts">
export interface SelectOption {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
}

interface Props {
  modelValue: string | number;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: '',
  id: '',
});

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <select
    :id="id"
    class="base-select"
    :value="modelValue"
    :disabled="disabled"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-if="placeholder" value="" disabled>
      {{ placeholder }}
    </option>
    <option
      v-for="opt in options"
      :key="opt.value"
      :value="opt.value"
    >
      {{ opt.label }}
    </option>
  </select>
</template>

<style scoped>
.base-select {
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

.base-select:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

.base-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
