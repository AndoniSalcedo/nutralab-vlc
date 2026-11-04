import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyFoodChange,
  consumedFromMeals,
  dishCalories,
  hasDishContent,
  parseIngredients,
  rowsFromIngredients,
  suggestMealType,
  summarizeDishes,
  toNumber,
} from '../lib/nutrition/mealDishes.js';

const rice = { name: 'Arroz', kcal: 350, pro: 7, cho: 78, fat: 1 };
let seq = 0;
const nextId = () => (seq += 1);

test('toNumber entiende cifras con unidad y coma decimal', () => {
  assert.equal(toNumber('12,5 g'), 12.5);
  assert.equal(toNumber(30), 30);
  assert.equal(toNumber(''), null);
  assert.equal(toNumber(null), null);
});

test('añadir un alimento suma sobre lo que ya tiene el plato en vez de borrarlo', () => {
  const dish = { calories: '500', protein: '30', carbs: '40', fat: '10', ingredients: 'Pollo (150 g)' };
  const row = { food: rice, grams: 100 };
  const next = applyFoodChange(dish, null, row);
  assert.equal(next.calories, '850');
  assert.equal(next.protein, '37');
  assert.equal(next.carbs, '118');
  assert.equal(next.fat, '11');
  assert.equal(next.ingredients, 'Pollo (150 g)\nArroz (100 g)');
});

test('cambiar gramos aplica la diferencia y quitar el alimento la revierte', () => {
  const base = { calories: '500', protein: '30', carbs: '40', fat: '10', ingredients: '' };
  const row = { food: rice, grams: 100 };
  const added = applyFoodChange(base, null, row);
  const doubled = { food: rice, grams: 200 };
  const changed = applyFoodChange(added, row, doubled);
  assert.equal(changed.calories, '1200');
  assert.equal(changed.ingredients, 'Arroz (200 g)');
  const removed = applyFoodChange(changed, doubled, null);
  assert.equal(removed.calories, '500');
  assert.equal(removed.protein, '30');
  assert.equal(removed.ingredients, '');
});

test('no reescribe una línea de ingrediente que la persona ha editado', () => {
  const dish = { calories: '350', protein: '', carbs: '', fat: '', ingredients: 'Arroz integral' };
  const next = applyFoodChange(dish, { food: rice, grams: 100 }, { food: rice, grams: 200 });
  assert.equal(next.ingredients, 'Arroz integral');
  assert.equal(next.calories, '700');
});

test('un plato sin datos previos deja vacío lo que no llega a sumar', () => {
  const next = applyFoodChange({ calories: '', protein: '', carbs: '', fat: '', ingredients: '' }, null, {
    food: { name: 'Agua', kcal: 0, pro: 0, cho: 0, fat: 0 },
    grams: 100,
  });
  assert.equal(next.calories, '');
  assert.equal(next.protein, '');
});

test('parseIngredients admite líneas y comas sin romper los ingredientes con gramos', () => {
  assert.deepEqual(parseIngredients('2 huevos, pan integral\nAceite, oliva (10 g)\n'), [
    '2 huevos',
    'pan integral',
    'Aceite, oliva (10 g)',
  ]);
});

test('rowsFromIngredients recupera los alimentos de la biblioteca', () => {
  const rows = rowsFromIngredients(['arroz (150 g)', 'Pollo', 'Desconocido (10 g)'], [rice], nextId);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].food, rice);
  assert.equal(rows[0].grams, 150);
  assert.equal(applyFoodChange({ ingredients: 'arroz (150 g)' }, rows[0], null).ingredients, '');
});

test('dishCalories deduce la energía de los macros si falta', () => {
  assert.equal(dishCalories({ calories: '', protein: '10', carbs: '10', fat: '10' }), 170);
  assert.equal(dishCalories({ calories: '300', protein: '10' }), 300);
  assert.equal(dishCalories({ calories: '' }), null);
});

test('summarizeDishes suma los platos sin confundir sin dato con cero', () => {
  const summary = summarizeDishes([
    { dishName: 'Lentejas', calories: 400, protein: 20, carbs: 50, fat: null, ingredients: ['Lentejas'] },
    { dishName: ' ', calories: null, protein: null, carbs: 10.5, fat: null, ingredients: [] },
    { dishName: 'Flan', calories: 150, protein: 3, carbs: null, fat: null, ingredients: ['Huevo', 'Leche'] },
  ]);
  assert.equal(summary.dishName, 'Lentejas · Flan');
  // 400 + 150 + 42 kcal deducidas de los 10,5 g de hidratos del plato sin energía
  assert.equal(summary.calories, 592);
  assert.equal(summary.protein, 23);
  assert.equal(summary.carbs, 60.5);
  assert.equal(summary.fat, null);
  assert.deepEqual(summary.ingredients, ['Lentejas', 'Huevo', 'Leche']);
});

test('consumedFromMeals usa los macros guardados y recalcula los registros antiguos', () => {
  const consumed = consumedFromMeals([
    { calories: 500, protein: 30, carbs: null, fat: 10, ingredients: ['Arroz (100 g)'] },
    { calories: 350, protein: null, carbs: null, fat: null, ingredients: ['Arroz (100 g)', 'Café'] },
    { calories: null, protein: null, carbs: null, fat: null, ingredients: ['Arroz (200 g)'] },
  ], [rice]);
  assert.deepEqual(consumed, { kcal: 1550, pro: 51, cho: 234, fat: 13 });
});

test('consumedFromMeals da macros aunque la biblioteca no haya cargado', () => {
  const consumed = consumedFromMeals([{ calories: 300, protein: 20, carbs: 30, fat: 5, ingredients: [] }], []);
  assert.deepEqual(consumed, { kcal: 300, pro: 20, cho: 30, fat: 5 });
});

test('hasDishContent ignora platos vacíos', () => {
  assert.equal(hasDishContent({ dishName: ' ', calories: '', ingredients: '' }), false);
  assert.equal(hasDishContent({ calories: '120' }), true);
  assert.equal(hasDishContent({ photoUrl: '/foto' }), true);
});

test('suggestMealType sugiere la toma por la hora', () => {
  assert.equal(suggestMealType(new Date(2026, 10, 4, 9, 0)), 'breakfast');
  assert.equal(suggestMealType(new Date(2026, 10, 4, 14, 30)), 'lunch');
  assert.equal(suggestMealType(new Date(2026, 10, 4, 18, 0)), 'snack');
  assert.equal(suggestMealType(new Date(2026, 10, 4, 21, 15)), 'dinner');
});
