import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toDateKey, shiftDateKey, mondayKeyOf } from '../lib/dates.js';

test('toDateKey usa el día de Madrid, no el de UTC', () => {
  // 23:30 UTC del 13 de octubre = 01:30 del 14 en Madrid (CEST)
  assert.equal(toDateKey(new Date('2026-10-13T23:30:00Z')), '2026-10-14');
  // Invierno (CET, UTC+1): 23:30 UTC del 10 de enero = 00:30 del 11
  assert.equal(toDateKey(new Date('2026-01-10T23:30:00Z')), '2026-01-11');
});

test('shiftDateKey cruza meses, años y cambios de hora', () => {
  assert.equal(shiftDateKey('2026-10-31', 1), '2026-11-01');
  assert.equal(shiftDateKey('2026-01-01', -1), '2025-12-31');
  assert.equal(shiftDateKey('2026-03-29', 1), '2026-03-30'); // cambio de hora de primavera
});

test('mondayKeyOf: la semana empieza en lunes y el domingo es del lunes anterior', () => {
  assert.equal(mondayKeyOf('2026-10-12'), '2026-10-12'); // lunes
  assert.equal(mondayKeyOf('2026-10-14'), '2026-10-12'); // miércoles
  assert.equal(mondayKeyOf('2026-10-18'), '2026-10-12'); // domingo
  assert.equal(mondayKeyOf('2026-11-01'), '2026-10-26'); // domingo tras cambio de hora
});
