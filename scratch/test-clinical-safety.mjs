import { getMenuMealOptions, buildMealAssemblySpec } from "../lib/ai/plan-generator.js";
import { calibrateMeal } from "../lib/nutrition/calculator.js";

async function runTests() {
  console.log("=== TEST 1: filterDishOptionsByRestrictions & getMenuMealOptions ===");
  const jesusVazquez = {
    id: 192,
    nombre: "Jesús",
    apellidos: "Vázquez",
    intolerancias: "Pescado",
    aversiones: "espiancas, cebolla pochada"
  };

  const mockMenu = {
    dias: [
      {
        dia: "miercoles",
        cena: {
          primero: "Ensalada de patata alemana",
          segundo: "Merluza con brunoise de verduras",
          postre: "Fruta y yogures proteicos"
        }
      },
      {
        dia: "sabado",
        cena: {
          primero: "Noodles de arroz",
          segundo: "Gambas al curry / Tallarines de verduras",
          postre: "Fruta y yogures proteicos"
        }
      },
      {
        dia: "lunes",
        comida: {
          primero: "Crema de calabacín / Gazpacho",
          segundo: "Pollo asado / Sepia plancha / Verduras wok",
          postre: "Fruta y yogures proteicos"
        }
      }
    ]
  };

  const miercolesCena = getMenuMealOptions(mockMenu, "miercoles", "cena", jesusVazquez);
  console.log("Miércoles Cena (Jesús Vázquez):", miercolesCena);
  if (miercolesCena.hasCriticalConflict && miercolesCena.description.includes("ATENCIÓN CLÍNICA OBLIGATORIA")) {
    console.log("✅ PASS: Miércoles cena detecta el conflicto crítico de Merluza y exige sustitución.");
  } else {
    console.error("❌ FAIL: Miércoles cena no detectó el conflicto.");
  }

  const sabadoCena = getMenuMealOptions(mockMenu, "sabado", "cena", jesusVazquez);
  console.log("Sábado Cena (Jesús Vázquez):", sabadoCena);
  if (sabadoCena.description.includes("Tallarines de verduras") && !sabadoCena.description.includes("Gambas al curry")) {
    console.log("✅ PASS: Sábado cena filtró las gambas manteniendo los tallarines de verduras.");
  } else if (sabadoCena.hasCriticalConflict) {
    console.log("✅ PASS: Sábado cena detectó el conflicto con gambas.");
  }

  const lunesComida = getMenuMealOptions(mockMenu, "lunes", "comida", jesusVazquez);
  console.log("Lunes Comida (Jesús Vázquez):", lunesComida);
  if (!lunesComida.description.includes("Sepia") && lunesComida.description.includes("Pollo asado")) {
    console.log("✅ PASS: Lunes comida filtró la sepia y mantuvo el pollo asado y verduras wok.");
  } else {
    console.error("❌ FAIL: Lunes comida no filtró la sepia.");
  }

  console.log("\n=== TEST 2: Deterministic Safety Guard in calibrateMeal ===");
  const target = { p: 40, hc: 60, g: 15 };
  const mealWithFish = "Ensalada de patata alemana, Merluza 185g, Brócoli 100g, AOVE 10g";
  const calibratedFish = await calibrateMeal(mealWithFish, target, { isFishIntolerant: true });
  console.log("Calibrado con pescado ->", calibratedFish);
  if (!calibratedFish.toLowerCase().includes("merluza") && calibratedFish.toLowerCase().includes("pollo")) {
    console.log("✅ PASS: Salvaguarda determinista sustituyó Merluza por Pechuga de pollo.");
  } else {
    console.error("❌ FAIL: Merluza no fue sustituida.");
  }

  console.log("\n=== TEST 3: Parenthesis parsing and duplicate sanitization ===");
  const mealWithParens = "Patatas splash (Patata 350g), Albóndigas de pavo (Carne picada de pavo 185g), AOVE 10g";
  const calibratedParens = await calibrateMeal(mealWithParens, target, {});
  console.log("Calibrado paréntesis ->", calibratedParens);
  if (!calibratedParens.includes("Patatas splash Patata") && !calibratedParens.includes("Albóndigas de pavo Carne picada de pavo")) {
    console.log("✅ PASS: Nombres limpios sin duplicaciones absurdas.");
  } else {
    console.error("❌ FAIL: Se encontraron duplicaciones.");
  }

  console.log("\n=== TEST 4: Dish Carb Priority over Bread in Main Meals ===");
  const targetMeal = { p: 40, hc: 70, g: 15 };
  const mealWithPotatoAndBread = "Solomillo de ternera 150g, Patata 150g, Pan blanco de barra 50g, Brócoli 100g, AOVE 10g";
  const calibratedMainMeal = await calibrateMeal(mealWithPotatoAndBread, targetMeal, { mealName: "Comida" });
  console.log("Calibrado Comida con Patata y Pan ->", calibratedMainMeal);
  
  // La patata debe haber subido (> 200g) y el pan debe estar acotado a <= 40g
  const patataMatch = calibratedMainMeal.match(/Patata\s+(\d+)g/i);
  const panMatch = calibratedMainMeal.match(/Pan blanco de barra\s+(\d+)g/i);
  const patataGrams = patataMatch ? parseInt(patataMatch[1]) : 0;
  const panGrams = panMatch ? parseInt(panMatch[1]) : 0;
  
  if (patataGrams >= 250 && panGrams <= 40) {
    console.log(`✅ PASS: La patata fue priorizada (${patataGrams}g) y el pan acotado a acompañamiento (${panGrams}g).`);
  } else {
    console.error(`❌ FAIL: Patata (${patataGrams}g) o Pan (${panGrams}g) no se calibraron con la prioridad esperada.`);
  }

  console.log("\n=== TEST 5: Snack / Merienda & Breakfast Typicality (No Hot Main Meals) ===");
  const stole = {
    id: 138,
    nombre: "Stole",
    apellidos: "Dimitrevski",
    num_comidas: 3,
    recomendaciones_defecto: {
      "Merienda": "variadas saludables"
    }
  };

  const mealBudgetsStole = [
    { nombre: "Comida", target: { kcal: 900, p: 50, hc: 100, g: 25 } },
    { nombre: "Merienda", target: { kcal: 500, p: 30, hc: 60, g: 15 } },
    { nombre: "Cena", target: { kcal: 800, p: 45, hc: 80, g: 20 } }
  ];

  const stoleAssembly = buildMealAssemblySpec({
    jugador: stole,
    dayKey: "martes",
    dayData: { tipoDia: "descanso", label: "Martes" },
    menu: { dias: [] },
    preMatchConfig: {},
    mealBudgets: mealBudgetsStole
  });

  const stoleMerienda = stoleAssembly.find(m => m.nombre === "Merienda");
  console.log("Stole Merienda assembly spec:", stoleMerienda);

  const containsHotMealKeywords = ["merluza", "pescado", "solomillo", "carne", "brócoli", "espárragos", "patata", "quinoa"].some(kw => 
    stoleMerienda.base_propuesta.toLowerCase().includes(kw)
  );

  if (!containsHotMealKeywords && stoleMerienda.base_propuesta.includes("típica y natural para este momento del día")) {
    console.log("✅ PASS: La propuesta para Stole en Merienda no contiene ejemplos concretos de platos cocinados y exige tipicidad de ingesta.");
  } else {
    console.error("❌ FAIL: La propuesta de merienda sigue conteniendo palabras clave de platos calientes o no exige tipicidad.");
  }

  console.log("\n=== TEST 6: Competing Cereal Base Purge & Compatible Combinations ===");
  const targetHc = { p: 40, hc: 95, g: 15 };

  // Caso 1: Fideuà de pescado y Arroz blanco compitiendo -> debe purgar el arroz blanco
  const mealCompeting = "Fideua de pescado 320g, Arroz blanco 100g, Melón 150g";
  const calibratedCompeting = await calibrateMeal(mealCompeting, targetHc, { mealName: "Comida" });
  console.log("Calibrado Fideuà + Arroz ->", calibratedCompeting);

  if (!calibratedCompeting.toLowerCase().includes("arroz") && calibratedCompeting.toLowerCase().includes("fideua") && calibratedCompeting.toLowerCase().includes("melón")) {
    console.log("✅ PASS: El arroz blanco fue purgado al colisionar con Fideuà de pescado, y se conservó el Melón de postre.");
  } else {
    console.error("❌ FAIL: No se purgó el arroz blanco o se perdió la fideuà/melón:", calibratedCompeting);
  }

  // Caso 2: Arroz blanco con Lentejas (combinación compatible) -> debe conservar ambos
  const mealCompatibleLegume = "Pechuga de pollo 140g, Arroz blanco 120g, Lentejas 80g, AOVE 10g";
  const calibratedCompatibleLegume = await calibrateMeal(mealCompatibleLegume, targetHc, { mealName: "Comida" });
  console.log("Calibrado Arroz + Lentejas ->", calibratedCompatibleLegume);

  if (calibratedCompatibleLegume.toLowerCase().includes("arroz") && calibratedCompatibleLegume.toLowerCase().includes("lenteja")) {
    console.log("✅ PASS: Se conservaron tanto el Arroz blanco como las Lentejas (combinación compatible).");
  } else {
    console.error("❌ FAIL: Se eliminó indebidamente una fuente compatible:", calibratedCompatibleLegume);
  }
}

runTests();
