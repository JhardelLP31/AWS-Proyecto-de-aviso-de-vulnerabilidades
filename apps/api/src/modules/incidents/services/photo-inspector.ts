import { createHash } from 'node:crypto';
import { InvalidPhoto } from '../domain/errors';

export interface InspectedPhoto {
  mimeType: 'image/webp' | 'image/jpeg';
  width: number;
  height: number;
  bytes: number;
  sha256: string;
}

/** Tolerancia sobre los 150 KB objetivo del cliente; nada legítimo debería acercarse. */
export const SERVER_MAX_PHOTO_BYTES = 200 * 1024;
const MAX_DIMENSION = 1280;

/**
 * Valida por bytes mágicos (nunca por el Content-Type que declara el cliente) y lee
 * dimensiones de la cabecera sin decodificar la imagen: costo O(1), apto para Lambda.
 */
export function inspectPhoto(buf: Buffer): InspectedPhoto {
  if (buf.length === 0 || buf.length > SERVER_MAX_PHOTO_BYTES) {
    throw new InvalidPhoto(`La foto debe pesar entre 1 B y ${SERVER_MAX_PHOTO_BYTES / 1024} KB`, { bytes: buf.length });
  }
  const dims = readWebpSize(buf) ?? readJpegSize(buf);
  if (!dims) throw new InvalidPhoto('Formato no soportado: se espera WebP (o JPEG como respaldo)');
  if (dims.width > MAX_DIMENSION || dims.height > MAX_DIMENSION) {
    throw new InvalidPhoto(`La foto excede ${MAX_DIMENSION}px`, dims);
  }
  return {
    ...dims,
    bytes: buf.length,
    sha256: createHash('sha256').update(buf).digest('hex'),
  };
}

function readWebpSize(b: Buffer): Omit<InspectedPhoto, 'bytes' | 'sha256'> | null {
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = b.toString('ascii', 12, 16);
  let width: number;
  let height: number;
  if (chunk === 'VP8X') {
    width = 1 + b.readUIntLE(24, 3);
    height = 1 + b.readUIntLE(27, 3);
  } else if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21);
    width = 1 + (bits & 0x3fff);
    height = 1 + ((bits >> 14) & 0x3fff);
  } else if (chunk === 'VP8 ') {
    width = b.readUInt16LE(26) & 0x3fff;
    height = b.readUInt16LE(28) & 0x3fff;
  } else {
    return null;
  }
  return { mimeType: 'image/webp', width, height };
}

function readJpegSize(b: Buffer): Omit<InspectedPhoto, 'bytes' | 'sha256'> | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    const length = b.readUInt16BE(i + 2);
    // SOF0..SOF15 excepto DHT(C4), JPG(C8), DAC(CC)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { mimeType: 'image/jpeg', height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  return null;
}
