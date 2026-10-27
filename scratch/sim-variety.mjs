// Simulación de variedad: genera N semanas para un jugador sintético y mide repeticiones y frecuencias.
import { generarDatosPlan } from '../lib/engine/generator.js';
import { createFoodItemFromName, getFullFoodTree, getFoodCategoryBranch } from '../lib/engine/food-tree.js';

const N = +process.argv[2] || 60;
const withMenu = process.argv[3] === 'menu';
const full = getFullFoodTree();
const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const jugador = { id: 1, nombre: 'Sim', apellidos: '', num_comidas: 'Desayuno, Comida, Merienda, Cena', peso_kg: 75, objetivo: 'mantenimiento', recomendaciones_defecto: {} };
const f = (name) => ({ type: 'food', name });
const dish = (label, ...names) => ({ type: 'allOf', label, children: names.map(f) });
const service = (primeros, segundos, postres) => ({ tree: { type: 'allOf', children: [
  { type: 'oneOf', course: 'primero', label: 'Primero', children: primeros },
  { type: 'oneOf', course: 'segundo', label: 'Segundo', children: segundos },
  ...(postres ? [{ type: 'oneOf', course: 'postre', label: 'Postre', children: postres }] : []),
] } });
const menu = withMenu ? { dias: DAYS.map((dia) => ({
  dia,
  comida: dia === 'martes'
    ? service([dish('Lentejas estofadas', 'Lentejas', 'Zanahoria')], [dish('Merluza plancha', 'Merluza')])
    : service([dish('Arroz con verduras', 'Arroz blanco', 'Calabacín'), dish('Macarrones', 'Macarrones', 'Tomate frito')], [dish('Pollo plancha', 'Pechuga de pollo'), dish('Hamburguesa de pavo', 'Hamburguesa de pavo')]),
  cena: service([dish('Puré de patata', 'Puré de patata'), dish('Ensalada', 'Lechuga romana', 'Tomate')], [dish('Carne picada de pollo', 'Carne picada de pollo'), dish('Dorada', 'Dorada')]),
})) } : null;
const cal = { lunes: 'entreno', martes: 'entreno', miercoles: 'descanso', jueves: 'entreno', viernes: 'entreno', sabado: 'partido', domingo: 'recuperacion' };

const parse = (detalle) => String(detalle || '').split(/,\s+(?=[A-ZÁÉÍÓÚÑ0-9])/).map((t) => t.trim()
  .replace(/^\d+\s+Huevos?.*$/i, 'Huevo entero').replace(/\s+-?\d+(?:\.\d+)?g.*$/, '').replace(/\s+\d+\s+unidad.*$/, '').replace(/^Tostadas de /i, ''))
  .map((n) => createFoodItemFromName(n, null, full)?.food || createFoodItemFromName(n.charAt(0).toUpperCase() + n.slice(1), null, full)?.food).filter(Boolean);

const freq = { frutas: {}, verduras: {}, hidratos: {}, proteina: {} };
const stats = { consecutiveCarbFood: 0, consecutiveProtFood: 0, consecutiveCarbBranch: 0, consecutiveProtBranch: 0, sameDayProc: 0, consecutiveProc: 0, days: 0, mainMeals: 0 };
const ex = {};
let planAnterior = null;
for (let i = 0; i < N; i++) {
  const plan = await generarDatosPlan({ jugador, nombre: 't', calendario: cal, menu, teamConfig: {}, preMatchConfig: null, planAnterior });
  planAnterior = plan;
  let prev = null;
  for (const dk of DAYS) {
    const d = plan.dias[dk]; stats.days++;
    stats.absKcal = (stats.absKcal || 0) + Math.abs(d.desviacionMacros?.kcal || 0) / (N * 7);
    if (Math.abs(d.desviacionMacros?.kcal || 0) > 100) stats.over100 = (stats.over100 || 0) + 1;
    const cur = { carbFoods: new Set(), protFoods: new Set(), carbB: new Set(), protB: new Set(), proc: [] };
    for (const ing of d.ingestas) {
      const foods = parse(ing.detalle);
      const main = /comida|cena/i.test(ing.nombre);
      if (main) stats.mainMeals++;
      for (const food of foods) {
        const root = food.treePath[0];
        if (freq[root] && (main || root === 'frutas')) freq[root][food.name] = (freq[root][food.name] || 0) + 1;
        if (!main) continue;
        const { carbBranch, proteinBranch } = getFoodCategoryBranch(food);
        if (carbBranch) { cur.carbFoods.add(food.name); cur.carbB.add(carbBranch); }
        if (proteinBranch) { cur.protFoods.add(food.name); cur.protB.add(proteinBranch); }
        for (const p of food.procesado || []) cur.proc.push(`${ing.nombre}:${p}:${food.name}`);
      }
    }
    const procs = cur.proc.map((x) => x.split(':')[1]);
    const dupProc = procs.filter((p, i2) => procs.indexOf(p) !== i2);
    if (dupProc.length) { stats.sameDayProc++; (ex.sameDayProc ||= []).length < 5 && ex.sameDayProc.push(`${dk}: ${cur.proc.join(' | ')}`); }
    if (prev) {
      const inter = (a, b) => [...a].filter((x) => b.has(x));
      if (inter(cur.carbFoods, prev.carbFoods).length) { stats.consecutiveCarbFood++; (ex.carbFood ||= []).length < 6 && ex.carbFood.push(`${dk}: ${inter(cur.carbFoods, prev.carbFoods)}`); }
      if (inter(cur.protFoods, prev.protFoods).length) { stats.consecutiveProtFood++; (ex.protFood ||= []).length < 6 && ex.protFood.push(`${dk}: ${inter(cur.protFoods, prev.protFoods)}`); }
      if (inter(cur.carbB, prev.carbB).length) stats.consecutiveCarbBranch++;
      if (inter(cur.protB, prev.protB).length) stats.consecutiveProtBranch++;
      const pp = new Set(prev.proc.map((x) => x.split(':')[1]));
      if (procs.some((p) => pp.has(p))) stats.consecutiveProc++;
    }
    prev = cur;
  }
}
const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(', ');
console.log(withMenu ? 'CON MENÚ' : 'SIN MENÚ', JSON.stringify(stats));
for (const k of Object.keys(freq)) console.log(`\n${k} (${Object.keys(freq[k]).length} distintos):`, top(freq[k]));
console.log('\nEjemplos', JSON.stringify(ex, null, 1));
