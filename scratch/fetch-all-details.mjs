import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: "teams" } }
);

async function inspectAll() {
  console.log("=== 1. MENÚS SEMANALES (teams.menu_semanal) ===");
  const { data: menus, error: mErr } = await supabase
    .from("menu_semanal")
    .select("*")
    .order("id", { ascending: false })
    .limit(5);

  if (mErr) console.error("Error menu_semanal:", mErr);
  else {
    menus?.forEach((m) => {
      console.log(`\n========================================`);
      console.log(`ID: ${m.id} | Semana: ${m.semana} | EquipoID: ${m.equipo_id}`);
      console.log(JSON.stringify(m.dias, null, 2));
    });
  }

  console.log("\n=== 2. CONFIGURACIÓN EXACTA DE LOS 10 JUGADORES ===");
  const targetIds = [247, 184, 185, 251, 190, 192, 196, 237, 200, 202];
  const { data: players, error: pErr } = await supabase
    .from("jugadores")
    .select("id, nombre, apellidos, posicion, num_comidas, postentreno, recomendaciones_defecto, config_prepartido, alergias, intolerancias, aversiones, gustos_preferencias, objetivo")
    .in("id", targetIds)
    .order("id");

  if (pErr) console.error("Error jugadores:", pErr);
  else {
    players?.forEach((p) => {
      console.log(`\n-----------------------------------------`);
      console.log(`ID: ${p.id} | ${p.nombre} ${p.apellidos || ''}`);
      console.log(`Posición: "${p.posicion}" | Objetivo: ${p.objetivo}`);
      console.log(`Num Comidas: "${p.num_comidas}" | Post-entreno: ${p.postentreno}`);
      console.log(`Alergias: ${p.alergias || '-'} | Intolerancias: ${p.intolerancias || '-'} | Aversiones: ${p.aversiones || '-'}`);
      console.log(`Gustos / Preferencias: ${p.gustos_preferencias || '-'}`);
      console.log(`Recomendaciones Defecto:`, JSON.stringify(p.recomendaciones_defecto, null, 2));
      console.log(`Config Pre-partido:`, JSON.stringify(p.config_prepartido, null, 2));
    });
  }
}

inspectAll();
