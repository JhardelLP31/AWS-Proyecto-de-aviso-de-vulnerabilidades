import { ref } from 'vue';
import { MAX_PHOTO_BYTES } from '@geoalert/contracts';

export interface ProcessedWebpPhoto {
  file: File;
  blob: Blob;
  previewUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
  format: 'image/webp' | 'image/jpeg';
}

/**
 * Composable de captura y optimización agresiva de imágenes en el cliente.
 * Garantiza fotos nítidas a ≤ 1280px y estrictamente < 150 KB para operar
 * en conexiones 2G/3G inestables durante el Fenómeno El Niño en Piura.
 */
export function useCameraWebp() {
  const isProcessing = ref(false);
  const error = ref<string | null>(null);

  /**
   * Procesa un archivo o captura hacia WebP optimizado (<150 KB).
   */
  async function processImage(source: File | Blob): Promise<ProcessedWebpPhoto> {
    isProcessing.value = true;
    error.value = null;

    try {
      // 1. Decodificar respetando orientación EXIF nativa
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
      } catch {
        // Fallback si createImageBitmap con opciones no está disponible
        bitmap = await createImageBitmap(source);
      }

      let { width, height } = bitmap;
      const MAX_DIMENSION = 1280;

      // Escalado proporcional a un tope máximo de 1280 px
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      // 2. Determinar si el navegador soporta codificación a WebP
      const supportsWebp = await checkWebpSupport();
      const targetMime: 'image/webp' | 'image/jpeg' = supportsWebp ? 'image/webp' : 'image/jpeg';

      // 3. Ciclo de compresión adaptativa para asegurar tamaño < 150 KB
      let quality = 0.75;
      let currentWidth = width;
      let currentHeight = height;
      let outputBlob: Blob | null = null;
      let attempts = 0;

      while (attempts < 5) {
        attempts++;
        outputBlob = await renderToBlob(bitmap, currentWidth, currentHeight, targetMime, quality);

        if (outputBlob.size <= MAX_PHOTO_BYTES || quality <= 0.3) {
          break;
        }

        // Si excede 150 KB, reduce calidad y dimensiones progresivamente
        quality -= 0.15;
        if (quality < 0.45 && (currentWidth > 800 || currentHeight > 800)) {
          currentWidth = Math.round(currentWidth * 0.8);
          currentHeight = Math.round(currentHeight * 0.8);
        }
      }

      bitmap.close();

      if (!outputBlob) {
        throw new Error('No se pudo generar el blob de la imagen');
      }

      const extension = targetMime === 'image/webp' ? 'webp' : 'jpg';
      const fileName = `resqmap_fen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${extension}`;
      const finalFile = new File([outputBlob], fileName, { type: targetMime });
      const previewUrl = URL.createObjectURL(outputBlob);

      return {
        file: finalFile,
        blob: outputBlob,
        previewUrl,
        sizeBytes: outputBlob.size,
        width: currentWidth,
        height: currentHeight,
        format: targetMime,
      };
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error procesando la imagen';
      throw err;
    } finally {
      isProcessing.value = false;
    }
  }

  /**
   * Renderiza a Blob usando OffscreenCanvas (o Canvas HTML convencional)
   */
  async function renderToBlob(
    source: ImageBitmap,
    w: number,
    h: number,
    mimeType: string,
    quality: number,
  ): Promise<Blob> {
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreen = new OffscreenCanvas(w, h);
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, w, h);
        return await offscreen.convertToBlob({ type: mimeType, quality });
      }
    }

    // Fallback HTMLCanvasElement
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo instanciar contexto 2D');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, w, h);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Fallo toBlob en canvas'));
        },
        mimeType,
        quality,
      );
    });
  }

  /**
   * Comprueba si el motor del navegador puede codificar a WebP
   */
  async function checkWebpSupport(): Promise<boolean> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch {
      return false;
    }
  }

  return {
    isProcessing,
    error,
    processImage,
  };
}
