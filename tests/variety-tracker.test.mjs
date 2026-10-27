import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WeeklyVarietyTracker, selectFoodWithVariety } from '../lib/engine/variety-tracker.js';

const PROCESSING = {
  'Carne picada de pollo': ['picada'],
  'Hamburguesa de pavo': ['hamburguesa', 'picada'],
  'Noodles de arroz': ['noodles'],
  'Noodles de trigo': ['noodles'],
};

const newTracker = () => new WeeklyVarietyTracker(null, {
  proteinBranches: ['pollo', 'pavo', 'pescado_blanco'],
  carbBranches: ['arroz', 'pasta', 'legumbres', 'otros_granos'],
  getFoodProcessing: (name) => PROCESSING[name] || [],
});

test('la cena no repite el procesado de la comida aunque sea de otra rama', () => {
  const tracker = newTracker();
  tracker.startNewDay('lunes');
  tracker.setTodayLunch({ proteinBranches: ['pollo'], proteinFoods: ['Carne picada de pollo'], carbBranches: [], carbFoods: [] });
  tracker.setCurrentMeal('cena');
  assert.equal(tracker.isSameDayProtein('Hamburguesa de pavo', 'pavo'), true);
  assert.equal(tracker.isSameDayProtein('Pechuga de pavo', 'pavo'), false);
});

test('una toma no se compara consigo misma: la cena no evita lo que ella misma lleva fijo', () => {
  const tracker = newTracker();
  tracker.startNewDay('lunes');
  tracker.setTodayPlannedDinner({ proteinBranches: ['pescado_blanco'], carbBranches: [], foods: [], processing: [] });
  tracker.setCurrentMeal('comida');
  assert.equal(tracker.isSameDayProtein(null, 'pescado_blanco'), true);
  tracker.setCurrentMeal('cena');
  assert.equal(tracker.isSameDayProtein(null, 'pescado_blanco'), false);
});

test('lo del día anterior cuenta como reciente aunque después se hayan registrado más tomas', () => {
  const tracker = newTracker();
  tracker.startNewDay('lunes');
  tracker.recordCarb('Lentejas', 'legumbres');
  tracker.recordCarb('Arroz blanco', 'arroz');
  tracker.startNewDay('martes');
  // El desayuno del martes no desplaza lo que se comió el lunes.
  tracker.recordCarb('Pan', 'panes');
  tracker.recordProtein('Huevo entero', 'huevos');
  assert.equal(tracker.isCarbRecent(null, 'legumbres'), true);
  assert.equal(tracker.isCarbRecent('Lentejas'), true);
  assert.equal(tracker.isCarbRecent(null, 'pasta'), false);
  tracker.startNewDay('miercoles');
  assert.equal(tracker.isCarbRecent(null, 'legumbres'), false);
});

test('lo que el día siguiente lleva sí o sí se evita la víspera', () => {
  const tracker = newTracker();
  tracker.setPlannedDays({
    martes: { proteinBranches: [], carbBranches: ['legumbres'], foods: ['Lentejas'], processing: [] },
    miercoles: { proteinBranches: [], carbBranches: [], foods: ['Noodles de arroz'], processing: ['noodles'] },
  }, ['lunes', 'martes', 'miercoles']);
  tracker.startNewDay('lunes');
  assert.equal(tracker.isCarbRecent(null, 'legumbres'), true);
  assert.equal(tracker.isCarbRecent(null, 'arroz'), false);
  tracker.startNewDay('martes');
  // El martes, la víspera de los noodles del miércoles, tampoco salen noodles de otro grano.
  assert.equal(tracker.isCarbRecent('Noodles de trigo', 'pasta'), true);
});

test('dentro de una rama sale antes el alimento que lleva más días sin salir', () => {
  const tracker = newTracker();
  tracker.startNewDay('d1');
  tracker.recordFruit('Plátano');
  tracker.startNewDay('d2');
  tracker.recordFruit('Manzana');
  tracker.startNewDay('d3');
  const counts = { Plátano: 0, Manzana: 0, Kiwi: 0 };
  for (let i = 0; i < 3000; i++) {
    const chosen = selectFoodWithVariety(['Plátano', 'Manzana', 'Kiwi'], tracker, tracker.isFruitRecent, null);
    counts[chosen]++;
  }
  // La manzana (ayer) queda fuera; el plátano (hace dos días) sale mucho menos que el kiwi, que no ha salido.
  assert.equal(counts.Manzana, 0);
  assert.ok(counts.Kiwi > counts.Plátano * 3, JSON.stringify(counts));
});

test('snapshot y restore conservan la memoria por días', () => {
  const tracker = newTracker();
  tracker.startNewDay('lunes');
  tracker.recordProtein('Carne picada de pollo', 'pollo');
  const snapshot = tracker.snapshot();
  tracker.startNewDay('martes');
  tracker.recordProtein('Merluza', 'pescado_blanco');
  tracker.restore(snapshot);
  assert.equal(tracker.days.length, 1);
  assert.deepEqual(tracker.days[0].processing, ['picada']);
  assert.equal(tracker.processingOf('Hamburguesa de pavo').includes('picada'), true);
});
