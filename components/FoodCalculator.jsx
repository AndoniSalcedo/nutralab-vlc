'use client';

import { useMemo, useState } from 'react';

const foods = [
  { name: 'Pasta cocida', kcal: 157, cho: 30.9, pro: 5.8, fat: 0.9 },
  { name: 'Arroz cocido', kcal: 129, cho: 28.2, pro: 2.7, fat: 0.3 },
  { name: 'Pechuga de pollo cocinada', kcal: 165, cho: 0, pro: 31, fat: 3.6 },
  { name: 'Pan blanco', kcal: 265, cho: 49, pro: 9, fat: 3.2 },
  { name: 'Plátano', kcal: 89, cho: 23, pro: 1.1, fat: 0.3 },
  { name: 'Yogur griego natural', kcal: 97, cho: 3.9, pro: 9, fat: 5 },
  { name: 'Bebida isotónica', kcal: 24, cho: 6, pro: 0, fat: 0 },
  { name: 'Gel energético', kcal: 120, cho: 30, pro: 0, fat: 0 },
  { name: 'Whey protein', kcal: 400, cho: 8, pro: 78, fat: 7 },
];

export default function FoodCalculator() {
  const [foodName, setFoodName] = useState(foods[0].name);
  const [grams, setGrams] = useState('100');
  const food = foods.find((f) => f.name === foodName) || foods[0];
  const result = useMemo(() => {
    const g = Number(grams || 0) / 100;
    return {
      kcal: Math.round(food.kcal * g),
      cho: +(food.cho * g).toFixed(1),
      pro: +(food.pro * g).toFixed(1),
      fat: +(food.fat * g).toFixed(1),
    };
  }, [food, grams]);

  return (
    <div className="card stack">
      <div>
        <h3 style={{ margin: 0 }}>Calculadora rápida de alimentos</h3>
        <p className="muted small">Starter con alimentos frecuentes. El siguiente paso es conectar BEDCA completa y tus alimentos internos.</p>
      </div>
      <div className="grid grid-3">
        <div>
          <label className="label">Alimento</label>
          <select className="select" value={foodName} onChange={(e) => setFoodName(e.target.value)}>
            {foods.map((f) => <option key={f.name}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Cantidad (g/ml)</label>
          <input className="input" type="number" value={grams} onChange={(e) => setGrams(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-3">
        <div className="kpi"><span className="muted small">Kcal</span><strong>{result.kcal}</strong></div>
        <div className="kpi"><span className="muted small">CHO / PRO / FAT</span><strong>{`${result.cho} / ${result.pro} / ${result.fat}`}</strong></div>
        <div className="kpi"><span className="muted small">Base</span><strong>por 100 g</strong></div>
      </div>
    </div>
  );
}
