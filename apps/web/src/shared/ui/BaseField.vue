<script setup lang="ts">
interface Props {
  label?: string;
  error?: string | null;
  hint?: string | null;
  required?: boolean;
  id?: string;
}

withDefaults(defineProps<Props>(), {
  label: '',
  error: null,
  hint: null,
  required: false,
  id: '',
});
</script>

<template>
  <div class="base-field" :class="{ 'has-error': !!error }">
    <label v-if="label" :for="id" class="field-label">
      {{ label }}
      <span v-if="required" class="required-star" aria-hidden="true">*</span>
    </label>

    <div class="field-control">
      <slot></slot>
    </div>

    <div v-if="error" class="field-error" role="alert">
      {{ error }}
    </div>
    <div v-else-if="hint" class="field-hint">
      {{ hint }}
    </div>
  </div>
</template>

<style scoped>
.base-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required-star {
  color: #ef4444;
}

.field-control :deep(input),
.field-control :deep(select),
.field-control :deep(textarea) {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  color: #f8fafc;
  font-family: inherit;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.field-control :deep(input:focus),
.field-control :deep(select:focus),
.field-control :deep(textarea:focus) {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

.has-error .field-control :deep(input),
.has-error .field-control :deep(select),
.has-error .field-control :deep(textarea) {
  border-color: #ef4444;
}

.field-error {
  font-size: 0.75rem;
  color: #ef4444;
  font-weight: 500;
}

.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
}
</style>
