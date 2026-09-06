import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  // Check in public and teams schema
  const { data: t1 } = await supabase.from("menus_semanales").select("id, semana, equipo_id").limit(5);
  console.log("public.menus_semanales:", t1);

  const supabaseTeams = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: "teams" } }
  );

  const { data: t2, error: e2 } = await supabaseTeams.from("menus_semanales").select("id, semana, equipo_id").limit(10);
  console.log("teams.menus_semanales:", t2, "Error:", e2);

  const { data: t3, error: e3 } = await supabaseTeams.from("menus").select("*").limit(5);
  console.log("teams.menus:", t3, "Error:", e3);

  // Search Arnau and Dani Raba player IDs
  const { data: pl } = await supabaseTeams.from("jugadores").select("id, nombre, apellidos, posicion, num_comidas").ilike("nombre", "%arnau%");
  console.log("Arnau:", pl);

  const { data: pl2 } = await supabaseTeams.from("jugadores").select("id, nombre, apellidos, posicion, num_comidas").ilike("apellidos", "%raba%");
  console.log("Dani Raba:", pl2);
}

checkTables();
