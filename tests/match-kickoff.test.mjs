import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMatchKickoff, scheduleFromHour, normalizeKickoff, collectTeamMatchDays, weekdayKey } from '../lib/nutrition/match-kickoff.js';

test('el horario sale del plan y la hora exacta del equipo', () => {
  const cfg = { partidos: { sabado: { horario: 'tarde' } } };
  assert.deepEqual(resolveMatchKickoff(cfg, 'sabado', '17:00'), { horario: 'tarde', hora: '17:00', exacta: true });
  assert.deepEqual(resolveMatchKickoff(cfg, 'sabado'), { horario: 'tarde', hora: '18:30', exacta: false });
  assert.deepEqual(resolveMatchKickoff(null, 'lunes'), { horario: 'tarde', hora: '18:30', exacta: false });
  assert.deepEqual(resolveMatchKickoff({ horario: 'noche' }, 'lunes', '25:00'), { horario: 'noche', hora: '21:00', exacta: false });
});

test('normalizeKickoff y scheduleFromHour', () => {
  assert.equal(normalizeKickoff('9:00'), null);
  assert.equal(normalizeKickoff(' 09:00 '), '09:00');
  assert.equal(scheduleFromHour('14:59'), 'manana');
  assert.equal(scheduleFromHour('15:00'), 'tarde');
  assert.equal(scheduleFromHour('20:00'), 'noche');
});

test('weekdayKey', () => {
  assert.equal(weekdayKey('2026-11-07'), 'sabado');
  assert.equal(weekdayKey('2026-11-09'), 'lunes');
});

test('collectTeamMatchDays: solo fechas y jugadores con partido en su plan', () => {
  const players = [
    { id: 1, nombre: 'Ana', apellidos: 'Gil', plan: { dias: { sabado: { tipoDia: 'partido' } }, meta: { preMatchConfig: { partidos: { sabado: { horario: 'manana' } } } } } },
    { id: 2, nombre: 'Leo', plan: { dias: { sabado: { tipoDia: 'partido' }, domingo: { tipoDia: 'partido' } } } },
    { id: 3, nombre: 'Sin', plan: { dias: { sabado: { tipoDia: 'descanso' } } } },
    { id: 4, nombre: 'Nadie', plan: null },
  ];
  const days = collectTeamMatchDays(['2026-11-06', '2026-11-07', '2026-11-08'], players, [{ fecha: '2026-11-07', hora: '12:00' }]);
  assert.deepEqual(days, [
    { fecha: '2026-11-07', dayKey: 'sabado', hora: '12:00', jugadores: [{ id: 1, nombre: 'Ana Gil', horario: 'manana' }, { id: 2, nombre: 'Leo', horario: 'tarde' }] },
    { fecha: '2026-11-08', dayKey: 'domingo', hora: null, jugadores: [{ id: 2, nombre: 'Leo', horario: 'tarde' }] },
  ]);
});
