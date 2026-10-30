#!/usr/bin/env node
/**
 * Script para descargar y recortar el mapa base vectorial PMTiles de Piura
 * según la especificación de Tarea 02 (A4-F2 / A4-T02-2).
 *
 * BBox Piura: [-81.45, -6.40, -79.10, -4.05] (PIURA_BBOX de @geoalert/contracts)
 */

import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const targetDir = resolve(__dirname, '../public/tiles');
const targetFile = resolve(targetDir, 'piura.pmtiles');

if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

// BBox de Piura
const BBOX = '-81.45,-6.40,-79.10,-4.05';
const MAX_ZOOM = 14; // Balance óptimo entre nivel de detalle y tamaño (<50MB)
const BUILD_DATE = '20240901'; // Build Protomaps
const SOURCE_URL = `https://build.protomaps.com/${BUILD_DATE}.pmtiles`;

console.log('======================================================');
console.log('   GeoAlert / ResQMap — Extracción de PMTiles Piura   ');
console.log('======================================================');
console.log(`Destino: ${targetFile}`);
console.log(`BBox:    ${BBOX}`);
console.log(`MaxZoom: ${MAX_ZOOM}`);
console.log(`Origen:  ${SOURCE_URL}`);
console.log('------------------------------------------------------');

const command = `npx pmtiles extract ${SOURCE_URL} ${targetFile} --bbox=${BBOX} --maxzoom=${MAX_ZOOM}`;

console.log(`Ejecutando comando:\n> ${command}\n`);

try {
  execSync(command, { stdio: 'inherit' });
  console.log('\n✔ PMTiles de Piura generado con éxito en public/tiles/piura.pmtiles');
} catch (err) {
  console.warn('\n⚠️ Nota: Si npx pmtiles falla por conectividad o falta de binario nativo,');
  console.warn('puedes descargar directamente la versión pre-recortada o mantener VITE_BASEMAP=osm.');
  console.warn('Comando manual alternativo:');
  console.warn(`pmtiles extract ${SOURCE_URL} public/tiles/piura.pmtiles --bbox=${BBOX} --maxzoom=${MAX_ZOOM}`);
}
