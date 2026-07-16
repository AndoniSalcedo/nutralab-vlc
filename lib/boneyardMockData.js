// Mock datasets for Boneyard skeleton crawler

export const mockTeam = {
  id: 4,
  nombre: 'Equipo de Prueba Boneyard',
  temporada: '2026/27',
  descripcion: 'Equipo ficticio para generación de skeletons',
  configuracion_nutricional: {
    kcal_margen: 200,
    ratios: { cho: 50, pro: 25, fat: 25 }
  }
};

export const mockTeams = [
  {
    ...mockTeam,
    players_count: 3,
    players: [
      { id: 220, nombre: 'Carlos', apellidos: 'Jugador Uno', posicion: 'Delantero' },
      { id: 221, nombre: 'Sofía', apellidos: 'Jugador Dos', posicion: 'Mediocentro' },
      { id: 222, nombre: 'Mateo', apellidos: 'Jugador Tres', posicion: 'Defensa' }
    ]
  }
];

export const mockPlayers = [
  {
    id: 220,
    nombre: 'Carlos',
    apellidos: 'Jugador Uno',
    posicion: 'Delantero',
    kcal_objetivo: 3200,
    factor_actividad: 1.6,
    objetivo: 'Ganancia muscular',
    auth_email: 'carlos@nutralab.com',
    credentials_created_at: '2026-01-01T00:00:00Z',
    equipo_id: 4,
    altura_cm: 184,
    peso_kg: 81.5,
    porcentaje_grasa: 11.2,
    masa_magra_kg: 72.3,
    fecha_ultima_medicion: '2026-07-15',
    notas_hidratacion: 'Tomar 500ml extra en días calurosos.',
    notas_suplementacion: 'Creatina 5g post entreno.',
    notas_protocolos: 'Seguir protocolo pre-partido estándar.'
  },
  {
    id: 221,
    nombre: 'Sofía',
    apellidos: 'Jugador Dos',
    posicion: 'Mediocentro',
    kcal_objetivo: 2400,
    factor_actividad: 1.5,
    objetivo: 'Mantenimiento',
    auth_email: 'sofia@nutralab.com',
    credentials_created_at: '2026-01-02T00:00:00Z',
    equipo_id: 4,
    altura_cm: 168,
    peso_kg: 61.2,
    porcentaje_grasa: 14.5,
    masa_magra_kg: 52.3,
    fecha_ultima_medicion: '2026-07-15'
  },
  {
    id: 222,
    nombre: 'Mateo',
    apellidos: 'Jugador Tres',
    posicion: 'Defensa',
    kcal_objetivo: 3000,
    factor_actividad: 1.6,
    objetivo: 'Pérdida de grasa',
    auth_email: 'mateo@nutralab.com',
    credentials_created_at: '2026-01-03T00:00:00Z',
    equipo_id: 4,
    altura_cm: 189,
    peso_kg: 88.0,
    porcentaje_grasa: 13.8,
    masa_magra_kg: 75.8,
    fecha_ultima_medicion: '2026-07-15'
  }
];

export const mockEvolutions = [
  // Carlos (220)
  {
    id: 1,
    jugador_id: 220,
    fecha: '2026-05-15',
    peso_kg: 83.2,
    porcentaje_grasa: 12.5,
    masa_magra_kg: 72.8,
    altura_cm: 184,
    pliegue_biceps: 4.5,
    pliegue_triceps: 8.2,
    pliegue_subescapular: 9.8,
    pliegue_cresta_iliaca: 11.2,
    pliegue_supraeliaco: 10.4,
    pliegue_abdominal: 13.5,
    pliegue_pantorrilla: 6.2,
    pliegue_muslo: 9.5,
    suma_6_pliegues: 57.6,
    suma_8_pliegues: 73.3,
    endomorfia: 2.3,
    mesomorfia: 4.8,
    ectomorfia: 2.1
  },
  {
    id: 2,
    jugador_id: 220,
    fecha: '2026-06-15',
    peso_kg: 82.1,
    porcentaje_grasa: 11.8,
    masa_magra_kg: 72.4,
    altura_cm: 184,
    pliegue_biceps: 4.2,
    pliegue_triceps: 7.9,
    pliegue_subescapular: 9.5,
    pliegue_cresta_iliaca: 10.5,
    pliegue_supraeliaco: 9.8,
    pliegue_abdominal: 12.2,
    pliegue_pantorrilla: 5.9,
    pliegue_muslo: 9.1,
    suma_6_pliegues: 53.5,
    suma_8_pliegues: 69.5,
    endomorfia: 2.1,
    mesomorfia: 4.7,
    ectomorfia: 2.2
  },
  {
    id: 3,
    jugador_id: 220,
    fecha: '2026-07-15',
    peso_kg: 81.5,
    porcentaje_grasa: 11.2,
    masa_magra_kg: 72.3,
    altura_cm: 184,
    pliegue_biceps: 4.0,
    pliegue_triceps: 7.5,
    pliegue_subescapular: 9.2,
    pliegue_cresta_iliaca: 10.0,
    pliegue_supraeliaco: 9.2,
    pliegue_abdominal: 11.5,
    pliegue_pantorrilla: 5.7,
    pliegue_muslo: 8.8,
    suma_6_pliegues: 50.4,
    suma_8_pliegues: 65.9,
    endomorfia: 2.0,
    mesomorfia: 4.7,
    ectomorfia: 2.3
  },
  // Sofía (221)
  {
    id: 4,
    jugador_id: 221,
    fecha: '2026-07-15',
    peso_kg: 61.2,
    porcentaje_grasa: 14.5,
    masa_magra_kg: 52.3,
    altura_cm: 168
  },
  // Mateo (222)
  {
    id: 5,
    jugador_id: 222,
    fecha: '2026-07-15',
    peso_kg: 88.0,
    porcentaje_grasa: 13.8,
    masa_magra_kg: 75.8,
    altura_cm: 189
  }
];

export const mockCatalogs = [
  { id: 1, nombre: 'Suplementación General', orden: 1 },
  { id: 2, nombre: 'Protocolo de Recuperación Rápida', orden: 2 }
];

export const mockAssignments = [
  { id: 10, jugador_id: 220, lista_id: 1 },
  { id: 11, jugador_id: 221, lista_id: 2 }
];

export const mockExtras = [
  { id: 30, jugador_id: 220, suplemento_id: 5, nombre: 'Vitamina D3', dosis: '1 cápsula en el desayuno' },
  { id: 31, jugador_id: 220, suplemento_id: 8, nombre: 'Omega 3', dosis: '2 cápsulas en la cena' }
];

export const mockHistory = [
  {
    id: 50,
    jugador_id: 220,
    fecha: '2026-07-01',
    tipo: 'Asignación de Catálogo',
    descripcion: 'Se asignó el catálogo "Suplementación General"'
  },
  {
    id: 51,
    jugador_id: 220,
    fecha: '2026-07-10',
    tipo: 'Añadido Extra',
    descripcion: 'Se añadió el extra "Vitamina D3"'
  }
];

export const mockMenus = [
  {
    id: 100,
    semana: '2026-07-13',
    dias: [
      {
        dia: 'Lunes',
        comida: { primero: 'Ensalada de pasta integral', segundo: 'Pechuga de pollo a la plancha', postre: 'Yogur natural con nueces' },
        cena: { primero: 'Crema de verduras de temporada', segundo: 'Filete de merluza al horno', postre: 'Manzana asada' }
      },
      {
        dia: 'Martes',
        comida: { primero: 'Arroz basmati con verduras', segundo: 'Ternera magra saltada', postre: 'Macedonia de frutas de temporada' },
        cena: { primero: 'Puré de calabaza y zanahoria', segundo: 'Tortilla de claras con jamón serrano', postre: 'Queso fresco batido con miel' }
      },
      {
        dia: 'Miércoles',
        comida: { primero: 'Lentejas guisadas con verduras', segundo: 'Lomo de cerdo a la plancha', postre: 'Plátano' },
        cena: { primero: 'Sopa de fideos finos', segundo: 'Salmón a la plancha', postre: 'Yogur de soja' }
      },
      {
        dia: 'Jueves',
        comida: { primero: 'Quinoa tricolor con aguacate y cherrys', segundo: 'Muslo de pollo asado sin piel', postre: 'Piña natural' },
        cena: { primero: 'Espárragos trigueros a la plancha', segundo: 'Tortilla de patatas ligera', postre: 'Kéfir natural' }
      },
      {
        dia: 'Viernes',
        comida: { primero: 'Espaguetis boloñesa de soja texturizada', segundo: 'Filete de emperador a la plancha', postre: 'Melocotón' },
        cena: { primero: 'Crema de calabacín y puerro', segundo: 'Hamburguesa de pavo casera', postre: 'Yogur bífidus' }
      },
      {
        dia: 'Sábado',
        comida: { primero: 'Garbanzos salteados con espinacas', segundo: 'Pollo al curry ligero', postre: 'Pera' },
        cena: { primero: 'Ensalada mixta completa', segundo: 'Brochetas de pavo y champiñones', postre: 'Manzana' }
      },
      {
        dia: 'Domingo',
        comida: { primero: 'Paella de marisco casera', segundo: 'Ensalada verde', postre: 'Sandía' },
        cena: { primero: 'Caldo casero de gallina', segundo: 'Revuelto de ajetes y gambas', postre: 'Infusión relajante' }
      }
    ]
  }
];

export const mockAnalytics = [
  {
    id: 300,
    jugador_id: 220,
    fecha_extraccion: '2026-07-01',
    visible_para_jugador: true,
    parametros: [
      { nombre: 'Hierro', valor: 85, unidad: 'µg/dL', rango_min: 60, rango_max: 160, fuera_rango: false },
      { nombre: 'Ferritina', valor: 45, unidad: 'ng/mL', rango_min: 30, rango_max: 400, fuera_rango: false },
      { nombre: 'Hemoglobina', valor: 14.8, unidad: 'g/dL', rango_min: 13.5, rango_max: 17.5, fuera_rango: false },
      { nombre: 'Vitamina D', valor: 28, unidad: 'ng/mL', rango_min: 30, rango_max: 100, fuera_rango: true }
    ]
  },
  {
    id: 301,
    jugador_id: 221,
    fecha_extraccion: '2026-07-01',
    visible_para_jugador: true,
    parametros: [
      { nombre: 'Hierro', valor: 110, unidad: 'µg/dL', rango_min: 60, rango_max: 160, fuera_rango: false },
      { nombre: 'Ferritina', valor: 35, unidad: 'ng/mL', rango_min: 30, rango_max: 400, fuera_rango: false },
      { nombre: 'Hemoglobina', valor: 12.8, unidad: 'g/dL', rango_min: 12.0, rango_max: 15.5, fuera_rango: false },
      { nombre: 'Vitamina D', valor: 35, unidad: 'ng/mL', rango_min: 30, rango_max: 100, fuera_rango: false }
    ]
  },
  {
    id: 302,
    jugador_id: 222,
    fecha_extraccion: '2026-07-01',
    visible_para_jugador: true,
    parametros: [
      { nombre: 'Hierro', valor: 55, unidad: 'µg/dL', rango_min: 60, rango_max: 160, fuera_rango: true },
      { nombre: 'Ferritina', valor: 25, unidad: 'ng/mL', rango_min: 30, rango_max: 400, fuera_rango: true },
      { nombre: 'Hemoglobina', valor: 12.5, unidad: 'g/dL', rango_min: 13.5, rango_max: 17.5, fuera_rango: true },
      { nombre: 'Vitamina D', valor: 42, unidad: 'ng/mL', rango_min: 30, rango_max: 100, fuera_rango: false }
    ]
  }
];

export const mockHydration = [
  {
    id: 400,
    jugador_id: 220,
    fecha: '2026-07-14',
    hora: '09:30',
    tipo: 'hydration',
    valor: 1.022,
    unidad: 'g/ml',
    estado: 'Deshidratado leve',
    notas: 'Tomar más sales.'
  },
  {
    id: 401,
    jugador_id: 220,
    fecha: '2026-07-15',
    hora: '09:00',
    tipo: 'hydration',
    valor: 1.012,
    unidad: 'g/ml',
    estado: 'Normal',
    notas: 'Perfecto estado de hidratación.'
  }
];

export const mockMessages = [
  {
    id: 500,
    equipo_id: 4,
    jugador_id: 220,
    sender_id: 'tecnico',
    mensaje: 'Hola Carlos, recuerda tomar la creatina hoy después del entreno.',
    created_at: '2026-07-15T12:00:00Z'
  }
];
