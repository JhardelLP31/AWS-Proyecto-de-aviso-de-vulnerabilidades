import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { fromSinpadRow, type HistoricalEvent, type SinpadRow } from '../domain/historical-event';
import { districtRanking, forecast, heatmap } from '../domain/risk-model';

const row = (over: Partial<SinpadRow> = {}): SinpadRow => ({
  ID_EMERGENCIA: 'SINPAD-PIU-00001',
  DISTRITO: 'CURA MORI',
  FECHA_EVENTO: '2017-03-14',
  TIPO_PELIGRO: 'DESBORDE DE RIO',
  PRECIPITACION_MM: '97.7',
  VULNERABILIDAD_SUELO: '0.9',
  NIVEL_SEVERIDAD: 'CRITICA',
  TOTAL_DAMNIFICADOS: '100',
  TOTAL_AFECTADOS: '300',
  VIVIENDAS_COLAPSADAS: '10',
  lat: '-5.32',
  lng: '-80.66',
  ...over,
});

const ev = (over: Partial<HistoricalEvent>): HistoricalEvent => ({ ...fromSinpadRow(row())!, ...over });

describe('fromSinpadRow', () => {
  test('normaliza severidad, distrito y números', () => {
    const e = fromSinpadRow(row())!;
    assert.equal(e.severity, 'RED');
    assert.equal(e.district, 'Cura Mori');
    assert.equal(e.precipitationMm, 97.7);
  });

  for (const [caso, over] of [
    ['severidad desconocida', { NIVEL_SEVERIDAD: 'EXTREMA' }],
    ['coordenadas inválidas', { lat: 'x' }],
    ['fecha inválida', { FECHA_EVENTO: '14/03/2017' }],
  ] as const) {
    test(`descarta la fila con ${caso}`, () => assert.equal(fromSinpadRow(row(over)), null));
  }
});

describe('heatmap', () => {
  test('agrupa por celda, normaliza a la celda más alta y respeta el bbox', () => {
    const cells = heatmap([
      ev({ lat: -5.201, lng: -80.601, severity: 'RED' }),
      ev({ lat: -5.202, lng: -80.602, severity: 'RED' }),
      ev({ lat: -5.5, lng: -80.9, severity: 'GREEN' }),
    ]);
    assert.equal(cells.length, 2);
    assert.deepEqual([cells[0].weight, cells[0].events], [1, 2]);
    assert.equal(cells[1].weight, 0.125);
    assert.equal(heatmap([ev({ lat: -5.5, lng: -80.9 })], [-80.7, -5.3, -80.5, -5.1]).length, 0);
  });
});

describe('districtRanking', () => {
  test('ordena por puntuación y cuenta tipos de peligro', () => {
    const ranking = districtRanking([
      ev({ district: 'Catacaos', severity: 'RED', damnificados: 500 }),
      ev({ district: 'Catacaos', severity: 'RED', hazard: 'INUNDACION PLUVIAL', damnificados: 500 }),
      ev({ district: 'Paita', severity: 'GREEN', damnificados: 0, soilVulnerability: 0.6 }),
    ]);
    assert.equal(ranking[0].district, 'Catacaos');
    assert.equal(ranking[0].criticalShare, 1);
    assert.deepEqual(ranking[0].byHazard, { 'DESBORDE DE RIO': 1, 'INUNDACION PLUVIAL': 1 });
    assert.ok(ranking[0].riskScore > ranking[1].riskScore);
  });
});

describe('forecast', () => {
  const history = [
    ...Array.from({ length: 12 }, () => ev({ district: 'Piura', precipitationMm: 90, severity: 'RED' })),
    ...Array.from({ length: 12 }, () => ev({ district: 'Piura', precipitationMm: 15, severity: 'GREEN' })),
  ];

  for (const [mm, esperada] of [
    [95, 'RED'],
    [10, 'GREEN'],
  ] as const) {
    test(`${mm} mm → ${esperada}`, () => {
      const [piura] = forecast(history, mm).districts;
      assert.equal(piura.expectedSeverity, esperada);
      assert.equal(piura.sampleSize, 12);
    });
  }

  test('amplía la ventana cuando hay pocos eventos parecidos', () => {
    const r = forecast(history, 50);
    assert.equal(r.windowMm, 40);
    assert.equal(r.districts[0].sampleSize, 24);
  });

  test('en empate elige la severidad más grave', () => {
    const r = forecast(
      [...Array.from({ length: 5 }, () => ev({ precipitationMm: 50, severity: 'YELLOW' })), ...Array.from({ length: 5 }, () => ev({ precipitationMm: 50, severity: 'ORANGE' }))],
      50,
    );
    assert.equal(r.districts[0].expectedSeverity, 'ORANGE');
  });

  test('lluvia fuera de lo registrado usa los eventos más cercanos y lo marca como extrapolado', () => {
    const [d] = forecast(history, 300).districts;
    assert.deepEqual([d.expectedSeverity, d.sampleSize, d.extrapolated], ['RED', 10, true]);
    assert.equal(forecast(history, 90).districts[0].extrapolated, false);
  });
});
