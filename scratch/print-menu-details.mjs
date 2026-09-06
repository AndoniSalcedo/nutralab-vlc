import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: "teams" } }
);

async function printMenu() {
  const { data: menus } = await supabase
    .from("menu_semanal")
    .select("*")
    .order("id", { ascending: false })
    .limit(2);

  menus?.forEach((m) => {
    console.log(`\n========================================`);
    console.log(`ID: ${m.id} | Semana: ${m.semana} | EquipoID: ${m.equipo_id}`);
    m.dias?.forEach((d) => {
      console.log(`\n--- ${d.dia} ---`);
      console.log(`COMIDA:`);
      console.log(`  1º: ${d.comida?.primero}`);
      console.log(`  2º: ${d.comida?.segundo}`);
      console.log(`  Postre: ${d.comida?.postre}`);
      console.log(`CENA:`);
      console.log(`  1º: ${d.cena?.primero}`);
      console.log(`  2º: ${d.cena?.segundo}`);
      console.log(`  Postre: ${d.cena?.postre}`);
    });
  });
}

printMenu();
