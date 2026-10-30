<template>
  <div class="report-view-container">
    <div class="report-card glass-panel">
      <!-- Encabezado -->
      <div class="report-header">
        <router-link to="/" class="back-link">← Volver al Mapa</router-link>
        <h1 class="report-title">Reportar Peligro FEN</h1>
        <p class="report-subtitle">
          Alerta comunitaria para vecinos y despacho de Defensa Civil (INDECI / COER)
        </p>
      </div>

      <!-- Alerta de Error -->
      <div v-if="errorMessage" class="error-banner animate-fade-in">
        <span>⚠️ {{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="report-form">
        <!-- 1. Título y Tipo de Desastre -->
        <div class="form-group">
          <label class="form-label" for="incident-title">Título del Evento Crítico *</label>
          <input
            id="incident-title"
            v-model="title"
            type="text"
            required
            maxlength="150"
            placeholder="Ej. Desborde del Río Piura a la altura del Puente Cáceres"
            class="form-input"
            :disabled="isSubmitting"
          />
        </div>

        <div class="grid-2-cols">
          <div class="form-group">
            <label class="form-label" for="incident-type">Tipo de Evento FEN *</label>
            <select
              id="incident-type"
              v-model="incidentType"
              required
              class="form-select"
              :disabled="isSubmitting"
            >
              <option value="RIVER_OVERFLOW">🌊 Desborde de Río</option>
              <option value="BLIND_BASIN_COLLAPSE">🌧️ Cuenca Ciega Colapsada</option>
              <option value="DIKE_BREACH">💥 Rotura de Dique</option>
              <option value="ISOLATED_AREA">🏝️ Zona Aislada / Incomunicada</option>
              <option value="FLOODED_ROAD">🚗 Vía Inundada / Intransitable</option>
              <option value="LANDSLIDE">⛰️ Huaico / Deslizamiento</option>
              <option value="OTHER">⚠️ Otro Peligro</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="incident-severity">Nivel de Severidad *</label>
            <select
              id="incident-severity"
              v-model="severity"
              required
              class="form-select"
              :class="`border-${severity.toLowerCase()}`"
              :disabled="isSubmitting"
            >
              <option value="GREEN">🟢 Verde — Alerta Preventiva / Menor</option>
              <option value="YELLOW">🟡 Amarillo — Precaución / Moderado</option>
              <option value="ORANGE">🟠 Naranja — Grave / Anegamiento severo</option>
              <option value="RED">🔴 Rojo — Crítico / Riesgo inminente de vida</option>
            </select>
          </div>
        </div>

        <!-- 2. Distrito y Ubicación Geográfica -->
        <div class="grid-2-cols">
          <div class="form-group">
            <label class="form-label" for="incident-district">Distrito / Sector *</label>
            <select
              id="incident-district"
              v-model="district"
              required
              class="form-select"
              :disabled="isSubmitting"
            >
              <option value="Piura">Piura Centro</option>
              <option value="Castilla">Castilla</option>
              <option value="Veintiséis de Octubre">Veintiséis de Octubre</option>
              <option value="Catacaos">Catacaos</option>
              <option value="Cura Mori">Cura Mori</option>
              <option value="Tambogrande">Tambogrande</option>
              <option value="Chulucanas">Chulucanas</option>
              <option value="Sullana">Sullana</option>
              <option value="Paita">Paita</option>
              <option value="Talara">Talara</option>
            </select>
          </div>

          <!-- Coordenadas GPS -->
          <div class="form-group">
            <label class="form-label">Ubicación GPS (Lat, Lng) *</label>
            <div class="gps-input-group">
              <input
                type="text"
                readonly
                :value="coordsDisplay"
                class="form-input gps-display"
                placeholder="Presione Fijar GPS"
              />
              <button
                type="button"
                @click="captureGps"
                class="btn btn-ghost btn-gps"
                :disabled="isSubmitting"
                title="Tomar coordenadas exactas del GPS"
              >
                📍 GPS
              </button>
            </div>
            <small v-if="gpsAccuracy" class="gps-accuracy-hint">
              Precisión: ±{{ Math.round(gpsAccuracy) }} metros
            </small>
          </div>
        </div>

        <!-- 3. Descripción Detallada -->
        <div class="form-group">
          <label class="form-label" for="incident-description">Descripción de los Hechos *</label>
          <textarea
            id="incident-description"
            v-model="description"
            rows="3"
            required
            placeholder="Describa el nivel del agua, familias afectadas o infraestructura comprometida..."
            class="form-textarea"
            :disabled="isSubmitting"
          ></textarea>
        </div>

        <!-- 4. Pipeline de Fotos WebP (Hasta 3 fotos) -->
        <div class="form-group">
          <div class="photo-header">
            <label class="form-label">Evidencia Fotográfica (Hasta 3 fotos optimizadas WebP)</label>
            <span class="photo-badge">{{ photos.length }} / 3 fotos</span>
          </div>

          <!-- Galería de Fotos Previsualizadas -->
          <div class="photo-slots-grid">
            <div v-for="(photo, index) in photos" :key="index" class="photo-slot has-photo">
              <img :src="photo.previewUrl" alt="Evidencia" class="photo-thumb" />
              <button
                type="button"
                @click="removePhoto(index)"
                class="remove-photo-btn"
                title="Eliminar foto"
              >
                ✕
              </button>
              <div class="photo-meta">
                <span>{{ Math.round(photo.sizeBytes / 1024) }} KB</span>
                <span class="webp-tag">WebP</span>
              </div>
            </div>

            <!-- Botón para añadir foto -->
            <label
              v-if="photos.length < 3"
              class="photo-slot add-photo-slot"
              :class="{ 'is-processing': isProcessingPhoto }"
            >
              <input
                type="file"
                accept="image/*"
                capture="environment"
                class="hidden-file-input"
                :disabled="isProcessingPhoto || isSubmitting"
                @change="handlePhotoUpload"
              />
              <span v-if="isProcessingPhoto" class="spinner"></span>
              <template v-else>
                <span class="camera-icon">📷</span>
                <span class="add-text">Tomar Foto</span>
                <small class="compress-text">Compresión WebP &lt;150KB</small>
              </template>
            </label>
          </div>
        </div>

        <!-- Botón de Envío -->
        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary submit-report-btn"
            :disabled="isSubmitting || isProcessingPhoto || !coords"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            <span v-else>🚀 Publicar Reporte Comunitario</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { IncidentType, Severity, LatLng } from '@geoalert/contracts';
import { useCameraWebp, type ProcessedWebpPhoto } from '../../composables/useCameraWebp';
import { useLocationStore, PIURA_CENTER } from '../../stores/location.store';
import { useIncidentStore } from '../../stores/incident.store';

const router = useRouter();
const locationStore = useLocationStore();
const incidentStore = useIncidentStore();
const { processImage, isProcessing: isProcessingPhoto } = useCameraWebp();

const title = ref('');
const incidentType = ref<IncidentType>('BLIND_BASIN_COLLAPSE');
const severity = ref<Severity>('ORANGE');
const district = ref('Piura');
const description = ref('');
const coords = ref<LatLng | null>(null);
const gpsAccuracy = ref<number | null>(null);
const photos = ref<ProcessedWebpPhoto[]>([]);

const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const coordsDisplay = computed(() => {
  if (!coords.value) return '';
  return `${coords.value.lat.toFixed(5)}, ${coords.value.lng.toFixed(5)}`;
});

onMounted(() => {
  locationStore.startTracking();
  captureGps();
});

function captureGps() {
  if (locationStore.currentCoords) {
    coords.value = { ...locationStore.currentCoords };
    gpsAccuracy.value = locationStore.accuracyMeters;
  } else {
    // Fallback a coordenadas de Piura Centro
    coords.value = { ...PIURA_CENTER };
  }
}

async function handlePhotoUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  try {
    const processed = await processImage(file);
    photos.value.push(processed);
  } catch (err: any) {
    errorMessage.value = err.message || 'Error optimizando la imagen';
  } finally {
    input.value = '';
  }
}

function removePhoto(index: number) {
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

    // Añadir hasta 3 fotos WebP <150KB
    photos.value.forEach((photo) => {
      formData.append('photos', photo.file);
    });

    await incidentStore.createIncident(formData);
    router.push('/');
  } catch (err: any) {
    errorMessage.value = err.message || 'Error al enviar reporte';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.report-view-container {
  width: 100%;
  height: 100%;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  justify-content: center;
}

.report-card {
  width: 100%;
  max-width: 680px;
  padding: 2rem;
  margin-bottom: 2rem;
  height: fit-content;
}

.report-header {
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-block;
  font-size: 0.825rem;
  color: #38bdf8;
  text-decoration: none;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

.report-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main);
}

.report-subtitle {
  font-size: 0.85rem;
  color: var(--text-dim);
  margin-top: 0.25rem;
}

.grid-2-cols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .grid-2-cols {
    grid-template-columns: 1fr;
  }
}

.gps-input-group {
  display: flex;
  gap: 0.5rem;
}

.gps-display {
  font-family: monospace;
  font-size: 0.85rem;
}

.btn-gps {
  padding: 0.6rem 0.9rem;
}

.gps-accuracy-hint {
  font-size: 0.7rem;
  color: var(--sev-green);
  margin-top: 0.25rem;
}

.photo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.photo-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #38bdf8;
}

.photo-slots-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
}

.photo-slot {
  height: 120px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-subtle);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.add-photo-slot {
  cursor: pointer;
  transition: all var(--trans-fast);
}

.add-photo-slot:hover {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.05);
}

.hidden-file-input {
  display: none;
}

.camera-icon {
  font-size: 1.75rem;
}

.add-text {
  font-size: 0.775rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.compress-text {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  background: rgba(0, 0, 0, 0.75);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-meta {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  font-weight: 700;
}

.webp-tag {
  color: #34d399;
}

.form-actions {
  margin-top: 1.75rem;
}

.submit-report-btn {
  width: 100%;
  padding: 0.85rem;
  font-size: 0.95rem;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
