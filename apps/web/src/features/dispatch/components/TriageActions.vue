<script setup lang="ts">
import type { IncidentDTO, IncidentStatus, Severity } from '@geoalert/contracts';
import BaseButton from '../../../shared/ui/BaseButton.vue';

interface Props {
  incident: IncidentDTO;
  isProcessing?: boolean;
}

withDefaults(defineProps<Props>(), {
  isProcessing: false,
});

defineEmits<{
  (e: 'triage', payload: { status?: IncidentStatus; severity?: Severity }): void;
}>();
</script>

<template>
  <div class="triage-actions">
    <!-- Botón Despachar (Deshabilitado: Próximamente según T03-3) -->
    <BaseButton
      variant="secondary"
      size="sm"
      disabled
      title="El despacho de brigadas se habilitará en Fase 3"
    >
      🚀 Próximamente
    </BaseButton>

    <!-- Transiciones de Triaje Humano -->
    <BaseButton
      v-if="incident.status === 'PENDING'"
      variant="primary"
      size="sm"
      :loading="isProcessing"
      title="Validar oficialmente este reporte tras confirmación"
      @click="$emit('triage', { status: 'VERIFIED' })"
    >
      ✔ Validar
    </BaseButton>

    <BaseButton
      v-if="incident.status !== 'RESOLVED'"
      variant="ghost"
      size="sm"
      :loading="isProcessing"
      title="Marcar emergencia como resuelta o atendida"
      @click="$emit('triage', { status: 'RESOLVED' })"
    >
      🏁 Resolver
    </BaseButton>

    <BaseButton
      v-if="incident.status !== 'DISMISSED'"
      variant="ghost"
      size="sm"
      :loading="isProcessing"
      title="Descartar reporte por falsedad o duplicidad"
      @click="$emit('triage', { status: 'DISMISSED' })"
    >
      ✕ Descartar
    </BaseButton>
  </div>
</template>

<style scoped>
.triage-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: nowrap;
}
</style>
