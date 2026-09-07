/**
 * Script de migración determinista de restricciones clínicas y aversiones
 * Actualiza los perfiles de todos los jugadores de la plantilla en Supabase
 * unificando alergias/intolerancias en etiquetas canónicas fijas.
 */

import { getSupabaseAdmin } from '@/lib/supabase/server';
import { formatClinicalTags } from '@/config/clinical-tags';

const MIGRATIONS = [
  // --- EQUIPO 7 ---
  {
    id: 178,
    nombre: 'Arnaut Danjuma',
    intolerancias: 'sin_cerdo',
    alergias: '',
    aversiones: 'Cerdo',
  },
  {
    id: 180,
    nombre: 'César Tárrega',
    intolerancias: '',
    alergias: '',
    aversiones: 'Espinacas, garbanzos, alubias',
    gustos_preferencias: 'Pasta y arroz',
    contexto_clinico: 'Comida prepartido: pasta + pollo + puré de patata. Cena previa: arroz + salmón con puré de patata',
  },
  {
    id: 185,
    nombre: 'David Otorbi',
    intolerancias: '',
    alergias: '',
    gustos_preferencias: 'Pollo',
  },
  {
    id: 188,
    nombre: 'Filip Ugrinic',
    intolerancias: 'sin_cerdo, sin_pescado',
    alergias: '',
    aversiones: 'Pescado y cerdo',
  },
  {
    id: 189,
    nombre: 'Guido',
    intolerancias: 'sin_gluten, sin_lactosa',
    alergias: '',
    aversiones: 'Edulcorantes artificiales',
  },
  {
    id: 190,
    nombre: 'Hugo Duro',
    intolerancias: '',
    alergias: '',
    aversiones: 'Verdura',
    gustos_preferencias: 'Tostadas con pavo o jamón y huevo en desayuno',
    contexto_clinico: 'Día de partido: Pasta con boloñesa + 2 huevos con pan + arroz con leche',
  },
  {
    id: 192,
    nombre: 'Jesús Vázquez',
    intolerancias: 'sin_pescado',
    alergias: '',
    aversiones: 'Espinacas, cebolla pochada, queso frío, verdura cocinada, salsas',
  },
  {
    id: 193,
    nombre: 'José Luis Gayá',
    intolerancias: 'sin_gluten, sin_lactosa',
    alergias: '',
    aversiones: 'Edulcorantes artificiales',
    contexto_clinico: 'Hipotiroidismo',
  },
  {
    id: 195,
    nombre: 'Luis Rioja',
    intolerancias: '',
    alergias: '',
    aversiones: 'Coliflor, brócoli, tomate muy maduro',
    gustos_preferencias: 'Café',
    contexto_clinico: 'Suplementación en taquilla + batido de chocolate + poner geles',
  },
  {
    id: 196,
    nombre: 'Mouctar Diakhaby',
    intolerancias: 'sin_cerdo',
    alergias: '',
    aversiones: 'Cerdo',
    gustos_preferencias: 'Fruta, arroz, pollo, salmón, aguacate, crema de verduras',
    contexto_clinico: 'Cena prepartido: salmón y pasta con aguacate / Comida: puré de patata o boniato + pollo y huevos + fruta',
  },
  {
    id: 198,
    nombre: 'Pepelu',
    intolerancias: '',
    alergias: '',
    aversiones: 'Boniato, porridge de avena, ñoquis',
    contexto_clinico: 'Psoriasis (Protocolo antiinflamatorio)',
  },
  {
    id: 201,
    nombre: 'Sadiq',
    intolerancias: 'sin_cerdo',
    alergias: '',
    aversiones: 'Cerdo',
  },
  {
    id: 204,
    nombre: 'Justin de Haas',
    intolerancias: '',
    alergias: '',
    contexto_clinico: '',
    gustos_preferencias: 'Todo',
  },
  {
    id: 205,
    nombre: 'Íker Córdoba',
    intolerancias: '',
    alergias: '',
    contexto_clinico: '',
    gustos_preferencias: '',
  },
  {
    id: 218,
    nombre: 'Sato',
    intolerancias: '',
    alergias: '',
    gustos_preferencias: 'Arroz, pollo, salmón',
  },
  {
    id: 220,
    nombre: 'Dieng Aliou',
    intolerancias: 'sin_cerdo',
    alergias: '',
    aversiones: 'Cerdo',
    contexto_clinico: '',
  },
  {
    id: 237,
    nombre: 'Pablo Maffeo',
    intolerancias: '',
    alergias: '',
    aversiones: 'Café',
    gustos_preferencias: 'Queso',
  },
  {
    id: 247,
    nombre: 'Arnau Martínez',
    intolerancias: 'sin_pescado',
    alergias: '',
    aversiones: 'Pescado',
    gustos_preferencias: 'Todo',
  },
  {
    id: 251,
    nombre: 'Harvey Elliot',
    intolerancias: 'sin_pescado',
    alergias: '',
    aversiones: 'Pescado',
  },

  // --- EQUIPO 8 ---
  {
    id: 175,
    nombre: 'Juan Foyth',
    intolerancias: 'sin_pescado',
    alergias: '',
    aversiones: 'Salmón, atún fresco, pescados frescos en general',
    gustos_preferencias: 'Carne',
    contexto_clinico: 'Fase final de readaptación de una lesión larga',
  },
  {
    id: 176,
    nombre: 'Alberto Marí',
    intolerancias: '',
    alergias: '',
    contexto_clinico: 'Sale de lesión',
  },
  {
    id: 194,
    nombre: 'Lucas Nuñez',
    intolerancias: 'sin_marisco',
    alergias: '',
    aversiones: 'Marisco',
    gustos_preferencias: 'Variado',
    contexto_clinico: 'Comida prepartido: arroz + pollo. Cena previa: pasta y pollo o salmón y aguacate',
  },
  {
    id: 206,
    nombre: 'Mario Dominguez',
    intolerancias: '',
    alergias: '',
    aversiones: 'Verdura cocinada',
    contexto_clinico: '',
  },
  {
    id: 207,
    nombre: 'Rodrigo Gamón',
    intolerancias: '',
    alergias: '',
    aversiones: 'Berenjena, pepino',
    gustos_preferencias: 'Pasta, pollo, boniato, arroz, fruta, huevos, carne',
    contexto_clinico: '',
  },
  {
    id: 208,
    nombre: 'Aaron Mayol',
    intolerancias: '',
    alergias: '',
    gustos_preferencias: 'Todo',
    contexto_clinico: '',
  },
  {
    id: 209,
    nombre: 'Miguel Monferrer',
    intolerancias: '',
    alergias: '',
    contexto_clinico: '',
  },
  {
    id: 231,
    nombre: 'Eray Comert',
    intolerancias: 'sin_cerdo, sibo_low_fodmap',
    alergias: '',
    aversiones: 'Cerdo y lentejas',
    gustos_preferencias: 'Le gusta comer algo dulce por la noche',
    contexto_clinico: 'Sensibilidad a verduras flatulentas',
  },
  {
    id: 236,
    nombre: 'Gonzalo Crettaz',
    intolerancias: 'sin_gluten, sin_lactosa, sibo_low_fodmap',
    alergias: '',
    gustos_preferencias: 'Carne roja',
    contexto_clinico: 'Principio de SIBO',
  },
];

async function main() {
  console.log('Iniciando migración clínica de jugadores...\n');
  const supabase = getSupabaseAdmin();

  let updatedCount = 0;
  for (const m of MIGRATIONS) {
    const updateData = {
      intolerancias: m.intolerancias,
      alergias: m.alergias,
    };
    if (m.aversiones !== undefined) updateData.aversiones = m.aversiones;
    if (m.gustos_preferencias !== undefined) updateData.gustos_preferencias = m.gustos_preferencias;
    if (m.contexto_clinico !== undefined) updateData.contexto_clinico = m.contexto_clinico;

    const { error } = await supabase.from('jugadores').update(updateData).eq('id', m.id);
    if (error) {
      console.error(`Error actualizando jugador [${m.id}] ${m.nombre}:`, error.message);
    } else {
      console.log(`✓ [${m.id}] ${m.nombre.padEnd(20)} -> Tags: ${formatClinicalTags(m.intolerancias)}`);
      updatedCount++;
    }
  }

  // Limpiar "nada" / "Nada" en los demás jugadores que aún tengan texto redundante
  const { data: others } = await supabase
    .from('jugadores')
    .select('id, nombre, alergias, intolerancias')
    .not('id', 'in', `(${MIGRATIONS.map((m) => m.id).join(',')})`);

  if (others && others.length > 0) {
    for (const o of others) {
      const isAlergNada = /^\s*nada\s*$/i.test(o.alergias || '');
      const isIntolNada = /^\s*nada\s*$/i.test(o.intolerancias || '');
      if (isAlergNada || isIntolNada) {
        await supabase.from('jugadores').update({
          ...(isAlergNada ? { alergias: '' } : {}),
          ...(isIntolNada ? { intolerancias: '' } : {}),
        }).eq('id', o.id);
        console.log(`✓ [${o.id}] ${o.nombre} (Limpiado texto 'nada')`);
      }
    }
  }

  console.log(`\nMigración completada exitosamente. Jugadores actualizados: ${updatedCount}.`);
}

main().catch((err) => {
  console.error('Error fatal en migración:', err);
  process.exit(1);
});
