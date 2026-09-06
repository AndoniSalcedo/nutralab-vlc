import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: process.env.SUPABASE_SCHEMA || "teams" } }
);

async function inspect() {
  console.log("=== 1. MENÚS SEMANALES RECIENTES ===");
  const { data: menus, error: menuErr } = await supabase
    .from("menus_semanales")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (menuErr) console.error("Error fetching menus:", menuErr);
  else {
    menus?.forEach((m) => {
      console.log(`\nID: ${m.id} | Semana: ${m.semana} | EquipoID: ${m.equipo_id} | Creado: ${m.created_at}`);
      if (m.dias) {
        console.log("Días del menú:");
        m.dias.forEach((d) => {
          console.log(`  [${d.dia}]`);
          console.log(`    Comida -> 1º: ${d.comida?.primero || '-'} | 2º: ${d.comida?.segundo || '-'} | Postre: ${d.comida?.postre || '-'}`);
          console.log(`    Cena   -> 1º: ${d.cena?.primero || '-'} | 2º: ${d.cena?.segundo || '-'} | Postre: ${d.cena?.postre || '-'}`);
        });
      }
    });
  }

  console.log("\n=== 2. CONFIGURACIÓN DE LOS 10 JUGADORES ===");
  const _playerNames = [
    "Arnau", "Dani", "David", "Harvey", "Hugo", "Jesús", "Jesus", "Mouctar", "Pablo", "Raúl", "Raul", "Stole"
  ];

  const { data: players, error: plErr } = await supabase
    .from("jugadores")
    .select("id, nombre, apellidos, posicion, num_comidas, postentreno, recomendaciones_defecto, config_prepartido, alergias, intolerancias, aversiones, gustos_preferencias, objetivo")
    .order("nombre");

  if (plErr) {
    console.error("Error fetching players:", plErr);
    return;
  }

  const filtered = players.filter(p => {
    const full = `${p.nombre} ${p.apellidos}`.toLowerCase();
    return (
      full.includes("arnau") ||
      full.includes("raba") ||
      full.includes("otorbi") ||
      full.includes("elliot") ||
      full.includes("duro") ||
      full.includes("vázquez") || full.includes("vazquez") ||
      full.includes("diakhaby") ||
      full.includes("maffeo") ||
      full.includes("jimenez") || full.includes("jiménez") ||
      full.includes("dimitrevski")
    );
  });

  filtered.forEach(p => {
    console.log(`\n-----------------------------------------`);
    console.log(`ID: ${p.id} | ${p.nombre} ${p.apellidos || ''}`);
    console.log(`Posición: ${p.posicion || 'NO ASIGNADA (null/empty)'}`);
    console.log(`Num Comidas: ${p.num_comidas}`);
    console.log(`Post-entreno: ${p.postentreno}`);
    console.log(`Objetivo: ${p.objetivo}`);
    console.log(`Alergias: ${p.alergias || 'ninguna'}`);
    console.log(`Intolerancias: ${p.intolerancias || 'ninguna'}`);
    console.log(`Aversiones: ${p.aversiones || 'ninguna'}`);
    console.log(`Gustos / Preferencias: ${p.gustos_preferencias || 'ninguno'}`);
    console.log(`Recomendaciones Defecto:`, JSON.stringify(p.recomendaciones_defecto, null, 2));
    console.log(`Config Pre-partido:`, JSON.stringify(p.config_prepartido, null, 2));
  });
}

inspect();
