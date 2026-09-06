import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: process.env.SUPABASE_SCHEMA || "teams" } }
);

async function inspectMenuAndFirstPlayers() {
  console.log("=== MENÚS SEMANALES ===");
  const { data: menus } = await supabase
    .from("menus_semanales")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  menus?.forEach((m) => {
    console.log(`\n========================================`);
    console.log(`ID: ${m.id} | Semana: ${m.semana} | Equipo: ${m.equipo_id}`);
    console.log(JSON.stringify(m.dias, null, 2));
  });

  console.log("\n=== ARNAU, DANI, DAVID ===");
  const { data: players } = await supabase
    .from("jugadores")
    .select("id, nombre, apellidos, posicion, num_comidas, postentreno, recomendaciones_defecto, config_prepartido, alergias, intolerancias, aversiones, gustos_preferencias, objetivo")
    .in("id", [185, 209, 217, 237, 251, 190, 192, 196, 200, 202]); // Let's check IDs

  players?.forEach(p => {
    console.log(`\nID: ${p.id} | ${p.nombre} ${p.apellidos}`);
    console.log(`Posicion: ${p.posicion} | Num Comidas: ${p.num_comidas} | Post-entreno: ${p.postentreno}`);
    console.log(`Alergias: ${p.alergias} | Intolerancias: ${p.intolerancias} | Aversiones: ${p.aversiones}`);
    console.log(`Recomendaciones Defecto:`, p.recomendaciones_defecto);
    console.log(`Config Pre-partido:`, JSON.stringify(p.config_prepartido, null, 2));
  });
}

inspectMenuAndFirstPlayers();
