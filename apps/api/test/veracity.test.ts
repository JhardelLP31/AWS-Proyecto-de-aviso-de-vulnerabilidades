import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeVeracity, DEFAULT_VERACITY_POLICY as P, nextStatus, userWeight } from '../src/modules/incidents/domain/veracity';

const confirm = (weight = 1, isBrigade = false) => ({ kind: 'CONFIRM' as const, weight, isBrigade });
const deny = () => ({ kind: 'DENY' as const, weight: 1, isBrigade: false });

test('aplica la fórmula Σ(conf × w_u) − Σ(desm) × 1.5 + bonus', () => {
  const r = computeVeracity([confirm(1), confirm(2), deny(), confirm(1.5, true)], P);
  // 1 + 2 + 1.5 − 1.5 + 4 (un brigadista) = 7
  assert.equal(r.veracityScore, 7);
  assert.equal(r.confirmCount, 3);
  assert.equal(r.denyCount, 1);
});

test('el bonus de brigadista tiene tope', () => {
  const r = computeVeracity([confirm(1, true), confirm(1, true), confirm(1, true)], P);
  assert.equal(r.veracityScore, 3 + 2 * P.brigadeBonus);
});

test('w_u se acota a [min, max]', () => {
  assert.equal(userWeight(10, P), P.maxUserWeight);
  assert.equal(userWeight(-3, P), P.minUserWeight);
  assert.equal(userWeight(Number.NaN, P), P.minUserWeight);
});

test('transiciones de estado', () => {
  assert.equal(nextStatus('PENDING', P.verifyThreshold, P), 'VERIFIED');
  assert.equal(nextStatus('PENDING', P.dismissThreshold, P), 'DISMISSED');
  assert.equal(nextStatus('DISMISSED', P.verifyThreshold, P), 'VERIFIED');
  assert.equal(nextStatus('VERIFIED', -100, P), 'VERIFIED'); // un ataque de desmentidos no apaga una alerta
  assert.equal(nextStatus('RESOLVED', 100, P), 'RESOLVED');
});
