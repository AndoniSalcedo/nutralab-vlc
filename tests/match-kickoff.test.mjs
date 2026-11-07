import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMatchKickoff, scheduleFromHour, normalizeKickoff } from '../lib/nutrition/match-kickoff.js';

test('la hora exacta del plan manda y fija el horario', () => {
  const cfg = { partidos: { sabado: { horario: 'tarde', hora: '12:30' } } };
  assert.deepEqual(resolveMatchKickoff(cfg, 'sabado'), { horario: 'manana', hora: '12:30', exacta: true });
});

test('sin hora exacta se usa la orientativa del horario', () => {
  assert.deepEqual(resolveMatchKickoff({ partidos: { domingo: { horario: 'noche' } } }, 'domingo'), { horario: 'noche', hora: '21:00', exacta: false });
  assert.deepEqual(resolveMatchKickoff(null, 'lunes'), { horario: 'tarde', hora: '18:30', exacta: false });
  assert.deepEqual(resolveMatchKickoff({ horario: 'manana' }, 'lunes'), { horario: 'manana', hora: '12:00', exacta: false });
});

test('una hora mal escrita se ignora', () => {
  assert.equal(normalizeKickoff('25:00'), null);
  assert.equal(normalizeKickoff('9:00'), null);
  assert.equal(resolveMatchKickoff({ partidos: { sabado: { horario: 'noche', hora: '' } } }, 'sabado').exacta, false);
});

test('horario a partir de la hora', () => {
  assert.equal(scheduleFromHour('14:59'), 'manana');
  assert.equal(scheduleFromHour('15:00'), 'tarde');
  assert.equal(scheduleFromHour('20:00'), 'noche');
});
