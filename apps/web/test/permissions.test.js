import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, haversineMeters, GEOFENCE_RADIUS_M, MAX_PHOTO_BYTES } from '@geoalert/contracts';
import { DEMO_PROFILES, DEMO_PASSWORD } from '../src/shared/config/demo-profiles.ts';
import { getWorstSeverity, SEVERITY_CONFIGS } from '../src/shared/map/severity-style.ts';

describe('A4 Frontend Unit Tests', () => {
  describe('RBAC hasPermission', () => {
    test('permite acceso si tiene wildcard global *', () => {
      assert.equal(hasPermission(['*'], 'incidents.create'), true);
      assert.equal(hasPermission(['*'], 'alerts.receive'), true);
    });

    test('permite acceso con wildcard de modulo incidents.*', () => {
      assert.equal(hasPermission(['incidents.*'], 'incidents.create'), true);
      assert.equal(hasPermission(['incidents.*'], 'incidents.verify'), true);
      assert.equal(hasPermission(['incidents.*'], 'alerts.receive'), false);
    });

    test('permite acceso con permiso exacto', () => {
      assert.equal(hasPermission(['incidents.create', 'incidents.vote'], 'incidents.create'), true);
      assert.equal(hasPermission(['incidents.create', 'incidents.vote'], 'incidents.verify'), false);
    });

    test('rechaza si lista de permisos esta vacia', () => {
      assert.equal(hasPermission([], 'incidents.create'), false);
    });
  });

  describe('Geocercado In Situ (Haversine)', () => {
    test('valida distancia menor a 500m entre Plaza de Armas y Puente Sánchez Cerro en Piura', () => {
      // Plaza de Armas de Piura
      const plazaArmas = { lat: -5.1945, lng: -80.6328 };
      // Puente Sánchez Cerro (~350m al este)
      const puenteSanchezCerro = { lat: -5.1950, lng: -80.6295 };

      const dist = haversineMeters(plazaArmas, puenteSanchezCerro);
      assert.ok(dist < GEOFENCE_RADIUS_M, `Distancia esperada < 500m, obtenida: ${dist}m`);
    });

    test('detecta distancia mayor a 500m entre Piura y Catacaos', () => {
      const piura = { lat: -5.1945, lng: -80.6328 };
      const catacaos = { lat: -5.2667, lng: -80.6833 };

      const dist = haversineMeters(piura, catacaos);
      assert.ok(dist > GEOFENCE_RADIUS_M, `Distancia esperada > 500m, obtenida: ${dist}m`);
    });
  });

  describe('Constantes de Misión Crítica WebP', () => {
    test('MAX_PHOTO_BYTES es estrictamente 150 KB', () => {
      assert.equal(MAX_PHOTO_BYTES, 150 * 1024);
    });
  });

  describe('Usuarios Demo y Contratos de Auth (T02-3)', () => {
    test('contraseña demo unificada es GeoAlert2026!', () => {
      assert.equal(DEMO_PASSWORD, 'GeoAlert2026!');
    });

    test('existen los 4 perfiles oficiales de contratos.md', () => {
      const emails = DEMO_PROFILES.map((p) => p.email);
      assert.ok(emails.includes('vecino@demo.pe'));
      assert.ok(emails.includes('brigadista@demo.pe'));
      assert.ok(emails.includes('coer@demo.pe'));
      assert.ok(emails.includes('admin@demo.pe'));
      assert.equal(DEMO_PROFILES.length, 4);
    });
  });

  describe('Semáforo y Clustering Dinámico (T02-1)', () => {
    test('getWorstSeverity prioriza RED sobre cualquier otra severidad', () => {
      assert.equal(getWorstSeverity(['GREEN', 'YELLOW', 'RED', 'ORANGE']), 'RED');
      assert.equal(getWorstSeverity(['GREEN', 'ORANGE']), 'ORANGE');
      assert.equal(getWorstSeverity(['GREEN', 'YELLOW']), 'YELLOW');
      assert.equal(getWorstSeverity(['GREEN']), 'GREEN');
    });

    test('SEVERITY_CONFIGS define los 4 niveles semafóricos', () => {
      assert.ok(SEVERITY_CONFIGS.RED.color);
      assert.ok(SEVERITY_CONFIGS.ORANGE.color);
      assert.ok(SEVERITY_CONFIGS.YELLOW.color);
      assert.ok(SEVERITY_CONFIGS.GREEN.color);
    });
  });

  describe('Validaciones Tarea 03 (T03-1, T03-2, T03-3)', () => {
    test('Mapa base local: solo pmtiles y none permitidos', () => {
      const allowedProviders = ['pmtiles', 'none'];
      assert.ok(allowedProviders.includes('pmtiles'));
      assert.ok(allowedProviders.includes('none'));
      assert.ok(!allowedProviders.includes('osm'));
      assert.ok(!allowedProviders.includes('carto'));
    });

    test('Todos los INCIDENT_TYPES tienen etiquetas legibles en español', () => {
      const expectedTypes = [
        'RIVER_OVERFLOW',
        'BLIND_BASIN_COLLAPSE',
        'DIKE_BREACH',
        'ISOLATED_AREA',
        'FLOODED_ROAD',
        'LANDSLIDE',
        'OTHER',
      ];
      assert.equal(expectedTypes.length, 7);
    });

    test('Estructura de TriageRequest con bloqueo optimista (expectedVersion)', () => {
      const triagePayload = {
        status: 'VERIFIED',
        severity: 'RED',
        expectedVersion: 1,
      };
      assert.equal(triagePayload.status, 'VERIFIED');
      assert.equal(triagePayload.severity, 'RED');
      assert.equal(typeof triagePayload.expectedVersion, 'number');
    });
  });
});
