import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeName, partialCandidates } from '../lib/io/nameMatching.js';

const squad = [
  { id: 1, nombre: 'Javi', apellidos: 'Guerra' },
  { id: 2, nombre: 'Stole', apellidos: 'Dimitrevski' },
  { id: 3, nombre: 'Arnaut', apellidos: 'Danjuma' },
  { id: 4, nombre: 'Kayne', apellidos: 'Van Oeleven' },
  { id: 5, nombre: 'Harvey', apellidos: 'Elliot' },
  { id: 6, nombre: 'Luis', apellidos: 'Rioja' },
  { id: 7, nombre: 'José', apellidos: 'Luis Gayá' },
];

const ids = (name) => partialCandidates(normalizeName(name), squad).map((p) => p.id);

test('reconoce abreviaturas del nombre', () => {
  assert.deepEqual(ids('Javier Guerra'), [1]);
});

test('tolera erratas en el apellido', () => {
  assert.deepEqual(ids('Stole Dimitresky'), [2]);
  assert.deepEqual(ids('Harvey Elliott'), [5]);
});

test('un solo apellido o nombre encuentra al jugador', () => {
  assert.deepEqual(ids('Danjuma'), [3]);
  assert.deepEqual(ids('Kayne'), [4]);
});

test('no empareja a jugadores sin relación', () => {
  assert.deepEqual(ids('Andre Almeida'), []);
});

test('ordena por número de palabras compartidas', () => {
  assert.equal(ids('Luis Rioja')[0], 6);
});
