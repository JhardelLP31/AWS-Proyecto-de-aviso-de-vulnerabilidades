<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { IncidentType, Severity, LatLng } from '@geoalert/contracts';
import { useLocationStore, PIURA_CENTER } from '../../stores/location.store';
import { useIncidentStore } from '../../stores/incident.store';
import type { ProcessedWebpPhoto } from '../../composables/useCameraWebp';
import { useToast } from '../../shared/ui/useToast';
import BaseField from '../../shared/ui/BaseField.vue';
import BaseSelect from '../../shared/ui/BaseSelect.vue';
import BaseButton from '../../shared/ui/BaseButton.vue';
import StatusBanner from '../../shared/ui/StatusBanner.vue';
import IncidentTypeSelect from './components/IncidentTypeSelect.vue';
import SeveritySelect from './components/SeveritySelect.vue';
import PhotoCapture from './components/PhotoCapture.vue';
import LocationPicker from './components/LocationPicker.vue';

const router = useRouter();
const locationStore = useLocationStore();
const incidentStore = useIncidentStore();
const toast = useToast();

const title = ref('');
const incidentType = ref<IncidentType>('BLIND_BASIN_COLLAPSE');
const severity = ref<Severity>('ORANGE');
const district = ref('Piura');
const description = ref('');
const coords = ref<LatLng | null>(null);
const photos = ref<ProcessedWebpPhoto[]>([]);

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const districtOptions = [
  { value: 'Piura', label: 'Piura Centro' },
  { value: 'Castilla', label: 'Castilla' },
  { value: 'Veintiséis de Octubre', label: 'Veintiséis de Octubre' },
  { value: 'Catacaos', label: 'Catacaos' },
  { value: 'Cura Mori', label: 'Cura Mori' },
  { value: 'Tambogrande', label: 'Tambogrande' },
  { value: 'Chulucanas', label: 'Chulucanas' },
  { value: 'Sullana', label: 'Sullana' },
  { value: 'Paita', label: 'Paita' },
  { value: 'Talara', label: 'Talara' },
];

onMounted(() => {
  locationStore.startTracking();
  captureGps();
});

function captureGps() {
  if (locationStore.currentCoords) {
    coords.value = { ...locationStore.currentCoords };
  } else {
    coords.value = { ...PIURA_CENTER };
  }
}

function handleAddPhoto(photo: ProcessedWebpPhoto) {
  photos.value.push(photo);
}

function handleRemovePhoto(index: number) {
  const removed = photos.value.splice(index, 1);
  if (removed[0]) {
    URL.revokeObjectURL(removed[0].previewUrl);
  }
}

async function handleSubmit() {
  if (!coords.value) {
    errorMessage.value = 'Debe indicar coordenadas GPS válidas';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    const formData = new FormData();
    formData.append('title', title.value);
    formData.append('type', incidentType.value);
    formData.append('severity', severity.value);
    formData.append('district', district.value);
    formData.append('description', description.value);
    formData.append('lat', String(coords.value.lat));
    formData.append('lng', String(coords.value.lng));
    formData.append('occurredAt', new Date().toISOString());

    photos.value.forEach((photo) => {
      formData.append('photos', photo.file);
    });

    await incidentStore.createIncident(formData);
    toast.success('Reporte de peligro publicado exitosamente', 'Alerta FEN');
    router.push('/');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al enviar reporte';
    errorMessage.value = msg;
    toast.error(msg, 'Error al reportar');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="report-view-container">
    <div class="report-card glass-panel">
      <header class="report-header">
        <router-link to="/" class="back-link">← Volver al Mapa</router-link>
        <h1 class="report-title">Reportar Peligro FEN</h1>
        <p class="report-subtitle">
          Alerta comunitaria para vecinos y despacho de Defensa Civil (INDECI / COER)
        </p>
      </header>

      <StatusBanner
        v-if="errorMessage"
        type="danger"
        :message="errorMessage"
        dismissible
        @dismiss="errorMessage = null"
      />

      <form class="report-form" @submit.prevent="handleSubmit">
        <BaseField id="incident-title" label="Título del Evento Crítico" required>
          <input
            id="incident-title"
            v-model="title"
            type="text"
            required
            maxlength="150"
            placeholder="Ej. Desborde del Río Piura en Puente Cáceres"
            :disabled="isSubmitting"
          />
        </BaseField>

        <div class="form-row">
          <BaseField id="incident-type" label="Tipo de Evento FEN" required>
            <IncidentTypeSelect v-model="incidentType" :disabled="isSubmitting" />
          </BaseField>

          <BaseField id="incident-severity" label="Nivel de Severidad" required>
            <SeveritySelect v-model="severity" :disabled="isSubmitting" />
          </BaseField>
        </div>

        <div class="form-row">
          <BaseField id="incident-district" label="Distrito / Sector" required>
            <BaseSelect
              id="incident-district"
              v-model="district"
              :options="districtOptions"
              :disabled="isSubmitting"
            />
          </BaseField>

          <BaseField label="Ubicación GPS" required>
            <LocationPicker
              v-model="coords"
              :accuracy-meters="locationStore.accuracyMeters"
              :disabled="isSubmitting"
              @locate="captureGps"
            />
          </BaseField>
        </div>

        <BaseField id="incident-description" label="Descripción de los Hechos" required>
          <textarea
            id="incident-description"
            v-model="description"
            rows="3"
            required
            placeholder="Describa el nivel del agua, familias afectadas o infraestructura comprometida..."
            :disabled="isSubmitting"
          ></textarea>
        </BaseField>

        <PhotoCapture
          :photos="photos"
          :disabled="isSubmitting"
          @add="handleAddPhoto"
          @remove="handleRemovePhoto"
          @error="(err) => toast.error(err, 'Error de Imagen')"
        />

        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          :loading="isSubmitting"
          :disabled="!coords"
          style="width: 100%;"
        >
          🚀 Publicar Reporte Comunitario
        </BaseButton>
      </form>
    </div>
  </div>
</template>

<style scoped>
.report-view-container {
  min-height: 100vh;
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  background: radial-gradient(circle at 50% 20%, #0d1a2d 0%, #060b14 100%);
  overflow-y: auto;
}
.report-card {
  width: 100%;
  max-width: 44rem;
  padding: 2rem;
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  margin-bottom: 2rem;
}
.report-header { margin-bottom: 1.5rem; }
.back-link {
  display: inline-block;
  margin-bottom: 0.75rem;
  color: #38bdf8;
  font-size: 0.8125rem;
  text-decoration: none;
  font-weight: 600;
}
.back-link:hover { text-decoration: underline; }
.report-title { font-size: 1.5rem; font-weight: 700; color: #f8fafc; margin: 0 0 0.25rem; }
.report-subtitle { font-size: 0.875rem; color: #94a3b8; margin: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
@media (max-width: 640px) { .form-row { grid-template-columns: 1fr; gap: 0; } }
</style>
