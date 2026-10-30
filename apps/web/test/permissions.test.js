import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, haversineMeters, GEOFENCE_RADIUS_M, MAX_PHOTO_BYTES } from '@geoalert/contracts';

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
});
