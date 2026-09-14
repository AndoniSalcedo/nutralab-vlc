import { FOODS_CRUDO, normalizeFoodName } from '../../data/foods-crudo.js';
import { diceSimilarity, STOP_WORDS } from './utils.js';

/**
 * ÁRBOL TAXONÓMICO NUTRICIONAL DE NUTRALAB
 * 
 * Permite que cualquier alimento, ingrediente o preferencia del usuario se ubique
 * al nivel de profundidad exacto:
 * - Nivel Genérico / Alto (ej. 'pasta', 'arroz', 'pan', 'leche', 'pollo', 'pescado_blanco'):
 *   Al generar el plan, se consulta el catálogo clínico del jugador y se resuelve a la hoja apta
 *   (ej. celíaco -> "Pasta sin gluten"; tolerante -> "Pasta de trigo").
 * - Nivel Específico / Corte concreto (ej. 'alitas de pollo', 'contramuslo de pollo deshuesado',
 *   'solomillo de ternera', 'secreto de cerdo'):
 *   Conserva con máxima fidelidad el corte y sus propiedades nutricionales exactas.
 */

export const FOOD_TREE = {
  id: 'raiz',
  label: 'Catálogo General',
  children: {
    // ------------------------------------------------------------------------
    // 1. PROTEÍNAS
    // ------------------------------------------------------------------------
    proteina: {
      id: 'proteina',
      label: 'Proteínas',
      keywords: ['proteina', 'proteinas', 'protes', 'prote'],
      children: {
        aves: {
          id: 'aves',
          label: 'Aves y Conejo',
          children: {
            pollo: {
              id: 'pollo',
              label: 'Pollo (Genérico)',
              isGeneric: true,
              defaultFood: 'Pechuga de pollo',
              foodNames: [
                'Pechuga de pollo',
                'Contramuslo de pollo deshuesado',
                'Alitas de pollo',
                'Carne picada de pollo',
                'Muslo de pollo',
                'Hamburguesa de pollo',
              ],
              children: {
                pechuga_pollo: {
                  id: 'pechuga_pollo',
                  label: 'Pechuga de pollo (Magro)',
                  foodNames: ['Pechuga de pollo'],
                },
                contramuslo_pollo: {
                  id: 'contramuslo_pollo',
                  label: 'Contramuslo de pollo deshuesado (Semigraso)',
                  foodNames: ['Contramuslo de pollo deshuesado'],
                },
                alitas_pollo: {
                  id: 'alitas_pollo',
                  label: 'Alitas de pollo',
                  foodNames: ['Alitas de pollo'],
                },
                carne_picada_pollo: {
                  id: 'carne_picada_pollo',
                  label: 'Carne picada de pollo',
                  foodNames: ['Carne picada de pollo'],
                },
                muslo_pollo: {
                  id: 'muslo_pollo',
                  label: 'Muslo de pollo',
                  foodNames: ['Muslo de pollo'],
                },
                hamburguesa_pollo: {
                  id: 'hamburguesa_pollo',
                  label: 'Hamburguesa de pollo',
                  foodNames: ['Hamburguesa de pollo'],
                },
              },
            },
            pavo: {
              id: 'pavo',
              label: 'Pavo (Genérico)',
              isGeneric: true,
              defaultFood: 'Pechuga de pavo',
              foodNames: [
                'Pechuga de pavo',
                'Chuletas de pavo',
                'Carne picada de pavo',
                'Hamburguesa de pavo',
              ],
              children: {
                pechuga_pavo: {
                  id: 'pechuga_pavo',
                  label: 'Pechuga de pavo',
                  foodNames: ['Pechuga de pavo'],
                },
                chuletas_pavo: {
                  id: 'chuletas_pavo',
                  label: 'Chuletas de pavo',
                  foodNames: ['Chuletas de pavo'],
                },
                carne_picada_pavo: {
                  id: 'carne_picada_pavo',
                  label: 'Carne picada de pavo',
                  foodNames: ['Carne picada de pavo'],
                },
              },
            },
            conejo: {
              id: 'conejo',
              label: 'Conejo',
              foodNames: ['Conejo'],
            },
          },
        },
        vacuno: {
          id: 'vacuno',
          label: 'Vacuno / Carne Roja',
          isGeneric: true,
          defaultFood: 'Ternera magra',
          keywords: ['carne', 'carnes', 'ternera', 'vacuno'],
          children: {
            ternera_magra: {
              id: 'ternera_magra',
              label: 'Ternera magra',
              defaultFood: 'Ternera magra',
              foodNames: [
                'Ternera magra',
                'Solomillo de ternera',
                'Carne picada de ternera',
                'Hamburguesa de ternera magra',
              ],
              children: {
                solomillo_ternera: {
                  id: 'solomillo_ternera',
                  label: 'Solomillo de ternera',
                  foodNames: ['Solomillo de ternera'],
                },
                carne_picada_ternera: {
                  id: 'carne_picada_ternera',
                  label: 'Carne picada de ternera',
                  foodNames: ['Carne picada de ternera'],
                },
              },
            },
            ternera_grasa: {
              id: 'ternera_grasa',
              label: 'Ternera cortes grasos',
              foodNames: ['Entrecot de ternera', 'Chuletón de ternera', 'Hamburguesa de ternera'],
              children: {
                entrecot_ternera: {
                  id: 'entrecot_ternera',
                  label: 'Entrecot de ternera',
                  foodNames: ['Entrecot de ternera'],
                },
                chuleton_ternera: {
                  id: 'chuleton_ternera',
                  label: 'Chuletón de ternera',
                  foodNames: ['Chuletón de ternera'],
                },
              },
            },
          },
        },
        cerdo: {
          id: 'cerdo',
          label: 'Cerdo',
          isPork: true,
          isGeneric: true,
          defaultFood: 'Solomillo de cerdo',
          children: {
            cerdo_magro: {
              id: 'cerdo_magro',
              label: 'Cerdo magro',
              foodNames: ['Solomillo de cerdo', 'Lomo embuchado'],
            },
            cerdo_graso: {
              id: 'cerdo_graso',
              label: 'Cerdo graso (Secreto/Morro)',
              foodNames: ['Secreto de cerdo', 'Morro de cerdo cocido', 'Hamburguesa de cerdo'],
              children: {
                secreto_cerdo: {
                  id: 'secreto_cerdo',
                  label: 'Secreto de cerdo',
                  foodNames: ['Secreto de cerdo'],
                },
              },
            },
            jamon_curado: {
              id: 'jamon_curado',
              label: 'Jamón curado (Serrano/Ibérico)',
              foodNames: ['Jamón serrano', 'Jamón ibérico de bellota', 'Jamón serrano curado'],
            },
            jamon_cocido: {
              id: 'jamon_cocido',
              label: 'Jamón cocido / York',
              foodNames: ['Jamón cocido', 'Jamón cocido (York)'],
            },
          },
        },
        pescado_blanco: {
          id: 'pescado_blanco',
          label: 'Pescado blanco (Genérico)',
          isFish: true,
          isGeneric: true,
          defaultFood: 'Merluza',
          keywords: ['pescado', 'pescados'],
          foodNames: [
            'Merluza',
            'Lenguado',
            'Bacalao',
            'Bacalao fresco',
            'Corvina',
            'Dorada',
            'Lubina',
            'Rape',
            'Rodaballo',
          ],
          children: {
            merluza: {
              id: 'merluza',
              label: 'Merluza',
              foodNames: ['Merluza'],
            },
            lenguado: {
              id: 'lenguado',
              label: 'Lenguado',
              foodNames: ['Lenguado'],
            },
            bacalao: {
              id: 'bacalao',
              label: 'Bacalao',
              foodNames: ['Bacalao', 'Bacalao fresco', 'Bacalao desalado'],
            },
            rape: {
              id: 'rape',
              label: 'Rape',
              foodNames: ['Rape'],
            },
            corvina: {
              id: 'corvina',
              label: 'Corvina',
              foodNames: ['Corvina'],
            },
            dorada: {
              id: 'dorada',
              label: 'Dorada',
              foodNames: ['Dorada'],
            },
            lubina: {
              id: 'lubina',
              label: 'Lubina',
              foodNames: ['Lubina'],
            },
          },
        },
        pescado_azul: {
          id: 'pescado_azul',
          label: 'Pescado azul (Genérico)',
          isFish: true,
          isGeneric: true,
          defaultFood: 'Salmón',
          foodNames: [
            'Salmón',
            'Salmón fresco',
            'Salmón ahumado',
            'Atún fresco',
            'Emperador (pez espada)',
            'Sardina',
            'Caballa',
          ],
          children: {
            salmon: {
              id: 'salmon',
              label: 'Salmón',
              foodNames: ['Salmón', 'Salmón fresco', 'Salmón ahumado'],
            },
            atun_fresco: {
              id: 'atun_fresco',
              label: 'Atún fresco',
              foodNames: ['Atún fresco'],
            },
            emperador: {
              id: 'emperador',
              label: 'Emperador (pez espada)',
              foodNames: ['Emperador (pez espada)'],
            },
          },
        },
        marisco: {
          id: 'marisco',
          label: 'Marisco',
          isSeafood: true,
          isGeneric: true,
          defaultFood: 'Sepia',
          children: {
            sepia: { id: 'sepia', label: 'Sepia', foodNames: ['Sepia'] },
            calamar: { id: 'calamar', label: 'Calamar', foodNames: ['Calamar'] },
            pulpo: { id: 'pulpo', label: 'Pulpo', foodNames: ['Pulpo'] },
            gambas: { id: 'gambas', label: 'Gambas', foodNames: ['Gambas'] },
            mejillones: { id: 'mejillones', label: 'Mejillones', foodNames: ['Mejillones frescos'] },
          },
        },
        huevos: {
          id: 'huevos',
          label: 'Huevos',
          defaultFood: 'Huevo entero',
          keywords: ['huevo', 'huevos', 'tortilla'],
          children: {
            huevo_entero: { id: 'huevo_entero', label: 'Huevo entero', foodNames: ['Huevo entero', 'Huevo entero tortilla'] },
            claras_huevo: { id: 'claras_huevo', label: 'Claras de huevo', foodNames: ['Claras de huevo'] },
          },
        },
        conservas_pescado: {
          id: 'conservas_pescado',
          label: 'Conservas de pescado (Desayunos/Meriendas)',
          children: {
            atun_conserva: {
              id: 'atun_conserva',
              label: 'Atún en conserva',
              foodNames: ['Atún natural', 'Atún natural conserva natural', 'Atún natural conserva aceite'],
            },
            caballa_conserva: {
              id: 'caballa_conserva',
              label: 'Caballa en conserva',
              foodNames: ['Caballa en conserva (al natural)'],
            },
          },
        },
        vegetal_proteina: {
          id: 'vegetal_proteina',
          label: 'Proteína vegetal',
          children: {
            tofu: { id: 'tofu', label: 'Tofu firme', foodNames: ['Tofu firme'] },
            seitan: { id: 'seitan', label: 'Seitán', foodNames: ['Seitán'] },
            soja_texturizada: { id: 'soja_texturizada', label: 'Soja texturizada', foodNames: ['Soja texturizada'] },
          },
        },
      },
    },

    // ------------------------------------------------------------------------
    // 2. HIDRATOS
    // ------------------------------------------------------------------------
    hidratos: {
      id: 'hidratos',
      label: 'Hidratos de Carbono',
      keywords: ['hidrato', 'hidratos', 'carbohidrato', 'carbohidratos', 'carbo', 'carbos', 'hc', 'ch'],
      children: {
        pasta: {
          id: 'pasta',
          label: 'Pasta (Grupo genérico)',
          isGeneric: true,
          keywords: ['pasta', 'pastas', 'macarron', 'macarrones', 'espagueti', 'espaguetis', 'fideos'],
          foodNames: ['Pasta de trigo', 'Pasta sin gluten', 'Pasta de lenteja roja'],
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('pasta sin gluten') && !catalog.foodsByNormalizedName.has('pasta de trigo')) {
              return 'Pasta sin gluten';
            }
            return 'Pasta de trigo';
          },
          children: {
            pasta_trigo: { id: 'pasta_trigo', label: 'Pasta de trigo', foodNames: ['Pasta de trigo'] },
            pasta_sin_gluten: { id: 'pasta_sin_gluten', label: 'Pasta sin gluten', foodNames: ['Pasta sin gluten'] },
            pasta_lenteja: { id: 'pasta_lenteja', label: 'Pasta de lenteja roja', foodNames: ['Pasta de lenteja roja'] },
          },
        },
        arroz: {
          id: 'arroz',
          label: 'Arroz (Grupo genérico)',
          isGeneric: true,
          defaultFood: 'Arroz blanco',
          foodNames: ['Arroz blanco', 'Arroz basmati', 'Arroz jazmín', 'Arroz integral'],
          resolve(_catalog) {
            return 'Arroz blanco';
          },
          children: {
            arroz_blanco: { id: 'arroz_blanco', label: 'Arroz blanco', foodNames: ['Arroz blanco'] },
            arroz_basmati: { id: 'arroz_basmati', label: 'Arroz basmati', foodNames: ['Arroz basmati'] },
            arroz_integral: { id: 'arroz_integral', label: 'Arroz integral', foodNames: ['Arroz integral'] },
          },
        },
        tuberculos: {
          id: 'tuberculos',
          label: 'Tubérculos',
          defaultFood: 'Patata',
          children: {
            patata: { id: 'patata', label: 'Patata', foodNames: ['Patata', 'Ñoquis de patata'] },
            boniato: { id: 'boniato', label: 'Boniato / Batata', foodNames: ['Boniato'] },
            yuca: { id: 'yuca', label: 'Yuca', foodNames: ['Yuca'] },
          },
        },
        panes: {
          id: 'panes',
          label: 'Panes (Grupo genérico)',
          isGeneric: true,
          keywords: ['pan', 'panes', 'tostada', 'tostadas', 'biscote'],
          foodNames: [
            'Pan blanco de barra',
            'Pan de molde blanco',
            'Pan integral',
            'Pan de molde integral',
            'Pan sin gluten',
            'Pan de centeno',
            'Tostadas integrales (biscotes)',
          ],
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('pan sin gluten') && !catalog.foodsByNormalizedName.has('pan blanco de barra')) {
              return 'Pan sin gluten';
            }
            return 'Pan integral';
          },
          children: {
            pan_blanco: { id: 'pan_blanco', label: 'Pan blanco', foodNames: ['Pan blanco de barra', 'Pan de molde blanco'] },
            pan_integral: { id: 'pan_integral', label: 'Pan integral', foodNames: ['Pan integral', 'Pan de molde integral'] },
            pan_sin_gluten: { id: 'pan_sin_gluten', label: 'Pan sin gluten', foodNames: ['Pan sin gluten'] },
          },
        },
        otros_granos: {
          id: 'otros_granos',
          label: 'Otros granos y cereales',
          children: {
            cuscus: { id: 'cuscus', label: 'Cuscús', foodNames: ['Cuscús'] },
            quinoa: { id: 'quinoa', label: 'Quinoa', foodNames: ['Quinoa'] },
            fideos_arroz: { id: 'fideos_arroz', label: 'Fideos de arroz', foodNames: ['Fideos de arroz'] },
            avena: { id: 'avena', label: 'Avena (Copos)', foodNames: ['Copos de avena', 'Copos de avena sin gluten'] },
          },
        },
        legumbres: {
          id: 'legumbres',
          label: 'Legumbres',
          children: {
            lentejas: { id: 'lentejas', label: 'Lentejas', foodNames: ['Lenteja'] },
            garbanzos: { id: 'garbanzos', label: 'Garbanzos', foodNames: ['Garbanzo'] },
            alubias: { id: 'alubias', label: 'Alubias', foodNames: ['Alubia blanca'] },
          },
        },
      },
    },

    // ------------------------------------------------------------------------
    // 3. FRUTAS
    // ------------------------------------------------------------------------
    frutas: {
      id: 'frutas',
      label: 'Frutas',
      keywords: ['fruta', 'frutas'],
      children: {
        alta_energia: {
          id: 'alta_energia',
          label: 'Frutas alta energía (Prepartido / Carga)',
          children: {
            platano: { id: 'platano', label: 'Plátano', foodNames: ['Plátano'] },
            datil: { id: 'datil', label: 'Dátil', foodNames: ['Dátil', 'Pasta de Dátil'] },
            uvas: { id: 'uvas', label: 'Uvas', foodNames: ['Uvas'] },
            mango: { id: 'mango', label: 'Mango', foodNames: ['Mango'] },
          },
        },
        citricas: {
          id: 'citricas',
          label: 'Frutas cítricas y digestivas',
          children: {
            naranja: { id: 'naranja', label: 'Naranja', foodNames: ['Naranja', 'Zumo de naranja natural'] },
            mandarina: { id: 'mandarina', label: 'Mandarina', foodNames: ['Mandarina'] },
            kiwi: { id: 'kiwi', label: 'Kiwi', foodNames: ['Kiwi'] },
            pina: { id: 'pina', label: 'Piña', foodNames: ['Piña pelada'] },
          },
        },
        antioxidantes_rojas: {
          id: 'antioxidantes_rojas',
          label: 'Frutos rojos y antioxidantes',
          children: {
            fresas: { id: 'fresas', label: 'Fresas', foodNames: ['Fresas'] },
            arandanos: { id: 'arandanos', label: 'Arándanos', foodNames: ['Arándanos'] },
            frambuesa: { id: 'frambuesa', label: 'Frambuesas', foodNames: ['Frambuesa'] },
          },
        },
        clasicas_agua: {
          id: 'clasicas_agua',
          label: 'Frutas clásicas y de agua',
          children: {
            manzana: { id: 'manzana', label: 'Manzana', foodNames: ['Manzana'] },
            pera: { id: 'pera', label: 'Pera', foodNames: ['Pera'] },
            sandia: { id: 'sandia', label: 'Sandía', foodNames: ['Sandía'] },
            melon: { id: 'melon', label: 'Melón', foodNames: ['Melón'] },
          },
        },
      },
    },

    // ------------------------------------------------------------------------
    // 4. VERDURAS
    // ------------------------------------------------------------------------
    verduras: {
      id: 'verduras',
      label: 'Verduras y Hortalizas',
      keywords: ['vegetal', 'vegetales', 'verdura', 'verduras', 'hortaliza', 'hortalizas'],
      children: {
        digestivas_suaves: {
          id: 'digestivas_suaves',
          label: 'Digestivas suaves (Prepartido / Carga)',
          children: {
            calabacin: { id: 'calabacin', label: 'Calabacín', foodNames: ['Calabacín'] },
            zanahoria: { id: 'zanahoria', label: 'Zanahoria', foodNames: ['Zanahoria'] },
            pimiento_verde: { id: 'pimiento_verde', label: 'Pimiento verde', foodNames: ['Pimiento', 'Pimiento verde'] },
          },
        },
        mediterraneas: {
          id: 'mediterraneas',
          label: 'Mediterráneas',
          children: {
            tomate: { id: 'tomate', label: 'Tomate', foodNames: ['Tomate', 'Tomate frito'] },
            berenjena: { id: 'berenjena', label: 'Berenjena', foodNames: ['Berenjena'] },
            cebolla: { id: 'cebolla', label: 'Cebolla', foodNames: ['Cebolla'] },
            puerro: { id: 'puerro', label: 'Puerro', foodNames: ['Puerro'] },
          },
        },
        hojas_verdes: {
          id: 'hojas_verdes',
          label: 'Hojas verdes y ensaladas',
          keywords: ['ensalada', 'ensaladas'],
          children: {
            espinaca: { id: 'espinaca', label: 'Espinacas', foodNames: ['Espinaca'] },
            rucula: { id: 'rucula', label: 'Rúcula', foodNames: ['Rúcula'] },
            lechuga: { id: 'lechuga', label: 'Lechuga romana', foodNames: ['Lechuga romana'] },
            pepino: { id: 'pepino', label: 'Pepino', foodNames: ['Pepino'] },
          },
        },
        cruciferas: {
          id: 'cruciferas',
          label: 'Crucíferas (Descanso / Postentreno)',
          children: {
            brocoli: { id: 'brocoli', label: 'Brócoli', foodNames: ['Brócoli'] },
            coliflor: { id: 'coliflor', label: 'Coliflor', foodNames: ['Coliflor'] },
          },
        },
        otras_verduras: {
          id: 'otras_verduras',
          label: 'Otras verduras',
          children: {
            champinon: { id: 'champinon', label: 'Champiñón / Setas', foodNames: ['Champiñón'] },
            esparragos: { id: 'esparragos', label: 'Espárragos verdes', foodNames: ['Espárragos verdes'] },
            judias_verdes: { id: 'judias_verdes', label: 'Judías verdes', foodNames: ['Judías verdes'] },
          },
        },
      },
    },

    // ------------------------------------------------------------------------
    // 5. GRASAS Y LÁCTEOS
    // ------------------------------------------------------------------------
    grasas_y_lacteos: {
      id: 'grasas_y_lacteos',
      label: 'Grasas saludables y Lácteos',
      children: {
        aceites: {
          id: 'aceites',
          label: 'Aceites',
          keywords: ['grasa', 'grasas', 'aceite', 'aceites'],
          children: {
            aove: { id: 'aove', label: 'AOVE', foodNames: ['AOVE'] },
          },
        },
        aguacate: {
          id: 'aguacate',
          label: 'Aguacate',
          foodNames: ['Aguacate'],
        },
        frutos_secos: {
          id: 'frutos_secos',
          label: 'Frutos secos',
          children: {
            nueces: { id: 'nueces', label: 'Nueces', foodNames: ['Nueces'] },
            almendras: { id: 'almendras', label: 'Almendras', foodNames: ['Almendras'] },
            crema_cacahuete: { id: 'crema_cacahuete', label: 'Crema de cacahuete', foodNames: ['Crema de cacahuete natural (100% cacahuete)'] },
          },
        },
        leches: {
          id: 'leches',
          label: 'Leches (Grupo genérico)',
          isGeneric: true,
          foodNames: [
            'Leche semidesnatada',
            'Leche entera',
            'Leche entera sin lactosa',
            'Leche de avena',
            'Leche de soja sin azúcar',
            'Leche de almendra sin azúcar',
          ],
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('leche entera sin lactosa')) return 'Leche entera sin lactosa';
            if (catalog.foodsByNormalizedName.has('leche de avena')) return 'Leche de avena';
            return 'Leche semidesnatada';
          },
        },
        yogures: {
          id: 'yogures',
          label: 'Yogures (Grupo genérico)',
          isGeneric: true,
          keywords: ['yogur', 'yogures', 'lacteo', 'lacteos'],
          foodNames: [
            'Yogur natural',
            'Yogur proteico natural',
            'Yogur natural sin lactosa',
            'Yogur proteico sin lactosa',
            'Yogur griego natural',
          ],
          resolve(catalog) {
            if (catalog.foodsByNormalizedName.has('yogur proteico natural')) return 'Yogur proteico natural';
            return 'Yogur natural';
          },
        },
      },
    },

    // ------------------------------------------------------------------------
    // 6. BEBIDAS E HIDRATACIÓN
    // ------------------------------------------------------------------------
    bebidas: {
      id: 'bebidas',
      label: 'Bebidas e Hidratación',
      children: {
        agua: {
          id: 'agua',
          label: 'Agua mineral',
          foodNames: ['Agua mineral', 'Agua'],
          defaultFood: 'Agua mineral',
        },
        cafe: {
          id: 'cafe',
          label: 'Café solo o con leche',
          foodNames: ['Café solo'],
        },
        infusiones: {
          id: 'infusiones',
          label: 'Infusiones digestivas',
          foodNames: ['Té verde', 'Manzanilla'],
        },
      },
    },

    // ------------------------------------------------------------------------
    // 7. SUPLEMENTACIÓN Y PROTOCOLOS
    // ------------------------------------------------------------------------
    suplementos: {
      id: 'suplementos',
      label: 'Suplementos y Protocolos',
      children: {
        ensure: {
          id: 'ensure',
          label: 'Ensure Nutrición Entera',
          foodNames: ['Ensure Nutrición Entera 1 unidad', 'Ensure'],
          defaultFood: 'Ensure Nutrición Entera 1 unidad',
        },
        recovery: {
          id: 'recovery',
          label: 'Recovery y Fruta',
          foodNames: ['Recovery y fruta', 'Recovery'],
          defaultFood: 'Recovery y fruta',
        },
      },
    },
  },
};

// Índice plano de nodos por id y por alias para búsqueda en O(1)
const FLAT_NODE_INDEX = new Map();

function indexTreeNodes(node) {
  if (!node || !node.id) return;
  FLAT_NODE_INDEX.set(node.id.toLowerCase(), node);
  if (node.label) {
    FLAT_NODE_INDEX.set(normalizeFoodName(node.label), node);
  }
  if (Array.isArray(node.foodNames)) {
    node.foodNames.forEach((fn) => {
      FLAT_NODE_INDEX.set(normalizeFoodName(fn), node);
    });
  }
  if (Array.isArray(node.keywords)) {
    node.keywords.forEach((kw) => {
      FLAT_NODE_INDEX.set(normalizeFoodName(kw), node);
      FLAT_NODE_INDEX.set(kw.toLowerCase().trim(), node);
    });
  }
  if (node.children) {
    Object.values(node.children).forEach((child) => indexTreeNodes(child));
  }
}

indexTreeNodes(FOOD_TREE);

// Asegurar que TODOS los alimentos limpios de FOODS_CRUDO estén en FLAT_NODE_INDEX
// como hojas específicas del árbol para máxima fidelidad
FOODS_CRUDO.forEach((food) => {
  const norm = food.normalizedName;
  if (!FLAT_NODE_INDEX.has(norm)) {
    const leafNode = {
      id: norm.replace(/\s+/g, '_'),
      label: food.name,
      foodNames: [food.name],
      isLeaf: true,
      category: food.category,
      foodData: food,
    };
    FLAT_NODE_INDEX.set(norm, leafNode);
    FLAT_NODE_INDEX.set(food.name.toLowerCase(), leafNode);
  }
});

/**
 * Busca un nodo en el árbol por su id o por el nombre de un alimento.
 * Utiliza coincidencia exacta O(1), tokenización filtrando STOP_WORDS y similitud Sørensen-Dice.
 */
export function findTreeNode(idOrName) {
  if (!idOrName) return null;
  const norm = normalizeFoodName(idOrName);
  const low = idOrName.toLowerCase().trim();

  // 1. Coincidencia exacta O(1)
  const exact = FLAT_NODE_INDEX.get(norm) || FLAT_NODE_INDEX.get(low);
  if (exact) return exact;

  // 2. Coincidencia por tokens significativos (filtrando STOP_WORDS)
  const queryTokens = norm.split(' ').filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  if (queryTokens.length > 0) {
    if (queryTokens.length === 1) {
      const singleMatch = FLAT_NODE_INDEX.get(queryTokens[0]);
      if (singleMatch) return singleMatch;
    }

    // Buscar si los tokens significativos están contenidos exactamente en algún nodo/alimento
    for (const [key, node] of FLAT_NODE_INDEX.entries()) {
      const keyTokens = key.split(' ').filter((t) => t.length > 2 && !STOP_WORDS.has(t));
      if (queryTokens.length <= keyTokens.length && queryTokens.every((qt) => keyTokens.includes(qt))) {
        return node;
      }
    }
  }

  // 3. Similitud difusa Sørensen-Dice (variaciones morfológicas, plurales/singulares)
  let bestNode = null;
  let bestScore = 0;

  for (const [key, node] of FLAT_NODE_INDEX.entries()) {
    const score = diceSimilarity(norm, key);
    if (score > bestScore) {
      bestScore = score;
      bestNode = node;
      if (score === 1.0) break;
    }
  }

  if (bestScore >= 0.75) {
    return bestNode;
  }

  return null;
}

/**
 * Resuelve deterministamente un nodo del árbol para un jugador según su catálogo clínico.
 * 
 * - Si el nodo es genérico de nivel alto (ej. 'pasta', 'panes', 'leches'):
 *   Aplica la función resolve o busca el primer alimento candidato disponible en el catálogo del jugador
 *   (ej: si es celíaco, resolverá a "Pasta sin gluten"; si tolera, a "Pasta de trigo").
 * 
 * - Si el nodo es específico (ej. 'alitas_pollo', 'contramuslo_pollo', 'solomillo_ternera'):
 *   Devuelve el alimento exacto del catálogo oficial si está permitido en la ficha del jugador.
 */
export function resolveNodeForPlayer(nodeOrId, clinicalCatalog) {
  if (!nodeOrId) return null;
  const node = typeof nodeOrId === 'string' ? findTreeNode(nodeOrId) : nodeOrId;
  if (!node) {
    if (clinicalCatalog && clinicalCatalog.foodsByNormalizedName?.has(normalizeFoodName(nodeOrId))) {
      return clinicalCatalog.foodsByNormalizedName.get(normalizeFoodName(nodeOrId)).name;
    }
    return null;
  }

  // Si tiene función de resolución propia (ej. pasta, panes, leches)
  if (typeof node.resolve === 'function' && clinicalCatalog) {
    const resolvedName = node.resolve(clinicalCatalog);
    if (resolvedName && (!clinicalCatalog || clinicalCatalog.foodsByNormalizedName.has(normalizeFoodName(resolvedName)))) {
      return resolvedName;
    }
  }

  // Si tiene lista de alimentos candidatos
  if (Array.isArray(node.foodNames) && node.foodNames.length > 0) {
    if (!clinicalCatalog) return node.foodNames[0];

    // Buscar el primer alimento de la lista que exista en el catálogo del jugador
    for (const foodName of node.foodNames) {
      const norm = normalizeFoodName(foodName);
      if (clinicalCatalog.foodsByNormalizedName.has(norm)) {
        return foodName;
      }
    }
  }

  // Si es un nodo de nivel superior con hijos (ej. 'pescado_blanco'), buscar en sus hijos
  if (node.children) {
    for (const child of Object.values(node.children)) {
      const childResolved = resolveNodeForPlayer(child, clinicalCatalog);
      if (childResolved) return childResolved;
    }
  }

  if (node.defaultFood) {
    if (!clinicalCatalog) return node.defaultFood;
    const normDefault = normalizeFoodName(node.defaultFood);
    if (clinicalCatalog.foodsByNormalizedName.has(normDefault)) {
      return node.defaultFood;
    }
  }

  return null;
}

/**
 * Resuelve todos los ingredientes de un plato desglosado para el perfil clínico de un jugador.
 * - Si contiene un ingrediente prohibido que no tiene alternativa (ej. cerdo para sin_cerdo, pescado para sin_pescado):
 *   devuelve { safe: false, reason: '...' }
 * - Si contiene un nodo genérico (ej. 'pasta', 'pan', 'pollo'):
 *   lo resuelve al nivel adecuado según las tolerancias clínicas del jugador (ej. 'pasta' -> 'Pasta sin gluten').
 * - Si contiene un nodo específico (ej. 'alitas de pollo', 'contramuslo'):
 *   mantiene el corte exacto.
 */
export function resolveDishIngredientsForPlayer(decomposedDish, clinicalCatalog) {
  if (!decomposedDish) return { safe: false, items: [], reason: 'Plato no especificado' };

  const resolvedItems = [];

  // 1. Hidrato (ej: 'pasta' -> 'Pasta sin gluten' para celíacos)
  if (decomposedDish.hidrato) {
    const resolvedHidrato = resolveNodeForPlayer(decomposedDish.hidrato, clinicalCatalog);
    if (!resolvedHidrato) {
      return {
        safe: false,
        dishName: decomposedDish.nombre,
        items: [],
        reason: `Hidrato no apto para el jugador (${decomposedDish.hidrato})`,
      };
    }
    resolvedItems.push(resolvedHidrato);
  }

  // 2. Proteína (corte específico como 'alitas de pollo', o genérico como 'pollo')
  const proteinaList = Array.isArray(decomposedDish.proteina)
    ? decomposedDish.proteina
    : decomposedDish.proteina ? [decomposedDish.proteina] : [];

  for (const prot of proteinaList) {
    if (!prot) continue;
    const resolvedProt = resolveNodeForPlayer(prot, clinicalCatalog);
    if (!resolvedProt) {
      return {
        safe: false,
        dishName: decomposedDish.nombre,
        items: [],
        reason: `Proteína no tolerada para el jugador (${prot})`,
      };
    }
    resolvedItems.push(resolvedProt);
  }

  // 3. Verduras
  const verduraList = Array.isArray(decomposedDish.verdura)
    ? decomposedDish.verdura
    : decomposedDish.verdura ? [decomposedDish.verdura] : [];

  for (const verd of verduraList) {
    if (!verd) continue;
    const resolvedVerd = resolveNodeForPlayer(verd, clinicalCatalog);
    if (resolvedVerd) {
      resolvedItems.push(resolvedVerd);
    }
  }

  // 4. Grasa saludable
  if (decomposedDish.grasa) {
    const resolvedGrasa = resolveNodeForPlayer(decomposedDish.grasa, clinicalCatalog) || 'Aceite de oliva virgen extra';
    resolvedItems.push(resolvedGrasa);
  }

  // 5. Frutas (ej: postre o fruta fresca)
  const frutaList = Array.isArray(decomposedDish.fruta)
    ? decomposedDish.fruta
    : decomposedDish.fruta ? [decomposedDish.fruta] : [];

  for (const fru of frutaList) {
    if (!fru) continue;
    const resolvedFru = resolveNodeForPlayer(fru, clinicalCatalog) || fru;
    if (resolvedFru) {
      resolvedItems.push(resolvedFru);
    }
  }

  // 6. Lácteos y Yogures
  const lacteoList = Array.isArray(decomposedDish.lacteo)
    ? decomposedDish.lacteo
    : decomposedDish.lacteo ? [decomposedDish.lacteo] : [];

  for (const lac of lacteoList) {
    if (!lac) continue;
    const resolvedLac = resolveNodeForPlayer(lac, clinicalCatalog) || lac;
    if (resolvedLac) {
      resolvedItems.push(resolvedLac);
    }
  }

  return {
    safe: true,
    dishName: decomposedDish.nombre,
    items: resolvedItems,
  };
}

/**
 * Devuelve las ramas por defecto del Árbol Completo para una toma determinada.
 */
export function getCompleteMealBranches(mealName = 'Comida', _clinicalCatalog = null, _player = null, isPreMatch = false) {
  const norm = String(mealName || '').toLowerCase();

  if (norm.includes('desayuno')) {
    return [
      { id: 'panes', label: 'Panes y cereales', isGeneric: true, category: 'hidratos' },
      { id: 'huevos', label: 'Proteínas de desayuno (Huevos / Pavo)', isGeneric: true, category: 'proteina' },
      { id: 'frutas', label: 'Fruta fresca', isGeneric: true, category: 'frutas' },
      { id: 'aceites', label: 'Grasa saludable (AOVE / Aguacate)', isGeneric: true, category: 'grasas' },
    ];
  }

  if (norm.includes('merienda') || norm.includes('snack') || norm.includes('almuerzo')) {
    return [
      { id: 'frutas', label: 'Fruta fresca', isGeneric: true, category: 'frutas' },
      { id: 'yogures', label: 'Yogur / Lácteo proteico', isGeneric: true, category: 'lacteos' },
      { id: 'frutos_secos', label: 'Frutos secos / Tostada', isGeneric: true, category: 'grasas' },
    ];
  }

  // Comida o Cena
  if (isPreMatch) {
    return [
      { id: 'hidratos', label: 'Carbohidrato digestivo (Arroz / Pasta)', isGeneric: true, category: 'hidratos' },
      { id: 'proteina', label: 'Proteína magra limpia (Pollo / Pavo)', isGeneric: true, category: 'proteina' },
      { id: 'verduras', label: 'Verdura suave (Calabacín / Zanahoria)', isGeneric: true, category: 'verduras' },
      { id: 'frutas', label: 'Fruta digestiva (Plátano / Manzana)', isGeneric: true, category: 'frutas' },
    ];
  }

  return [
    { id: 'hidratos', label: 'Hidratos de carbono', isGeneric: true, category: 'hidratos' },
    { id: 'proteina', label: 'Proteínas', isGeneric: true, category: 'proteina' },
    { id: 'verduras', label: 'Verduras y hortalizas', isGeneric: true, category: 'verduras' },
    { id: 'frutas', label: 'Fruta fresca de temporada', isGeneric: true, category: 'frutas' },
  ];
}

/**
 * Parsea y genera el Árbol Nutricional a partir de un texto introducido en el perfil del jugador.
 * Detecta si es un árbol completo (variadas / vacío), valida restricciones clínicas y detecta términos no reconocidos.
 */
export function buildMealTree(text, mealName = 'Comida', clinicalCatalog = null, player = null, isPreMatch = false) {
  if (text && typeof text === 'object') {
    if (Array.isArray(text.branches)) return text;
    if (text.tree && Array.isArray(text.tree.branches)) return text.tree;

    // Si ya viene estructurado por categorías tipadas (nuevo estándar)
    if (text.isComplete !== undefined || text.proteina !== undefined || text.hidrato !== undefined) {
      if (text.isComplete) {
        const branches = getCompleteMealBranches(mealName, clinicalCatalog, player, isPreMatch);
        return {
          ...text,
          isComplete: true,
          branches,
          unrecognized: text.unrecognized || [],
          conflicts: [],
          isValid: true,
          label: text.label || `Árbol completo (${branches.map((b) => b.label).join(' + ')})`,
        };
      }

      const items = [
        ...(Array.isArray(text.hidrato) ? text.hidrato : text.hidrato ? [text.hidrato] : []),
        ...(Array.isArray(text.proteina) ? text.proteina : text.proteina ? [text.proteina] : []),
        ...(Array.isArray(text.verdura) ? text.verdura : text.verdura ? [text.verdura] : []),
        ...(Array.isArray(text.fruta) ? text.fruta : text.fruta ? [text.fruta] : []),
        ...(Array.isArray(text.lacteo) ? text.lacteo : text.lacteo ? [text.lacteo] : []),
        ...(text.grasa && text.grasa !== 'Sin grasa añadida' ? [text.grasa] : []),
      ];

      const branches = [];
      const seenIds = new Set();
      for (const item of items) {
        const node = findTreeNode(item);
        if (node) {
          const nodeId = node.id.toLowerCase();
          if (!seenIds.has(nodeId)) {
            seenIds.add(nodeId);
            branches.push({
              id: node.id,
              label: node.label,
              isGeneric: Boolean(node.isGeneric || !node.isLeaf),
              category: node.id,
              foodName: Array.isArray(node.foodNames) && node.foodNames.length > 0 ? node.foodNames[0] : node.label,
            });
          }
        } else {
          const normKey = String(item).toLowerCase();
          if (!seenIds.has(normKey)) {
            seenIds.add(normKey);
            branches.push({
              id: normKey,
              label: item,
              isGeneric: false,
              category: 'especifico',
              foodName: item,
            });
          }
        }
      }

      const fallbackBranches = branches.length > 0 ? branches : getCompleteMealBranches(mealName, clinicalCatalog, player, isPreMatch);
      const isStillComplete = branches.length === 0;

      return {
        ...text,
        isComplete: isStillComplete,
        branches: fallbackBranches,
        unrecognized: text.unrecognized || [],
        conflicts: [],
        isValid: true,
        label: text.label || (isStillComplete ? 'Árbol completo (rotación variada)' : branches.map((b) => b.label).join(' + ')),
      };
    }
  }

  const rawText = String(text?.raw || text || '').trim();
  const normLower = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Detección de árbol completo (ingesta vacía o especificada como variada / libre)
  const isComplete = !rawText || [
    'variadas', 'variado', 'come variable', 'variable', 'libre', 'variadas saludables',
    'opciones variadas dulces saludables', 'variado le gusta comer sano', 'saludable',
  ].some((p) => normLower === p || normLower.startsWith(p));

  if (isComplete) {
    const branches = getCompleteMealBranches(mealName, clinicalCatalog, player, isPreMatch);
    return {
      raw: rawText,
      isComplete: true,
      branches,
      unrecognized: [],
      conflicts: [],
      isValid: true,
      label: `Árbol completo (${branches.map((b) => b.label).join(' + ')})`,
    };
  }

  // Fallback directo sin regex heurísticos: busca el nodo completo en el árbol
  const singleNode = findTreeNode(rawText);
  if (singleNode) {
    return {
      raw: rawText,
      isComplete: false,
      branches: [{
        id: singleNode.id,
        label: singleNode.label,
        isGeneric: Boolean(singleNode.isGeneric || singleNode.children),
        category: singleNode.id,
        defaultFood: singleNode.defaultFood || (singleNode.foodNames ? singleNode.foodNames[0] : null),
      }],
      unrecognized: [],
      conflicts: [],
      isValid: true,
      label: singleNode.label,
    };
  }

  const fallbackBranches = getCompleteMealBranches(mealName, clinicalCatalog, player, isPreMatch);
  return {
    raw: rawText,
    isComplete: true,
    branches: fallbackBranches,
    unrecognized: [],
    conflicts: [],
    isValid: true,
    label: `Árbol completo (${fallbackBranches.map((b) => b.label).join(' + ')})`,
  };
}

/**
 * Resuelve deterministamente el Árbol de una comida para un día concreto (0..6).
 * Rota alimentos aptos sin repetición ('x, y, z') y devuelve el plato listo para calibrar.
 */
export function resolveMealTreeForDay(treeOrRaw, dayIndex = 0, mealName = 'Comida', clinicalCatalog = null, player = null, isPreMatch = false) {
  let tree = treeOrRaw;
  if (tree && typeof tree === 'object' && tree.tree && Array.isArray(tree.tree.branches)) {
    tree = tree.tree;
  }
  if (!tree || typeof tree === 'string' || !tree.branches) {
    tree = buildMealTree(treeOrRaw || '', mealName, clinicalCatalog, player, isPreMatch);
  }

  if (!tree.isValid) {
    return `[Fallo en árbol de ${mealName}: ${tree.error || 'Configuración no válida'}]`;
  }

  // 1. Opciones de Hidratos disponibles para rotar
  const isCeliac = player?.contexto_clinico?.includes('sin_gluten') || player?.intolerancias?.toLowerCase().includes('gluten');
  const pastaApta = isCeliac ? 'Pasta sin gluten' : 'Pasta de trigo';
  const panApto = isCeliac ? 'Pan sin gluten' : 'Pan blanco de barra';

  const carbRotation = isPreMatch
    ? ['Arroz blanco', pastaApta, 'Patata cocida', 'Tortitas de arroz']
    : ['Arroz blanco', pastaApta, 'Patata cocida', 'Boniato', 'Quinoa', 'Arroz basmati'];

  // 2. Opciones de Proteínas disponibles para rotar
  const hasSinPescado = player?.contexto_clinico?.includes('sin_pescado') || player?.intolerancias?.toLowerCase().includes('pescado');
  const hasSinCerdo = player?.contexto_clinico?.includes('sin_cerdo') || player?.aversiones?.toLowerCase().includes('cerdo');

  const proteinRotation = [];
  proteinRotation.push('Pechuga de pollo');
  if (!hasSinPescado && !isPreMatch) proteinRotation.push('Salmón a la plancha');
  proteinRotation.push('Ternera magra');
  if (!hasSinPescado) proteinRotation.push(isPreMatch ? 'Merluza al vapor' : 'Merluza al horno');
  proteinRotation.push('Pechuga de pavo');
  proteinRotation.push('Huevos revueltos');
  if (!hasSinCerdo && !isPreMatch) proteinRotation.push('Lomo de cerdo');

  // 3. Opciones de Verduras disponibles para rotar
  const veggieRotation = isPreMatch
    ? ['Calabacín a la plancha', 'Zanahoria al vapor', 'Calabacín cocido']
    : ['Ensalada mixta', 'Brócoli al vapor', 'Calabacín a la plancha', 'Judías verdes', 'Espinacas frescas', 'Tomate fresco'];

  // 4. Frutas
  const fruitRotation = ['Plátano', 'Manzana', 'Kiwi', 'Naranja', 'Pera', 'Mandarina'];

  // Si es Árbol Completo, armar el plato según el tipo de toma
  const normMeal = String(mealName || '').toLowerCase();
  if (tree.isComplete) {
    if (normMeal.includes('desayuno')) {
      const bCarb = dayIndex % 2 === 0 ? `Tostadas de ${panApto.toLowerCase()}` : 'Porridge de copos de avena';
      const bProt = dayIndex % 2 === 0 ? 'Pechuga de pavo' : 'Huevos revueltos';
      const bFruit = fruitRotation[dayIndex % fruitRotation.length];
      const bFat = dayIndex % 2 === 0 ? 'Aceite de oliva virgen extra' : 'Aguacate';
      return [bCarb, bProt, bFat, bFruit].filter(Boolean).join(', ');
    }

    if (normMeal.includes('merienda') || normMeal.includes('snack') || normMeal.includes('almuerzo')) {
      const sFruit = fruitRotation[dayIndex % fruitRotation.length];
      const sDairy = dayIndex % 2 === 0 ? 'Yogur natural' : 'Yogur proteico natural';
      const sNut = dayIndex % 2 === 0 ? 'Nueces' : 'Almendras';
      return [sFruit, sDairy, sNut].filter(Boolean).join(', ');
    }

    // Comida o Cena completa
    const dCarb = carbRotation[dayIndex % carbRotation.length];
    const dProt = proteinRotation[dayIndex % proteinRotation.length];
    const dVeg = veggieRotation[dayIndex % veggieRotation.length];
    const dFruit = fruitRotation[dayIndex % fruitRotation.length];
    return [dCarb, dProt, dVeg, dFruit, 'Aceite de oliva virgen extra'].filter(Boolean).join(', ');
  }

  // Árbol con ramas explícitas
  const resolvedParts = [];
  for (const branch of tree.branches) {
    const bId = branch.id.toLowerCase();

    if (bId === 'hidratos') {
      resolvedParts.push(carbRotation[dayIndex % carbRotation.length]);
    } else if (bId === 'proteina') {
      resolvedParts.push(proteinRotation[dayIndex % proteinRotation.length]);
    } else if (bId === 'verduras' || bId === 'hojas_verdes') {
      resolvedParts.push(veggieRotation[dayIndex % veggieRotation.length]);
    } else if (bId === 'frutas') {
      resolvedParts.push(fruitRotation[dayIndex % fruitRotation.length]);
    } else if (bId === 'panes') {
      resolvedParts.push(`Tostadas de ${panApto.toLowerCase()}`);
    } else if (bId === 'huevos') {
      resolvedParts.push(dayIndex % 2 === 0 ? 'Huevos revueltos' : 'Huevo entero');
    } else if (bId === 'leches') {
      resolvedParts.push(resolveNodeForPlayer('leches', clinicalCatalog) || 'Leche semidesnatada');
    } else if (bId === 'yogures') {
      resolvedParts.push(resolveNodeForPlayer('yogures', clinicalCatalog) || 'Yogur natural');
    } else if (bId === 'agua') {
      resolvedParts.push('Agua mineral');
    } else {
      // Rama específica o corte concreto
      const specificResolved = resolveNodeForPlayer(branch.id, clinicalCatalog);
      if (specificResolved) {
        resolvedParts.push(specificResolved);
      } else if (branch.foodName) {
        resolvedParts.push(branch.foodName);
      } else if (branch.defaultFood) {
        resolvedParts.push(branch.defaultFood);
      } else {
        resolvedParts.push(branch.label);
      }
    }
  }

  if (resolvedParts.length === 0) {
    return `[Sin pauta definida para ${mealName}]`;
  }

  // Si es comida o cena principal y no tiene grasa explícita, añadir AOVE para cocinado
  const isMain = normMeal.includes('comida') || normMeal.includes('cena') || normMeal.includes('almuerzo');
  const hasFat = resolvedParts.some(p => {
    const low = p.toLowerCase();
    return low.includes('aceite') || low.includes('aove') || low.includes('aguacate') || low.includes('nuez') || low.includes('almendra');
  });
  if (isMain && !hasFat) {
    resolvedParts.push('Aceite de oliva virgen extra');
  }

  return resolvedParts.filter(Boolean).join(', ');
}

/**
 * ----------------------------------------------------------------------------
 * GENERADORES DE OPCIONES AGRUPADAS PARA INTERFACES DE USUARIO (MANTINE)
 * ----------------------------------------------------------------------------
 * Proporcionan los nodos del árbol y las hojas reales de FOODS_CRUDO agrupados
 * para poblar los selectores y multiselectores del modal de edición sin texto libre.
 */

export function getTreeProteinaOptions() {
  return [
    {
      group: 'Opciones Genéricas del Árbol',
      items: [
        { value: 'pollo', label: 'Pollo (Genérico)' },
        { value: 'pavo', label: 'Pavo (Genérico)' },
        { value: 'vacuno', label: 'Ternera / Vacuno (Genérico)' },
        { value: 'cerdo', label: 'Cerdo (Genérico)' },
        { value: 'pescado_blanco', label: 'Pescado blanco (Genérico)' },
        { value: 'pescado_azul', label: 'Pescado azul (Genérico)' },
        { value: 'marisco', label: 'Marisco (Genérico)' },
        { value: 'huevos', label: 'Huevos (Genérico)' },
        { value: 'vegetal_proteina', label: 'Proteína vegetal (Genérico)' },
      ],
    },
    {
      group: 'Aves y Conejo',
      items: [
        'Pechuga de pollo',
        'Contramuslo de pollo deshuesado',
        'Alitas de pollo',
        'Carne picada de pollo',
        'Muslo de pollo',
        'Hamburguesa de pollo',
        'Pechuga de pavo',
        'Chuletas de pavo',
        'Carne picada de pavo',
        'Hamburguesa de pavo',
        'Conejo',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Ternera y Carnes Rojas',
      items: [
        'Ternera magra',
        'Solomillo de ternera',
        'Filete de ternera',
        'Carne picada de ternera',
        'Carne picada mixta',
        'Hamburguesa de ternera magra',
        'Hamburguesa de ternera',
        'Entrecot de ternera',
        'Chuletón de ternera',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Cerdo',
      items: [
        'Solomillo de cerdo',
        'Lomo embuchado',
        'Secreto de cerdo',
        'Morro de cerdo cocido',
        'Hamburguesa de cerdo',
        'Jamón serrano',
        'Jamón ibérico de bellota',
        'Jamón serrano curado',
        'Jamón cocido',
        'Jamón cocido (York)',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Pescados Blancos',
      items: [
        'Merluza',
        'Lenguado',
        'Bacalao',
        'Bacalao fresco',
        'Bacalao desalado',
        'Corvina',
        'Dorada',
        'Lubina',
        'Rape',
        'Rodaballo',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Pescados Azules y Conservas',
      items: [
        'Salmón',
        'Salmón fresco',
        'Salmón ahumado',
        'Atún fresco',
        'Emperador (pez espada)',
        'Sardina',
        'Caballa',
        'Atún natural',
        'Atún natural conserva natural',
        'Atún natural conserva aceite',
        'Caballa en conserva (al natural)',
        'Salmón conserva aceite',
        'Salmón conserva natural',
        'Sardina conserva aceite',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Mariscos y Cefalópodos',
      items: [
        'Sepia',
        'Calamar',
        'Pulpo',
        'Gambas',
        'Mejillones frescos',
        'Berberechos frescos',
        'Mejiilon en conserva (escabeche)',
        'Berberecho conserva',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Huevos y Proteína Vegetal',
      items: [
        'Huevo entero',
        'Huevo entero tortilla',
        'Claras de huevo',
        'Tofu firme',
        'Seitán',
        'Soja texturizada',
      ].map((n) => ({ value: n, label: n })),
    },
  ];
}

export function getTreeHidratoOptions() {
  return [
    {
      group: 'Opciones Genéricas del Árbol',
      items: [
        { value: 'pasta', label: 'Pasta (Genérica adaptable)' },
        { value: 'arroz', label: 'Arroz (Genérico adaptable)' },
        { value: 'panes', label: 'Panes (Genérico adaptable)' },
        { value: 'tuberculos', label: 'Tubérculos (Genérico)' },
        { value: 'legumbres', label: 'Legumbres (Genérico)' },
      ],
    },
    {
      group: 'Pastas',
      items: [
        'Pasta de trigo',
        'Pasta sin gluten',
        'Pasta de lenteja roja',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Arroces',
      items: [
        'Arroz blanco',
        'Arroz basmati',
        'Arroz jazmín',
        'Arroz integral',
        'Arroz con leche',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Tubérculos',
      items: [
        'Patata',
        'Ñoquis de patata',
        'Boniato',
        'Yuca',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Panes y Masas',
      items: [
        'Pan blanco de barra',
        'Pan de molde blanco',
        'Pan integral',
        'Pan de molde integral',
        'Pan sin gluten',
        'Pan de centeno',
        'Tostadas integrales (biscotes)',
        'Pan de hamburguesa',
        'Pan de pita',
        'Pan de semillas',
        'Picos / colines',
        'Tortas de arroz',
        'Tortas de maíz',
        'Tortilla de trigo',
        'Tortilla de trigo integral',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Granos, Cereales y Semillas',
      items: [
        'Cuscús',
        'Quinoa',
        'Fideos de arroz',
        'Copos de avena',
        'Copos de avena sin gluten',
        'Bulgur',
        'Maíz dulce',
        'Trigo sarraceno',
        'Trigo sarraceno hinchado',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Legumbres',
      items: [
        'Lenteja',
        'Garbanzo',
        'Alubia blanca',
      ].map((n) => ({ value: n, label: n })),
    },
  ];
}

export function getTreeVerduraOptions() {
  return [
    {
      group: 'Opciones Genéricas del Árbol',
      items: [
        { value: 'verduras', label: 'Verduras variadas (Genérico)' },
        { value: 'hojas_verdes', label: 'Ensalada / Hojas verdes (Genérico)' },
      ],
    },
    {
      group: 'Hortalizas',
      items: [
        'Tomate',
        'Tomate frito',
        'Calabacín',
        'Zanahoria',
        'Pimiento verde',
        'Pimiento',
        'Cebolla',
        'Puerro',
        'Berenjena',
        'Ajo',
        'Remolacha',
        'Zarangollo',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Hojas verdes y Ensaladas',
      items: [
        'Espinaca',
        'Rúcula',
        'Lechuga romana',
        'Pepino',
        'Acelga',
        'Hamburguesa de espinacas',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Crucíferas y Otras Verduras',
      items: [
        'Brócoli',
        'Coliflor',
        'Champiñón',
        'Espárragos verdes',
        'Espárragos blancos conserva',
        'Judías verdes',
        'Alcachofa',
        'Guisantes',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Cremas y Sopas Frías',
      items: [
        'Gazpacho',
        'Salmorejo',
      ].map((n) => ({ value: n, label: n })),
    },
  ];
}

export function getTreeFrutaOptions() {
  return [
    {
      group: 'Opciones Genéricas del Árbol',
      items: [
        { value: 'frutas', label: 'Fruta fresca / de temporada (Genérica)' },
      ],
    },
    {
      group: 'Frutas Frescas',
      items: [
        'Plátano',
        'Manzana',
        'Pera',
        'Naranja',
        'Mandarina',
        'Kiwi',
        'Fresas',
        'Arándanos',
        'Frambuesa',
        'Melocotón',
        'Ciruela',
        'Nectarina',
        'Paraguayo',
        'Uvas',
        'Mango',
        'Piña pelada',
        'Sandía',
        'Melón',
        'Dátil',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Frutas Desecadas y Compotas',
      items: [
        'Arándano desecada',
        'Fresa desecada',
        'Higo seco',
        'Mango desecada',
        'Manzana desecada',
        'Naranja desecada',
        'Piña desecada',
        'Plátano desecada',
        'Uva desecada',
        'Manzana compota sin azúcar',
        'Pera compota sin azúcar',
      ].map((n) => ({ value: n, label: n })),
    },
  ];
}

export function getTreeLacteoOptions() {
  return [
    {
      group: 'Opciones Genéricas del Árbol',
      items: [
        { value: 'yogures', label: 'Yogures (Genérico adaptable)' },
        { value: 'leches', label: 'Leches (Genérico adaptable)' },
        { value: 'quesos', label: 'Quesos (Genérico adaptable)' },
      ],
    },
    {
      group: 'Yogures y Kéfir',
      items: [
        'Yogur natural',
        'Yogur proteico natural',
        'Yogur griego natural',
        'Yogur griego natural desnatado',
        'Yogur natural desnatado',
        'Yogur natural alto proteína',
        'Yogur proteico sabor chocolate',
        'Yogur proteico sabor vainilla',
        'Yogur natural sin lactosa',
        'Yogur proteico sin lactosa',
        'Kéfir desnatado',
        'Kéfir entero',
        'Skyr natural',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Quesos',
      items: [
        'Queso fresco',
        'Queso fresco alto proteína',
        'Queso fresco desnatado',
        'Queso fresco sin lactosa',
        'Queso fresco batido desnatado',
        'Queso cottage',
        'Queso crema tipo untable',
        'Queso curado',
        'Queso de cabra',
        'Queso manchego curado',
        'Queso parmesano',
        'Requesón',
        'Mozzarella fresca',
      ].map((n) => ({ value: n, label: n })),
    },
    {
      group: 'Leches y Bebidas Vegetales',
      items: [
        'Leche semidesnatada',
        'Leche entera',
        'Leche desnatada',
        'Leche entera sin lactosa',
        'Leche entera alto proteína',
        'Leche de avena',
        'Leche de soja sin azúcar',
        'Leche de almendra sin azúcar',
      ].map((n) => ({ value: n, label: n })),
    },
  ];
}

export function getTreeGrasaOptions() {
  return [
    { value: 'AOVE', label: 'AOVE' },
    { value: 'Aguacate', label: 'Aguacate' },
    { value: 'Frutos secos', label: 'Frutos secos' },
    { value: 'Aceite de coco', label: 'Aceite de coco' },
    { value: 'Sin grasa añadida', label: 'Sin grasa añadida' },
  ];
}


