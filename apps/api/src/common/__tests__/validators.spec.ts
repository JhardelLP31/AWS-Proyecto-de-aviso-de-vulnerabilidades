import 'reflect-metadata';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { BoundsQueryDto } from '../../modules/incidents/dto/bounds-query.dto';
import { CreateIncidentDto } from '../../modules/incidents/dto/create-incident.dto';
import { TriageDto } from '../../modules/incidents/dto/triage.dto';
import { RegisterDto } from '../../modules/auth/dto/register.dto';

const errors = <T extends object>(cls: new () => T, plain: object) =>
  validateSync(plainToInstance(cls, plain) as object, { whitelist: true, forbidNonWhitelisted: true }).map((e) => e.property);

const incident = { type: 'RIVER_OVERFLOW', severity: 'RED', title: 'Desborde', description: 'El río se desbordó en Castilla', lat: '-5.19', lng: '-80.62' };

describe('validación de DTOs', () => {
  test('incidente válido en Piura (números como string del multipart)', () => {
    assert.deepEqual(errors(CreateIncidentDto, incident), []);
  });

  test('@IsInsidePiura rechaza Lima', () => {
    assert.deepEqual(errors(CreateIncidentDto, { ...incident, lat: '-12.04', lng: '-77.03' }), ['lng']);
  });

  test('campos extra se rechazan (forbidNonWhitelisted)', () => {
    assert.ok(errors(CreateIncidentDto, { ...incident, status: 'VERIFIED' }).includes('status'));
  });

  test('@IsBBox acepta un bbox ordenado y rechaza uno invertido', () => {
    assert.deepEqual(errors(BoundsQueryDto, { bbox: '-80.7,-5.3,-80.6,-5.15' }), []);
    assert.deepEqual(errors(BoundsQueryDto, { bbox: '-80.6,-5.15,-80.7,-5.3' }), ['bbox']);
    assert.deepEqual(errors(BoundsQueryDto, { bbox: '1,2,3' }), ['bbox']);
  });

  test('triage exige severity o status', () => {
    assert.deepEqual(errors(TriageDto, { expectedVersion: 0 }), ['status']);
    assert.deepEqual(errors(TriageDto, { expectedVersion: 0, severity: 'RED' }), []);
  });

  test('registro exige contraseña fuerte y celular peruano', () => {
    const base = { email: 'a@b.pe', password: 'Piura2026seguro', displayName: 'Ana' };
    assert.deepEqual(errors(RegisterDto, base), []);
    assert.deepEqual(errors(RegisterDto, { ...base, password: 'corta' }), ['password']);
    assert.deepEqual(errors(RegisterDto, { ...base, phone: '12345' }), ['phone']);
    assert.deepEqual(errors(RegisterDto, { ...base, phone: '+51987654321' }), []);
  });
});
