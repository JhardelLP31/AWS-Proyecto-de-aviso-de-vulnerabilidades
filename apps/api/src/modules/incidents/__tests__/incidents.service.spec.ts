import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import type { AccessProfile } from '../../rbac/types/identity.types';
import { GeofenceViolation, IncidentClosed, SelfVoteNotAllowed } from '../domain/errors';
import type { IIncidentEventsPublisher, IPhotoStorage } from '../domain/ports';
import { DEFAULT_VERACITY_POLICY } from '../domain/veracity';
import { MockIncidentRepository } from '../repositories/mock-incident.repository';
import { IncidentsService } from '../services/incidents.service';

const user = (id: string, permissions: string[] = ['incidents.vote'], reputation = 1): AccessProfile => ({
  userId: id,
  displayName: id,
  reputation,
  roles: [],
  permissions: new Set(permissions),
});

const HERE = { lat: -5.1945, lng: -80.6328 };

describe('IncidentsService', () => {
  let repo: MockIncidentRepository;
  let events: string[];
  let service: IncidentsService;

  beforeEach(() => {
    repo = new MockIncidentRepository();
    events = [];
    const publisher: IIncidentEventsPublisher = {
      incidentCreated: async () => void events.push('created'),
      incidentUpdated: async () => void events.push('updated'),
      voteRegistered: async () => void events.push('vote'),
      incidentVerified: async () => void events.push('verified'),
    };
    const storage: IPhotoStorage = { put: async () => undefined, publicUrl: (k) => k };
    service = new IncidentsService(repo, publisher, storage, DEFAULT_VERACITY_POLICY);
  });

  const report = () =>
    service.report(
      { type: 'RIVER_OVERFLOW', severity: 'RED', title: 'Desborde', description: 'Río Piura desbordado', ...HERE, photos: [] },
      user('reporter', ['incidents.create']),
    );

  test('reportar emite incident.created y nace PENDING', async () => {
    const i = await report();
    assert.equal(i.status, 'PENDING');
    assert.deepEqual(events, ['created']);
  });

  test('geocerca: votar a más de 500 m se rechaza', async () => {
    const i = await report();
    await assert.rejects(
      service.vote(i.id, { kind: 'CONFIRM', lat: HERE.lat + 0.01, lng: HERE.lng, accuracyM: 10 }, user('v1')),
      GeofenceViolation,
    );
  });

  test('GPS impreciso se rechaza', async () => {
    const i = await report();
    await assert.rejects(service.vote(i.id, { kind: 'CONFIRM', ...HERE, accuracyM: 900 }, user('v1')), GeofenceViolation);
  });

  test('nadie vota su propio reporte', async () => {
    const i = await report();
    await assert.rejects(service.vote(i.id, { kind: 'CONFIRM', ...HERE, accuracyM: 10 }, user('reporter')), SelfVoteNotAllowed);
  });

  test('votar dos veces reemplaza el voto', async () => {
    const i = await report();
    await service.vote(i.id, { kind: 'CONFIRM', ...HERE, accuracyM: 10 }, user('v1'));
    const after = await service.vote(i.id, { kind: 'DENY', ...HERE, accuracyM: 10 }, user('v1'));
    assert.equal(after.confirmCount, 0);
    assert.equal(after.denyCount, 1);
    assert.equal(after.veracityScore, -1.5);
  });

  test('cruzar el umbral escala a VERIFIED y alerta una sola vez', async () => {
    const i = await report();
    // 2 brigadistas (w=1 + bonus 4 c/u) = 10 ≥ 8
    await service.vote(i.id, { kind: 'CONFIRM', ...HERE, accuracyM: 10 }, user('b1', ['incidents.vote', 'incidents.vote.brigade']));
    const v = await service.vote(i.id, { kind: 'CONFIRM', ...HERE, accuracyM: 10 }, user('b2', ['incidents.vote', 'incidents.vote.brigade']));
    assert.equal(v.status, 'VERIFIED');
    await service.vote(i.id, { kind: 'CONFIRM', ...HERE, accuracyM: 10 }, user('v3'));
    assert.equal(events.filter((e) => e === 'verified').length, 1);
  });

  test('un incidente resuelto no acepta votos', async () => {
    const i = await report();
    await service.triage(i.id, { status: 'RESOLVED', expectedVersion: i.version });
    await assert.rejects(service.vote(i.id, { kind: 'CONFIRM', ...HERE, accuracyM: 10 }, user('v1')), IncidentClosed);
  });

  test('triaje con versión vieja falla (bloqueo optimista)', async () => {
    const i = await report();
    await service.triage(i.id, { severity: 'ORANGE', expectedVersion: i.version });
    await assert.rejects(service.triage(i.id, { severity: 'YELLOW', expectedVersion: i.version }), /modificado por otra persona/);
  });
});
