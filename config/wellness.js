// Cuestionario diario de bienestar. Escala 1 (peor) → 5 (mejor).
// El orden define los vértices del hexágono (empezando arriba, sentido horario).
export const WELLNESS_ITEMS = [
  { key: 'sueno', label: 'Sueño', short: 'SUEÑO', options: ['Muy malo', 'Malo', 'Normal', 'Bueno', 'Muy bueno'] },
  { key: 'fatiga', label: 'Fatiga / recuperación', short: 'FATIGA', options: ['Muy fatigado', 'Fatigado', 'Normal', 'Recuperado', 'Muy fresco'] },
  { key: 'dolor_muscular', label: 'Dolor muscular', short: 'DOLOR', options: ['Mucho dolor', 'Bastante', 'Moderado', 'Poco', 'Sin dolor'] },
  { key: 'estres', label: 'Estrés', short: 'ESTRÉS', options: ['Muy alto', 'Alto', 'Normal', 'Bajo', 'Muy bajo'] },
  { key: 'estado_animo', label: 'Estado de ánimo', short: 'ÁNIMO', options: ['Muy malo', 'Malo', 'Normal', 'Bueno', 'Muy bueno'] },
  {
    key: 'alimentacion',
    label: 'Alimentación',
    short: 'ALIMENTACIÓN',
    options: ['Muy inadecuada', 'Inadecuada', 'Normal', 'Adecuada', 'Muy adecuada'],
    hint: 'Valora si ayer comiste suficiente, realizaste bien tus comidas y cubriste tus necesidades de entrenamiento y recuperación.',
  },
];

export const WELLNESS_KEYS = WELLNESS_ITEMS.map((item) => item.key);

// Días hacia atrás que se usan para calcular la media de referencia
export const WELLNESS_AVERAGE_DAYS = 28;

// Color Mantine según la puntuación (1-5)
export function wellnessScoreColor(value) {
  if (!Number.isFinite(value)) return 'gray.5';
  if (value < 2.5) return 'red.7';
  if (value < 3.5) return 'yellow.8';
  return 'teal.7';
}
