import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: "teams" } }
);

async function checkTeamConfig() {
  const { data: teams } = await supabase.from("equipos").select("id, nombre, configuracion_nutricional");
  console.log("Teams config:", JSON.stringify(teams, null, 2));
}

checkTeamConfig();
