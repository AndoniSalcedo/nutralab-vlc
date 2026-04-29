'use client';

import { useMemo, useState } from 'react';
import { cunninghamPlan } from '@/lib/calculations';

export default function PlayerForm({ initial }) {
  const [weight, setWeight] = useState(String(initial?.peso_kg ?? ''));
  const [bodyFat, setBodyFat] = useState(String(initial?.porcentaje_grasa ?? ''));
  const [leanMass, setLeanMass] = useState(String(initial?.masa_magra_kg ?? ''));
  const [activityFactor, setActivityFactor] = useState(String(initial?.factor_actividad ?? '1.6'));
  const calc = useMemo(() => {
    const weightNum = Number(weight || 0);
    if (!weightNum) return null;
    return cunninghamPlan({
      weightKg: weightNum,
      bodyFatPct: bodyFat ? Number(bodyFat) : null,
      leanMassKg: leanMass ? Number(leanMass) : null,
      activityFactor: Number(activityFactor || 1.6),
    });
  }, [weight, bodyFat, leanMass, activityFactor]);

  return (
    <div className="card stack">
      <h3 style={{ margin: 0 }}>{initial ? 'Editar jugador' : 'Añadir jugador'}</h3>
      <p className="muted small">Este formulario recalcula automáticamente el plan base con Cunningham.</p>
      <form method="post" action="/api/players" className="grid grid-3">
        {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
        <div>
          <label className="label">Nombre</label>
          <input className="input" name="nombre" defaultValue={initial?.nombre ?? ''} required />
        </div>
        <div>
          <label className="label">Apellidos</label>
          <input className="input" name="apellidos" defaultValue={initial?.apellidos ?? ''} />
        </div>
        <div>
          <label className="label">Posición</label>
          <input className="input" name="posicion" defaultValue={initial?.posicion ?? ''} />
        </div>
        <div>
          <label className="label">Altura (cm)</label>
          <input className="input" name="altura_cm" type="number" step="0.1" defaultValue={initial?.altura_cm ?? ''} />
        </div>
        <div>
          <label className="label">Peso (kg)</label>
          <input className="input" name="peso_kg" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} required />
        </div>
        <div>
          <label className="label">% grasa</label>
          <input className="input" name="porcentaje_grasa" type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
        </div>
        <div>
          <label className="label">Masa magra (kg)</label>
          <input className="input" name="masa_magra_kg" type="number" step="0.1" value={leanMass} onChange={(e) => setLeanMass(e.target.value)} />
        </div>
        <div>
          <label className="label">Factor actividad</label>
          <select className="select" name="factor_actividad" value={activityFactor} onChange={(e) => setActivityFactor(e.target.value)}>
            <option value="1.2">Descanso</option>
            <option value="1.4">Recuperación</option>
            <option value="1.6">Entreno normal</option>
            <option value="1.75">Doble sesión</option>
            <option value="1.9">Partido</option>
          </select>
        </div>
        <div>
          <label className="label">Gustos / preferencias</label>
          <textarea className="textarea" name="gustos_preferencias" defaultValue={initial?.gustos_preferencias ?? ''} />
        </div>
        <div>
          <label className="label">Lesión / contexto</label>
          <textarea className="textarea" name="contexto_clinico" defaultValue={initial?.contexto_clinico ?? ''} />
        </div>
        <div>
          <label className="label">Objetivo corporal</label>
          <textarea className="textarea" name="objetivo" defaultValue={initial?.objetivo ?? ''} />
        </div>
        <input type="hidden" name="kcal_objetivo" value={calc?.kcal ?? ''} />
        <input type="hidden" name="cho_objetivo_g" value={calc?.cho ?? ''} />
        <input type="hidden" name="proteina_objetivo_g" value={calc?.protein ?? ''} />
        <input type="hidden" name="grasa_objetivo_g" value={calc?.fat ?? ''} />
        <input type="hidden" name="agua_objetivo_ml" value={calc?.hydrationMl ?? ''} />
        <div style={{ gridColumn: '1 / -1' }} className="grid grid-3">
          <div className="kpi"><span className="muted small">Kcal objetivo</span><strong>{calc?.kcal ?? '—'}</strong></div>
          <div className="kpi"><span className="muted small">CHO / PRO / FAT</span><strong>{calc ? `${calc.cho} / ${calc.protein} / ${calc.fat}` : '—'}</strong></div>
          <div className="kpi"><span className="muted small">Agua objetivo</span><strong>{calc ? `${calc.hydrationMl} ml` : '—'}</strong></div>
        </div>
        <div style={{ gridColumn: '1 / -1' }} className="flex">
          <button className="button" type="submit">Guardar jugador</button>
          {initial?.id ? (
            <button className="button danger" type="submit" formAction="/api/players?delete=1">Eliminar</button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
