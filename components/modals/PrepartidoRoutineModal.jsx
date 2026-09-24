'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Text,
  Group,
  Button,
  Paper,
  MultiSelect,
  Select,
  Switch,
  Box,
  Divider,
  Accordion,
  ActionIcon,
  Tooltip,
  Textarea,
  Alert,
} from '@mantine/core';
import ResponsiveModal from './ResponsiveModal';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconTrash,
  IconPlus,
  IconClipboardList,
  IconSparkles,
  IconAlertCircle,
} from '@/components/icons3d';
import { parseMealTree } from '@/actions/mealActions';
import {
  getTreeProteinaOptions,
  getTreeHidratoOptions,
  getTreeVerduraOptions,
  getTreeFrutaOptions,
  getTreeLacteoOptions,
  getTreeGrasaOptions,
} from '@/config/food-tree-options';
import { getClinicalCatalogForPlayer } from '@/lib/nutrition/clinical-catalog';
import { AVAILABLE_MEALS, isMainMeal as checkIsMainMeal } from '@/config/nutrition-days';

const SCHEDULE_DETAILS = {
  manana: {
    label: 'Mañana',
    timeWindow: '12:00 - 14:00',
    description: 'Partidos matinales. La cena anterior actúa como carga nutricional principal (24h previas).',
    recommendedMeals: ['Cena', 'Desayuno'],
  },
  tarde: {
    label: 'Tarde',
    timeWindow: '16:00 - 18:30',
    description: 'Partidos por la tarde. Comida pre-partido como toma clave de recarga.',
    recommendedMeals: ['Cena', 'Desayuno', 'Comida'],
  },
  noche: {
    label: 'Noche',
    timeWindow: '20:00 - 22:00',
    description: 'Partidos nocturnos. Merienda previa de fácil digestión antes del calentamiento.',
    recommendedMeals: ['Cena', 'Desayuno', 'Comida', 'Merienda'],
  },
};

export function sortPreMatchMealsChronological(scheduleKey, meals = []) {
  if (!Array.isArray(meals)) return [];
  let order = ['cena', 'desayuno', 'almuerzo', 'comida', 'merienda', 'post-partido', 'post-entreno'];
  if (scheduleKey === 'manana') {
    order = ['cena', 'merienda', 'desayuno', 'almuerzo', 'comida', 'post-partido', 'post-entreno'];
  }
  return [...meals].sort((a, b) => {
    const ia = order.indexOf(String(a).toLowerCase().trim());
    const ib = order.indexOf(String(b).toLowerCase().trim());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export function getMealTimingBadge(scheduleKey, mealName) {
  const norm = String(mealName).toLowerCase().trim();
  if (scheduleKey === 'manana') {
    if (norm === 'cena' || norm === 'merienda') return 'Día anterior · Carga 24h';
    return 'Día de partido';
  }
  if (scheduleKey === 'tarde' || scheduleKey === 'noche') {
    if (norm === 'cena') return 'Día anterior · Carga 24h';
    return 'Día de partido';
  }
  return 'Día de partido';
}

/**
 * Extrae el conjunto de valores canónicos y válidos contenidos en las opciones del árbol
 */
function extractValidValuesSet(groupedOptions) {
  const set = new Set();
  groupedOptions.forEach((g) => {
    if (Array.isArray(g.items)) {
      g.items.forEach((it) => {
        const val = typeof it === 'string' ? it : it?.value;
        if (val) set.add(val);
      });
    } else if (g.value) {
      set.add(g.value);
    }
  });
  return set;
}

/**
 * Mapea de forma segura los alimentos devueltos por la IA hacia las opciones
 * canónicas y autorizadas del catálogo apto para este jugador concreto.
 */
function mapItemsToCatalog(rawItems, validSet, groupedOptions) {
  if (!rawItems) return [];
  const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];
  if (itemsArray.length === 0 || !validSet) return [];

  const exactLookup = new Map();
  const allEntries = [];

  const processItem = (it) => {
    const val = typeof it === 'string' ? it : it?.value;
    const lbl = typeof it === 'string' ? it : it?.label || val;
    if (val && validSet.has(val)) {
      const valLower = String(val).toLowerCase().trim();
      const lblLower = String(lbl).toLowerCase().trim();
      exactLookup.set(valLower, val);
      exactLookup.set(lblLower, val);
      allEntries.push({ val, lbl, valLower, lblLower });
    }
  };

  groupedOptions.forEach((g) => {
    if (Array.isArray(g.items)) {
      g.items.forEach(processItem);
    } else {
      processItem(g);
    }
  });

  const matched = new Set();

  for (const raw of itemsArray) {
    if (!raw || typeof raw !== 'string') continue;
    const norm = raw.toLowerCase().trim();
    if (!norm) continue;

    // 1. Coincidencia directa con valor en validSet
    if (validSet.has(raw)) {
      matched.add(raw);
      continue;
    }

    // 2. Coincidencia exacta insensible a mayúsculas/minúsculas o etiqueta
    if (exactLookup.has(norm)) {
      matched.add(exactLookup.get(norm));
      continue;
    }

    // 3. Coincidencia parcial / de inclusión
    const partialMatch = allEntries.find((entry) =>
      entry.valLower === norm ||
      entry.lblLower === norm ||
      entry.valLower.includes(norm) ||
      norm.includes(entry.valLower) ||
      entry.lblLower.includes(norm) ||
      norm.includes(entry.lblLower)
    );

    if (partialMatch) {
      matched.add(partialMatch.val);
    }
  }

  return Array.from(matched);
}

/**
 * Asegura que cualquier valor registrado previamente por el usuario
 * esté presente en las opciones del selector para que Mantine pueda renderizarlo.
 */
function ensureOptionsContain(options = [], currentValues = []) {
  if (!currentValues) return options;
  const valuesArray = Array.isArray(currentValues) ? currentValues : [currentValues];
  const allExistingValues = new Set();

  options.forEach((group) => {
    if (Array.isArray(group.items)) {
      group.items.forEach((it) => allExistingValues.add(typeof it === 'string' ? it : it?.value));
    } else if (group.value) {
      allExistingValues.add(group.value);
    }
  });

  const missing = valuesArray.filter((v) => v && !allExistingValues.has(v));
  if (missing.length === 0) return options;

  return [
    {
      group: 'Valores Registrados',
      items: missing.map((m) => ({ value: m, label: m })),
    },
    ...options,
  ];
}

function ensureGrasaOptionsContain(options = [], currentValue = null) {
  if (!currentValue) return options;
  const allExisting = new Set();
  options.forEach((it) => {
    allExisting.add(typeof it === 'string' ? it : it?.value);
  });
  if (allExisting.has(currentValue)) return options;
  return [{ value: currentValue, label: currentValue }, ...options];
}

/**
 * Normaliza de forma inteligente un valor registrado previo hacia su
 * equivalente canónico en las opciones (insensible a mayúsculas/minúsculas y singular/plural).
 * Ej: "Arroz" -> "arroz", "Huevo" -> "huevos".
 * Si no encuentra coincidencia, conserva el valor original sin borrarlo.
 */
function canonicalizeItem(raw, options = []) {
  if (!raw || typeof raw !== 'string') return raw;
  const norm = raw.toLowerCase().trim();

  // 1. Coincidencia exacta insensible a mayúsculas/minúsculas con value o label
  for (const group of options) {
    const items = Array.isArray(group.items) ? group.items : [group];
    for (const it of items) {
      const val = typeof it === 'string' ? it : it?.value;
      const lbl = typeof it === 'string' ? it : it?.label || val;
      if (!val) continue;

      if (val === raw) return val;
      if (val.toLowerCase().trim() === norm) return val;
      if (lbl.toLowerCase().trim() === norm) return val;
    }
  }

  // 2. Coincidencia singular/plural (ej: "huevo" -> "huevos", "arroz" -> "arroz")
  for (const group of options) {
    const items = Array.isArray(group.items) ? group.items : [group];
    for (const it of items) {
      const val = typeof it === 'string' ? it : it?.value;
      if (!val) continue;
      const valLower = val.toLowerCase().trim();
      if (
        valLower === `${norm}s` ||
        `${valLower}s` === norm ||
        valLower === `${norm}es` ||
        `${valLower}es` === norm
      ) {
        return val;
      }
    }
  }

  return raw;
}

function canonicalizeList(list, options = []) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const res = [];
  list.forEach((item) => {
    if (!item) return;
    const canon = canonicalizeItem(item, options);
    if (!seen.has(canon)) {
      seen.add(canon);
      res.push(canon);
    }
  });
  return res;
}

function buildMealPatternData(mealName, mealData = {}) {
  const isMain = mealData.isMainMeal !== undefined ? Boolean(mealData.isMainMeal) : checkIsMainMeal(mealName, mealData);
  const isComplete = Boolean(mealData.isComplete);
  const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  const hidrato = toArray(mealData.hidrato);
  const proteina = toArray(mealData.proteina);
  const verdura = toArray(mealData.verdura);
  const fruta = toArray(mealData.fruta);
  const lacteo = toArray(mealData.lacteo);
  const grasa = mealData.grasa && mealData.grasa !== 'Sin grasa añadida' ? mealData.grasa : null;
  const alternativas = Array.isArray(mealData.alternativas) ? mealData.alternativas : [];

  const allParts = [...hidrato, ...proteina, ...verdura, ...fruta, ...lacteo, ...(grasa ? [grasa] : [])];
  const hasAlternatives = !isComplete && alternativas.length > 0;

  const label = hasAlternatives
    ? alternativas.map((a, i) => a.label || a.nombre || `Alternativa ${i + 1}`).join(' / ')
    : isComplete
    ? 'Rotación variada'
    : allParts.length > 0
    ? allParts.join(' + ')
    : 'Rotación variada';

  return {
    isMainMeal: Boolean(isMain),
    isComplete: isComplete || (!hasAlternatives && allParts.length === 0),
    proteina: isComplete || hasAlternatives ? [] : proteina,
    hidrato: isComplete || hasAlternatives ? [] : hidrato,
    verdura: isComplete || hasAlternatives ? [] : verdura,
    fruta: isComplete || hasAlternatives ? [] : fruta,
    lacteo: isComplete || hasAlternatives ? [] : lacteo,
    grasa: isComplete || hasAlternatives ? null : grasa,
    alternativas: hasAlternatives ? alternativas : [],
    raw: mealData.raw || label,
    label,
    isValid: true,
    unrecognized: [],
  };
}

function getMealSummaryText(mealData) {
  if (!mealData) return 'Rotación variada (buffet oficial del club)';
  if (mealData.isComplete) return 'Rotación variada (buffet oficial del club)';
  if (mealData.alternativas?.length > 0) {
    return mealData.alternativas.map((a, i) => a.label || a.nombre || `Alternativa ${i + 1}`).join(' / ');
  }
  const parts = [];
  const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const h = toArray(mealData.hidrato);
  const p = toArray(mealData.proteina);
  const v = toArray(mealData.verdura);
  const f = toArray(mealData.fruta);
  const l = toArray(mealData.lacteo);
  if (h.length > 0) parts.push(`Hidratos: ${h.join(', ')}`);
  if (p.length > 0) parts.push(`Proteínas: ${p.join(', ')}`);
  if (v.length > 0) parts.push(`Verduras: ${v.join(', ')}`);
  if (f.length > 0) parts.push(`Frutas: ${f.join(', ')}`);
  if (l.length > 0) parts.push(`Lácteos: ${l.join(', ')}`);
  if (mealData.grasa) parts.push(`Grasa: ${mealData.grasa}`);
  if (parts.length === 0) return 'Rotación variada (buffet oficial del club)';
  return parts.join(' · ');
}

/**
 * Editor individual para la pauta nutricional de una toma concreta.
 * Incorpora el asistente de IA para clasificar texto libre y selectores
 * MultiSelect con SOLO las opciones del catálogo que el jugador puede consumir.
 */
function SingleMealPautaEditor({
  mealName,
  mealData = {},
  onChange,
  baseFoodOptions,
  validTreeSets,
  jugadorId = null,
  jugador = null,
}) {
  const isMainMeal = mealData.isMainMeal !== undefined ? Boolean(mealData.isMainMeal) : checkIsMainMeal(mealName, mealData);
  const isComplete = Boolean(mealData.isComplete);

  const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const rawProteina = toArray(mealData.proteina);
  const rawHidrato = toArray(mealData.hidrato);
  const rawVerdura = toArray(mealData.verdura);
  const rawFruta = toArray(mealData.fruta);
  const rawLacteo = toArray(mealData.lacteo);
  const rawGrasa = mealData.grasa && mealData.grasa !== 'Sin grasa añadida' ? mealData.grasa : null;
  const alternativas = Array.isArray(mealData.alternativas) ? mealData.alternativas : [];

  // Normalizar de forma inteligente los valores previos ("Arroz" -> "arroz", "Huevo" -> "huevos") sin perder datos
  const proteina = useMemo(() => canonicalizeList(rawProteina, baseFoodOptions.proteina), [rawProteina, baseFoodOptions.proteina]);
  const hidrato = useMemo(() => canonicalizeList(rawHidrato, baseFoodOptions.hidrato), [rawHidrato, baseFoodOptions.hidrato]);
  const verdura = useMemo(() => canonicalizeList(rawVerdura, baseFoodOptions.verdura), [rawVerdura, baseFoodOptions.verdura]);
  const fruta = useMemo(() => canonicalizeList(rawFruta, baseFoodOptions.fruta), [rawFruta, baseFoodOptions.fruta]);
  const lacteo = useMemo(() => canonicalizeList(rawLacteo, baseFoodOptions.lacteo), [rawLacteo, baseFoodOptions.lacteo]);
  const grasa = useMemo(() => (rawGrasa ? canonicalizeItem(rawGrasa, baseFoodOptions.grasa) : null), [rawGrasa, baseFoodOptions.grasa]);

  // Asegurar que las opciones para cada selector incluyan los valores actuales (para que Mantine los pinte sin fallo)
  const proteinaOptions = useMemo(() => ensureOptionsContain(baseFoodOptions.proteina, proteina), [baseFoodOptions.proteina, proteina]);
  const hidratoOptions = useMemo(() => ensureOptionsContain(baseFoodOptions.hidrato, hidrato), [baseFoodOptions.hidrato, hidrato]);
  const verduraOptions = useMemo(() => ensureOptionsContain(baseFoodOptions.verdura, verdura), [baseFoodOptions.verdura, verdura]);
  const frutaOptions = useMemo(() => ensureOptionsContain(baseFoodOptions.fruta, fruta), [baseFoodOptions.fruta, fruta]);
  const lacteoOptions = useMemo(() => ensureOptionsContain(baseFoodOptions.lacteo, lacteo), [baseFoodOptions.lacteo, lacteo]);
  const grasaOptions = useMemo(() => ensureGrasaOptionsContain(baseFoodOptions.grasa, grasa), [baseFoodOptions.grasa, grasa]);

  const [aiText, setAiText] = useState(mealData.raw || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    setAiText(mealData.raw || '');
    setAiError(null);
  }, [mealName, mealData.raw]);

  async function handleInterpretWithAI() {
    if (!aiText.trim()) {
      onChange({
        isComplete: true,
        proteina: [],
        hidrato: [],
        verdura: [],
        fruta: [],
        lacteo: [],
        grasa: null,
        alternativas: [],
        raw: '',
      });
      setAiError(null);
      return;
    }

    setIsAnalyzing(true);
    setAiError(null);
    try {
      const data = await parseMealTree({
        text: aiText,
        mealName: mealName || 'Comida',
        jugadorId: jugadorId || jugador?.id || jugador?._id,
      });

      const parsed = data.tree || Object.values(data.results || {})[0];
      if (!parsed) {
        setAiError('Respuesta inesperada del asistente de IA.');
        return;
      }

      if (parsed.isComplete) {
        onChange({
          isComplete: true,
          proteina: [],
          hidrato: [],
          verdura: [],
          fruta: [],
          lacteo: [],
          grasa: null,
          alternativas: [],
          raw: aiText,
        });
      } else {
        const hasAlts = Array.isArray(parsed.alternativas) && parsed.alternativas.length > 0;

        const mappedProteina = mapItemsToCatalog(parsed.proteina, validTreeSets.proteina, baseFoodOptions.proteina);
        const mappedHidrato = mapItemsToCatalog(parsed.hidrato, validTreeSets.hidrato, baseFoodOptions.hidrato);
        const mappedVerdura = mapItemsToCatalog(parsed.verdura, validTreeSets.verdura, baseFoodOptions.verdura);
        const mappedFruta = mapItemsToCatalog(parsed.fruta, validTreeSets.fruta, baseFoodOptions.fruta);
        const mappedLacteo = mapItemsToCatalog(parsed.lacteo, validTreeSets.lacteo, baseFoodOptions.lacteo);

        let mappedGrasa = null;
        if (parsed.grasa) {
          const matchedGrasa = mapItemsToCatalog([parsed.grasa], validTreeSets.grasa, baseFoodOptions.grasa);
          if (matchedGrasa.length > 0) mappedGrasa = matchedGrasa[0];
        }

        const mappedAlternativas = hasAlts
          ? parsed.alternativas.map((alt) => ({
              ...alt,
              proteina: mapItemsToCatalog(alt.proteina, validTreeSets.proteina, baseFoodOptions.proteina),
              hidrato: mapItemsToCatalog(alt.hidrato, validTreeSets.hidrato, baseFoodOptions.hidrato),
              verdura: mapItemsToCatalog(alt.verdura, validTreeSets.verdura, baseFoodOptions.verdura),
              fruta: mapItemsToCatalog(alt.fruta, validTreeSets.fruta, baseFoodOptions.fruta),
              lacteo: mapItemsToCatalog(alt.lacteo, validTreeSets.lacteo, baseFoodOptions.lacteo),
              grasa: alt.grasa ? (mapItemsToCatalog([alt.grasa], validTreeSets.grasa, baseFoodOptions.grasa)[0] || null) : null,
            }))
          : [];

        onChange({
          isComplete: false,
          proteina: hasAlts ? [] : mappedProteina,
          hidrato: hasAlts ? [] : mappedHidrato,
          verdura: hasAlts ? [] : mappedVerdura,
          fruta: hasAlts ? [] : mappedFruta,
          lacteo: hasAlts ? [] : mappedLacteo,
          grasa: hasAlts ? null : mappedGrasa,
          alternativas: mappedAlternativas,
          raw: aiText,
        });
      }

      notifications.show({
        color: 'teal',
        title: 'Interpretación completada',
        message: `La pauta para ${mealName} se ha clasificado en las opciones aptas del catálogo del jugador.`,
        icon: <IconCheck size={16} />,
      });
    } catch (err) {
      setAiError(err.message || 'Error al conectar con el servicio de IA.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleManualUpdate(patch) {
    onChange({
      ...patch,
      alternativas: [],
    });
  }

  return (
    <Stack gap="sm" pt="xs">
      {/* 1. Jerarquía de la Ingesta */}
      <Paper p="xs" withBorder radius="md" bg={isMainMeal ? 'blue.0' : 'gray.0'}>
        <Group justify="space-between" align="center">
          <Box style={{ flex: 1 }}>
            <Group gap={6} align="center">
              <Text size="xs" fw={700} c={isMainMeal ? 'blue.9' : 'dark.7'}>
                {isMainMeal ? 'Comida principal' : 'Toma ligera / secundaria'}
              </Text>
              <Text size="11px" fw={600} c={isMainMeal ? 'blue.7' : 'dimmed'}>
                ● {isMainMeal ? 'Plato fuerte cocinado' : 'Desayuno / Snack / Colación'}
              </Text>
            </Group>
            <Text size="11px" c="dimmed" mt={2}>
              {isMainMeal
                ? 'Ingesta principal del día. Incluye fuentes principales cocinadas de carnes, pescados, arroces o pastas.'
                : 'Toma secundaria previa. Enfocada en alimentos de fácil asimilación: huevos, panes, avena, fruta o lácteos magros.'}
            </Text>
          </Box>
          <Switch
            checked={isMainMeal}
            onChange={(e) => onChange({ isMainMeal: e.currentTarget.checked })}
            color="blue"
            size="sm"
          />
        </Group>
      </Paper>

      {/* 2. Modo Rotación Variada vs Pauta Específica */}
      <Paper p="xs" withBorder radius="md" bg={isComplete ? 'teal.0' : 'gray.0'}>
        <Group justify="space-between" align="center">
          <Box style={{ flex: 1 }}>
            <Text size="xs" fw={700} c={isComplete ? 'teal.9' : 'dark.7'}>
              Rotación variada (buffet oficial del club)
            </Text>
            <Text size="11px" c="dimmed">
              El jugador selecciona libremente entre las opciones aptas y de fácil digestión de la cocina del equipo.
            </Text>
          </Box>
          <Switch
            checked={isComplete}
            onChange={(e) => onChange({ isComplete: e.currentTarget.checked, alternativas: [] })}
            color="teal"
            size="sm"
          />
        </Group>
      </Paper>

      {/* 3. Configuración de Componentes (Asistente IA + MultiSelects filtrados por el perfil clínico del jugador) */}
      {!isComplete ? (
        <Stack gap="xs">
          {/* Asistente IA de Clasificación */}
          <Paper p="xs" withBorder radius="md" bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
            <Stack gap={6}>
              <Group justify="space-between" align="center">
                <Group gap={6}>
                  <IconSparkles size={15} color="#1c7ed6" />
                  <Text size="xs" fw={700} c="blue.9">
                    Asistente de Clasificación con IA
                  </Text>
                </Group>
                <Button
                  size="compact-xs"
                  variant="filled"
                  color="blue"
                  radius="xl"
                  leftSection={<IconSparkles size={12} />}
                  onClick={handleInterpretWithAI}
                  loading={isAnalyzing}
                >
                  Interpretar con IA
                </Button>
              </Group>

              <Textarea
                placeholder="Escribe o pega lo que suele tomar el jugador... Ej: Arroz blanco con pechuga de pollo a la plancha y plátano"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                minRows={2}
                maxRows={3}
                size="xs"
              />

              {aiError && (
                <Alert
                  icon={<IconAlertCircle size={14} />}
                  title="Aviso de interpretación"
                  color="red"
                  variant="light"
                  p="xs"
                >
                  <Text size="xs">{aiError}</Text>
                </Alert>
              )}
            </Stack>
          </Paper>

          {alternativas.length > 0 && (
            <Paper p="xs" withBorder radius="sm" bg="yellow.0">
              <Text size="xs" fw={700} c="yellow.9" mb={2}>
                Alternativas completas detectadas
              </Text>
              <Text size="xs" c="dark.7">
                {alternativas.map((a, i) => `${i > 0 ? ' / ' : ''}${a.label || a.nombre || `Alternativa ${i + 1}`}`).join('')}
              </Text>
              <Text size="11px" c="dimmed" mt={2}>
                Se elegirá una opción entera sin mezclar ingredientes de otras alternativas.
              </Text>
            </Paper>
          )}

          <Group justify="space-between" align="center" mt={2}>
            <Text size="11px" fw={700} c="dimmed" tt="uppercase">
              Componentes del Catálogo Aptos para el Jugador
            </Text>
            <Text size="10px" c="dimmed">
              Filtro clínico aplicado según alergias y preferencias
            </Text>
          </Group>

          <MultiSelect
            label="Hidratos de carbono y tubérculos"
            placeholder="Buscar y seleccionar hidratos aptos..."
            data={hidratoOptions}
            value={hidrato}
            onChange={(val) => handleManualUpdate({ hidrato: val })}
            searchable
            clearable
            comboboxProps={{ zIndex: 2500, withinPortal: true }}
            size="xs"
          />

          <MultiSelect
            label="Proteínas"
            placeholder="Buscar y seleccionar proteínas aptas..."
            data={proteinaOptions}
            value={proteina}
            onChange={(val) => handleManualUpdate({ proteina: val })}
            searchable
            clearable
            comboboxProps={{ zIndex: 2500, withinPortal: true }}
            size="xs"
          />

          <MultiSelect
            label="Verduras y ensaladas"
            placeholder="Buscar y seleccionar verduras aptas..."
            data={verduraOptions}
            value={verdura}
            onChange={(val) => handleManualUpdate({ verdura: val })}
            searchable
            clearable
            comboboxProps={{ zIndex: 2500, withinPortal: true }}
            size="xs"
          />

          <MultiSelect
            label="Frutas"
            placeholder="Buscar y seleccionar frutas aptas..."
            data={frutaOptions}
            value={fruta}
            onChange={(val) => handleManualUpdate({ fruta: val })}
            searchable
            clearable
            comboboxProps={{ zIndex: 2500, withinPortal: true }}
            size="xs"
          />

          <MultiSelect
            label="Lácteos, yogures y postres"
            placeholder="Buscar y seleccionar lácteos o postres aptos..."
            data={lacteoOptions}
            value={lacteo}
            onChange={(val) => handleManualUpdate({ lacteo: val })}
            searchable
            clearable
            comboboxProps={{ zIndex: 2500, withinPortal: true }}
            size="xs"
          />

          <Select
            label="Grasa añadida / aliño"
            placeholder="Seleccionar aliño ligero apto..."
            data={grasaOptions}
            value={grasa}
            onChange={(val) => handleManualUpdate({ grasa: val })}
            clearable
            comboboxProps={{ zIndex: 2500, withinPortal: true }}
            size="xs"
          />
        </Stack>
      ) : (
        <Box py="sm" style={{ textAlign: 'center' }}>
          <Text size="xs" c="teal.8" fw={600}>
            ● Esta toma utilizará la rotación completa del buffet oficial del club.
          </Text>
        </Box>
      )}

      {/* Resumen en tiempo real de la toma */}
      <Paper p="xs" radius="sm" bg="gray.1" withBorder>
        <Text size="11px" fw={700} c="dimmed" tt="uppercase" mb={2}>
          Resumen configurado para {mealName}:
        </Text>
        <Text size="xs" c="dark.7">
          {getMealSummaryText({ isComplete, alternativas, hidrato, proteina, verdura, fruta, lacteo, grasa })}
        </Text>
      </Paper>
    </Stack>
  );
}

/**
 * Filtra de forma no destructiva las opciones canónicas del árbol oficial
 * según el perfil clínico de un jugador concreto (alergias, intolerancias, etc.).
 * Mantiene intacto el archivo global config/food-tree-options.js.
 */
function getPlayerFilteredFoodOptions(jugador) {
  const rawProteina = getTreeProteinaOptions();
  const rawHidrato = getTreeHidratoOptions();
  const rawVerdura = getTreeVerduraOptions();
  const rawFruta = getTreeFrutaOptions();
  const rawLacteo = getTreeLacteoOptions();
  const rawGrasa = getTreeGrasaOptions();

  if (!jugador) {
    return {
      proteina: rawProteina,
      hidrato: rawHidrato,
      verdura: rawVerdura,
      fruta: rawFruta,
      lacteo: rawLacteo,
      grasa: rawGrasa,
    };
  }

  let clinicalCatalog;
  try {
    clinicalCatalog = getClinicalCatalogForPlayer(jugador);
  } catch {
    return {
      proteina: rawProteina,
      hidrato: rawHidrato,
      verdura: rawVerdura,
      fruta: rawFruta,
      lacteo: rawLacteo,
      grasa: rawGrasa,
    };
  }

  const allowedFoodNames = new Set(
    Array.isArray(clinicalCatalog?.foods) ? clinicalCatalog.foods.map((f) => f.name) : []
  );
  const activeTags = new Set(
    Array.isArray(clinicalCatalog?.activeTags) ? clinicalCatalog.activeTags : []
  );

  const isVegan = activeTags.has('vegano');
  const isVegetarian = activeTags.has('vegetariano') || isVegan;
  const noMeat = activeTags.has('sin_carne_roja');
  const noPork = activeTags.has('sin_cerdo');
  const noFish = activeTags.has('sin_pescado') || isVegetarian;
  const noSeafood = activeTags.has('sin_marisco') || isVegetarian;
  const noEgg = activeTags.has('sin_huevo') || isVegan;
  const noNuts = activeTags.has('sin_frutos_secos');

  const isGenericForbidden = (val) => {
    if (isVegetarian && (val === 'pollo' || val === 'pavo' || val === 'conejo')) return true;
    if (noMeat && val === 'vacuno') return true;
    if (noPork && (val === 'cerdo' || val === 'embutidos_fiambres')) return true;
    if (noFish && (val === 'pescado_blanco' || val === 'pescado_azul')) return true;
    if (noSeafood && val === 'marisco') return true;
    if (noEgg && val === 'huevos') return true;
    if (isVegan && (val === 'yogures' || val === 'quesos')) return true;
    return false;
  };

  const filterGroups = (groups) => {
    return groups
      .map((g) => {
        if (!Array.isArray(g.items)) return g;
        const filteredItems = g.items.filter((it) => {
          const val = typeof it === 'string' ? it : it?.value;
          if (g.group === 'Opciones Genéricas del Árbol') {
            return !isGenericForbidden(val);
          }
          return allowedFoodNames.has(val);
        });
        return { ...g, items: filteredItems };
      })
      .filter((g) => !Array.isArray(g.items) || g.items.length > 0);
  };

  const filterGrasa = (grasaList) => {
    return grasaList.filter((item) => {
      const val = typeof item === 'string' ? item : item?.value;
      if (noNuts && val === 'Frutos secos') return false;
      return true;
    });
  };

  return {
    proteina: filterGroups(rawProteina),
    hidrato: filterGroups(rawHidrato),
    verdura: filterGroups(rawVerdura),
    fruta: filterGroups(rawFruta),
    lacteo: filterGroups(rawLacteo),
    grasa: filterGrasa(rawGrasa),
  };
}

/**
 * PrepartidoRoutineModal
 *
 * Modal unificado y concentrado para la configuración integral de rutinas pre-partido.
 * Permite seleccionar las tomas que forman el protocolo (desayuno, comida, cena previa, etc.),
 * post-partido y configurar las pautas nutricionales de TODAS las tomas dentro de un único diálogo.
 * Estrictamente limitado a alimentos del Árbol Nutricional para preservar la integridad del sistema.
 */
export default function PrepartidoRoutineModal({
  opened,
  onClose,
  scheduleKey,
  scheduleLabel,
  initialConfig = {},
  onSave,
  onDeactivate,
  initialActiveMeal = null,
  jugadorId = null,
  jugador = null,
}) {
  const scheduleDetail = SCHEDULE_DETAILS[scheduleKey] || {
    label: scheduleLabel || scheduleKey,
    description: 'Protocolo de preparación para partido',
    recommendedMeals: ['Cena', 'Desayuno', 'Comida'],
  };

  // 1. Ingestas seleccionadas
  const [selectedMeals, setSelectedMeals] = useState([]);
  // 2. Post-partido toggle
  const [postentreno, setPostentreno] = useState(true);
  // 3. Recomendaciones por comida { [meal]: mealData }
  const [recs, setRecs] = useState({});
  // 4. Acordeones abiertos
  const [openedAccordionItems, setOpenedAccordionItems] = useState([]);
  // 5. Estado de guardado
  const [saving, setSaving] = useState(false);

  // Opciones de alimentos cacheadas del árbol oficial, filtradas según el perfil clínico del jugador
  const baseFoodOptions = useMemo(() => getPlayerFilteredFoodOptions(jugador), [jugador]);

  // Sets de validación estricta para garantizar que solo existen opciones del árbol
  const validTreeSets = useMemo(
    () => ({
      proteina: extractValidValuesSet(baseFoodOptions.proteina),
      hidrato: extractValidValuesSet(baseFoodOptions.hidrato),
      verdura: extractValidValuesSet(baseFoodOptions.verdura),
      fruta: extractValidValuesSet(baseFoodOptions.fruta),
      lacteo: extractValidValuesSet(baseFoodOptions.lacteo),
      grasa: extractValidValuesSet(baseFoodOptions.grasa),
    }),
    [baseFoodOptions]
  );

  const recommendedMeals = scheduleDetail.recommendedMeals;

  // Inicialización de estado cuando abre el modal
  useEffect(() => {
    if (opened) {
      const cfg = initialConfig || {};
      const rawMeals = Array.isArray(cfg.ingestas) && cfg.ingestas.length > 0
        ? cfg.ingestas
        : recommendedMeals;

      const sorted = sortPreMatchMealsChronological(scheduleKey, rawMeals);
      setSelectedMeals(sorted);

      const hasPost = cfg.postentreno !== undefined ? Boolean(cfg.postentreno) : true;
      setPostentreno(hasPost);

      // Recomendaciones existentes
      const currentRecs = { ...(cfg.recomendaciones || {}) };
      if (cfg.dia_anterior && !currentRecs.Cena && !currentRecs.cena) {
        currentRecs.Cena = cfg.dia_anterior;
      }

      // Asegurar que cada comida seleccionada tenga un objeto base
      sorted.forEach((m) => {
        if (!currentRecs[m]) {
          currentRecs[m] = {
            isMainMeal: checkIsMainMeal(m, {}),
            isComplete: true, // rotación variada por defecto
            proteina: [],
            hidrato: [],
            verdura: [],
            fruta: [],
            lacteo: [],
            grasa: null,
            alternativas: [],
            raw: '',
          };
        }
      });
      setRecs(currentRecs);

      // Si se indicó una comida inicial activa, abrirla; si no, abrir la primera
      if (initialActiveMeal && sorted.includes(initialActiveMeal)) {
        setOpenedAccordionItems([initialActiveMeal]);
      } else if (sorted.length > 0) {
        setOpenedAccordionItems([sorted[0]]);
      } else {
        setOpenedAccordionItems([]);
      }
    }
  }, [opened, scheduleKey, initialConfig, initialActiveMeal, recommendedMeals]);

  // Añadir una toma al protocolo
  function handleAddMeal(mealName) {
    if (!mealName || selectedMeals.includes(mealName)) return;
    const next = sortPreMatchMealsChronological(scheduleKey, [...selectedMeals, mealName]);
    setSelectedMeals(next);

    // Inicializar recomendación si no existe
    if (!recs[mealName]) {
      setRecs((prev) => ({
        ...prev,
        [mealName]: {
          isMainMeal: checkIsMainMeal(mealName, {}),
          isComplete: true,
          proteina: [],
          hidrato: [],
          verdura: [],
          fruta: [],
          lacteo: [],
          grasa: null,
          alternativas: [],
          raw: '',
        },
      }));
    }

    // Auto-expandir la nueva toma para configurar su pauta inmediatamente
    setOpenedAccordionItems((prev) => Array.from(new Set([...prev, mealName])));
  }

  // Quitar una toma del protocolo
  function handleRemoveMeal(mealName) {
    const next = selectedMeals.filter((m) => m !== mealName);
    setSelectedMeals(next);
    setOpenedAccordionItems((prev) => prev.filter((item) => item !== mealName));
  }

  // Manejo de cambio en el selector general de ingestas
  function handleMealsSelectChange(newValues) {
    const validMealValues = new Set(AVAILABLE_MEALS.map((m) => m.value));
    const safeMeals = newValues.filter((v) => validMealValues.has(v));
    const added = safeMeals.filter((v) => !selectedMeals.includes(v));
    const sorted = sortPreMatchMealsChronological(scheduleKey, safeMeals);
    setSelectedMeals(sorted);

    // Si se añadió una nueva, inicializar y expandir
    if (added.length > 0) {
      setRecs((prev) => {
        const copy = { ...prev };
        added.forEach((m) => {
          if (!copy[m]) {
            copy[m] = {
              isMainMeal: checkIsMainMeal(m, {}),
              isComplete: true,
              proteina: [],
              hidrato: [],
              verdura: [],
              fruta: [],
              lacteo: [],
              grasa: null,
              alternativas: [],
              raw: '',
            };
          }
        });
        return copy;
      });
      setOpenedAccordionItems((prev) => Array.from(new Set([...prev, ...added])));
    }
  }

  // Actualizar la recomendación de una comida individual
  function handleMealRecChange(mealName, patch) {
    setRecs((prev) => ({
      ...prev,
      [mealName]: {
        ...(prev[mealName] || {}),
        ...patch,
      },
    }));
  }

  // Cargar tomas recomendadas si estuviera vacío
  function handleLoadDefaults() {
    const defaults = scheduleDetail.recommendedMeals;
    const sorted = sortPreMatchMealsChronological(scheduleKey, defaults);
    setSelectedMeals(sorted);
    setRecs((prev) => {
      const copy = { ...prev };
      sorted.forEach((m) => {
        if (!copy[m]) {
          copy[m] = {
            isMainMeal: checkIsMainMeal(m, {}),
            isComplete: true,
            proteina: [],
            hidrato: [],
            verdura: [],
            fruta: [],
            lacteo: [],
            grasa: null,
            alternativas: [],
            raw: '',
          };
        }
      });
      return copy;
    });
    setOpenedAccordionItems([sorted[0]]);
  }

  // Guardar todo concentrado garantizando que solo viajan datos del árbol
  async function handleSaveAll() {
    setSaving(true);
    try {
      const finalMeals = sortPreMatchMealsChronological(scheduleKey, selectedMeals);
      const finalRecs = {};
      finalMeals.forEach((m) => {
        finalRecs[m] = buildMealPatternData(m, recs[m] || {}, validTreeSets);
      });

      const updatedScheduleConfig = {
        ingestas: finalMeals,
        postentreno: Boolean(postentreno),
        recomendaciones: finalRecs,
      };

      await onSave(scheduleKey, updatedScheduleConfig);
      onClose();
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al guardar rutina',
        message: e.message || 'No se pudo guardar la rutina pre-partido.',
      });
    } finally {
      setSaving(false);
    }
  }

  // Desactivar rutina
  async function handleDeactivateClick() {
    if (!onDeactivate) return;
    setSaving(true);
    try {
      await onDeactivate(scheduleKey);
      onClose();
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al desactivar rutina',
        message: e.message || 'No se pudo desactivar la rutina.',
      });
    } finally {
      setSaving(false);
    }
  }

  const isConfiguredAlready = Boolean(
    initialConfig &&
      ((Array.isArray(initialConfig.ingestas) && initialConfig.ingestas.length > 0) ||
        (initialConfig.recomendaciones && Object.keys(initialConfig.recomendaciones).length > 0))
  );

  // Tomas disponibles para añadir que aún no están seleccionadas
  const unselectedMeals = AVAILABLE_MEALS.filter((m) => !selectedMeals.includes(m.value));

  return (
    <ResponsiveModal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs" align="center">
          <IconClipboardList size={22} />
          <Box>
            <Text fw={700} size="md">
              Rutina Pre-Partido: {scheduleDetail.label}
            </Text>
            <Text size="xs" c="dimmed">
              {scheduleDetail.description}
            </Text>
          </Box>
        </Group>
      }
      size="xl"
      radius="md"
      styles={{
        body: {
          overflowY: 'auto',
          maxHeight: 'calc(92vh - 65px)',
        },
      }}
    >
      <Stack gap="md">
        {/* =========================================================================
            1. CONFIGURACIÓN GENERAL: SELECCIÓN DE TOMAS Y POST-PARTIDO
           ========================================================================= */}
        <Paper p="sm" withBorder radius="md" bg="gray.0">
          <Stack gap="xs">
            <Group justify="space-between" align="center" wrap="wrap">
              <Box>
                <Text size="xs" fw={700} c="dark.8">
                  Tomas incluidas en el protocolo
                </Text>
                <Text size="11px" c="dimmed">
                  Selecciona qué ingestas componen la preparación (la cena corresponde a la carga nutricional de la noche previa).
                </Text>
              </Box>

              {/* Botón rápido de tomas recomendadas */}
              {selectedMeals.length === 0 && (
                <Button size="compact-xs" variant="light" color="blue" radius="xl" onClick={handleLoadDefaults}>
                  Cargar tomas recomendadas
                </Button>
              )}
            </Group>

            <MultiSelect
              placeholder="Ej. Cena, Desayuno, Comida..."
              data={AVAILABLE_MEALS}
              value={selectedMeals}
              onChange={handleMealsSelectChange}
              size="xs"
              searchable
              clearable
              comboboxProps={{ zIndex: 2500, withinPortal: true }}
            />

            {/* Chips rápidos para añadir tomas faltantes con un solo clic */}
            {unselectedMeals.length > 0 && (
              <Group gap={6} align="center">
                <Text size="11px" fw={600} c="dimmed">
                  Añadir toma rápida:
                </Text>
                {unselectedMeals.map((m) => (
                  <Button
                    key={m.value}
                    variant="light"
                    color="gray"
                    size="compact-xs"
                    radius="xl"
                    leftSection={<IconPlus size={11} />}
                    onClick={() => handleAddMeal(m.value)}
                  >
                    {m.label}
                  </Button>
                ))}
              </Group>
            )}

            <Divider my={2} />

            <Switch
              label="Incluir toma Post-partido / Batido de recuperación"
              description="Añade automáticamente la ventana de recuperación post-partido al finalizar el encuentro."
              checked={postentreno}
              onChange={(e) => setPostentreno(e.currentTarget.checked)}
              color="teal"
              size="xs"
            />
          </Stack>
        </Paper>

        {/* =========================================================================
            2. PAUTAS NUTRICIONALES CONCENTRADAS POR INGESTA (Acordeón)
           ========================================================================= */}
        <Box>
          <Group justify="space-between" align="center" mb={6}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Pautas de las Ingestas ({selectedMeals.length})
            </Text>
            {selectedMeals.length > 0 && (
              <Group gap={6}>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => setOpenedAccordionItems(selectedMeals)}
                >
                  Expandir todas
                </Button>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => setOpenedAccordionItems([])}
                >
                  Colapsar todas
                </Button>
              </Group>
            )}
          </Group>

          {selectedMeals.length === 0 ? (
            <Paper p="md" withBorder radius="md" bg="gray.0" style={{ textAlign: 'center' }}>
              <Text size="sm" c="dimmed" mb="xs">
                No hay tomas seleccionadas para este protocolo pre-partido.
              </Text>
              <Button size="xs" variant="filled" color="dark" radius="xl" onClick={handleLoadDefaults}>
                Cargar tomas recomendadas ({scheduleDetail.recommendedMeals.join(', ')})
              </Button>
            </Paper>
          ) : (
            <Accordion
              multiple
              variant="separated"
              radius="md"
              value={openedAccordionItems}
              onChange={setOpenedAccordionItems}
            >
              {selectedMeals.map((meal) => {
                const mealData = recs[meal] || {};
                const timingBadge = getMealTimingBadge(scheduleKey, meal);
                const isMain = mealData.isMainMeal !== undefined ? Boolean(mealData.isMainMeal) : checkIsMainMeal(meal, mealData);
                const summary = getMealSummaryText(mealData);

                return (
                  <Accordion.Item key={meal} value={meal}>
                    <Accordion.Control>
                      <Group justify="space-between" align="center" wrap="nowrap" pr="xs">
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Group gap="xs" align="center" wrap="wrap">
                            <Text size="sm" fw={700} c="dark.8">
                              {meal}
                            </Text>
                            <Text size="xs" c="dimmed">
                              ({timingBadge})
                            </Text>
                            <Text size="11px" fw={600} c={isMain ? 'blue.7' : 'dimmed'}>
                              ● {isMain ? 'Comida principal' : 'Toma ligera'}
                            </Text>
                          </Group>

                          <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                            ● {summary}
                          </Text>
                        </Box>

                        <Tooltip label={`Quitar ${meal} del protocolo`} withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            radius="xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMeal(meal);
                            }}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Accordion.Control>

                    <Accordion.Panel>
                      <SingleMealPautaEditor
                        mealName={meal}
                        mealData={mealData}
                        onChange={(patch) => handleMealRecChange(meal, patch)}
                        baseFoodOptions={baseFoodOptions}
                        validTreeSets={validTreeSets}
                        jugadorId={jugadorId}
                        jugador={jugador}
                      />
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          )}
        </Box>

        {/* =========================================================================
            3. ACCIONES DEL MODAL
           ========================================================================= */}
        <Box
          style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: '#ffffff',
            paddingTop: 12,
            paddingBottom: 4,
            zIndex: 10,
            borderTop: '1px solid var(--mantine-color-gray-2)',
            marginTop: 8,
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap">
            <Box>
              {isConfiguredAlready && onDeactivate && (
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  radius="xl"
                  leftSection={<IconTrash size={13} />}
                  onClick={handleDeactivateClick}
                  disabled={saving}
                >
                  Desactivar protocolo
                </Button>
              )}
            </Box>

            <Group gap="xs">
              <Button variant="subtle" color="gray" size="sm" radius="xl" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button
                variant="filled"
                color="dark"
                size="sm"
                radius="xl"
                onClick={handleSaveAll}
                loading={saving}
                leftSection={<IconCheck size={14} />}
              >
                Guardar rutina completa
              </Button>
            </Group>
          </Group>
        </Box>
      </Stack>
    </ResponsiveModal>
  );
}
