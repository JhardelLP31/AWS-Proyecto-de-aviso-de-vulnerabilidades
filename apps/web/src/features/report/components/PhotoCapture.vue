<script setup lang="ts">
import { useCameraWebp, type ProcessedWebpPhoto } from '../../../composables/useCameraWebp';

interface Props {
  photos: ProcessedWebpPhoto[];
  disabled?: boolean;
  maxPhotos?: number;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  maxPhotos: 3,
});

const emit = defineEmits<{
  (e: 'add', photo: ProcessedWebpPhoto): void;
  (e: 'remove', index: number): void;
  (e: 'error', message: string): void;
}>();

const { processImage, isProcessing } = useCameraWebp();

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  try {
    const processed = await processImage(file);
    emit('add', processed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error optimizando la imagen';
    emit('error', msg);
  } finally {
    input.value = '';
  }
}
</script>

<template>
  <div class="photo-capture-section">
    <div class="photo-header">
      <span class="photo-title">Evidencia Fotográfica</span>
      <span class="photo-badge">{{ photos.length }} / {{ maxPhotos }} fotos</span>
    </div>

    <div class="photo-grid">
      <!-- Miniaturas de fotos capturadas -->
      <div
        v-for="(photo, index) in photos"
        :key="index"
        class="photo-slot has-photo"
      >
        <img :src="photo.previewUrl" alt="Evidencia" class="photo-thumb" />
        <button
          type="button"
          class="remove-btn"
          title="Eliminar foto"
          :disabled="disabled"
          @click="$emit('remove', index)"
        >
          ×
        </button>
        <div class="photo-meta">
          <span>{{ Math.round(photo.sizeBytes / 1024) }} KB</span>
          <span class="webp-badge">WebP</span>
        </div>
      </div>

      <!-- Ranura para añadir fotos -->
      <label
        v-if="photos.length < maxPhotos"
        class="photo-slot add-photo-slot"
        :class="{ 'is-processing': isProcessing, 'is-disabled': disabled }"
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden-file-input"
          :disabled="disabled || isProcessing"
          @change="handleFileChange"
        />
        <span v-if="isProcessing" class="spinner" aria-hidden="true"></span>
        <template v-else>
          <span class="camera-icon">📷</span>
          <span class="add-text">Tomar Foto</span>
          <small class="compress-text">WebP &lt;150 KB</small>
        </template>
      </label>
    </div>
  </div>
</template>

<style scoped>
.photo-capture-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.photo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.photo-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #cbd5e1;
}

.photo-badge {
  font-size: 0.75rem;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.15rem 0.5rem;
  border-radius: 0.25rem;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.photo-slot {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #334155;
  background: #0f172a;
}

.photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  border: none;
  font-size: 1.1rem;
  line-height: 1;
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
  background: rgba(0, 0, 0, 0.75);
  padding: 0.2rem 0.35rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.6875rem;
  color: #e2e8f0;
}

.webp-badge {
  color: #38bdf8;
  font-weight: 700;
}

.add-photo-slot {
  cursor: pointer;
  transition: all 0.15s ease;
  color: #94a3b8;
  text-align: center;
  padding: 0.5rem;
}

.add-photo-slot:hover:not(.is-disabled) {
  border-color: #38bdf8;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.05);
}

.hidden-file-input {
  display: none;
}

.camera-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.add-text {
  font-size: 0.75rem;
  font-weight: 600;
}

.compress-text {
  font-size: 0.625rem;
  color: #64748b;
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid rgba(56, 189, 248, 0.3);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
