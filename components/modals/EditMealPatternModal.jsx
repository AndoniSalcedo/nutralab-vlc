'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Paper,
  MultiSelect,
  Select,
  Switch,
  Textarea,
  Alert,
  Box,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSparkles, IconAlertCircle, IconCheck, IconX } from '@/components/icons3d';
import { parseMealTree } from '@/actions/mealActions';
import {
  getTreeProteinaOptions,
  getTreeHidratoOptions,
  getTreeVerduraOptions,
  getTreeFrutaOptions,
  getTreeLacteoOptions,
  getTreeGrasaOptions,
} from '@/config/food-tree-options';
import { isMainMeal as checkIsMainMeal } from '@/config/nutrition-days';

function ensureOptionsContain(options, currentValues) {
  if (!currentValues) return options;
  const valuesArray = Array.isArray(currentValues) ? currentValues : [currentValues];
  const allExistingValues = new Set();
  options.forEach((group) => {
    if (group.items) {
      group.items.forEach((it) => allExistingValues.add(typeof it === 'string' ? it : it.value));
    } else if (group.value) {
      allExistingValues.add(group.value);
    }
  });

  const missing = valuesArray.filter((v) => v && !allExistingValues.has(v));
  if (missing.length === 0) return options;

  return [
    {
      group: 'Valores Actuales Registrados',
      items: missing.map((m) => ({ value: m, label: m })),
    },
    ...options,
  ];
}

export default function EditMealPatternModal({
  opened,
  onClose,
  mealName,
  timing = null,
  value = null,
  onSave,
  jugadorId = null,
}) {
  const [isMainMeal, setIsMainMeal] = useState(() => checkIsMainMeal(mealName, value));
  const [isComplete, setIsComplete] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState(null);

  const [proteina, setProteina] = useState([]);
  const [hidrato, setHidrato] = useState([]);
  const [verdura, setVerdura] = useState([]);
  const [fruta, setFruta] = useState([]);
  const [lacteo, setLacteo] = useState([]);
  const [grasa, setGrasa] = useState(null);
  const [alternativas, setAlternativas] = useState([]);

  useEffect(() => {
    if (opened) {
      setAiError(null);
      const val = value || {};

      setIsMainMeal(checkIsMainMeal(mealName, val));

      // Detectar si es árbol completo
      const complete = Boolean(val.isComplete);
      setIsComplete(complete);

      // Texto raw previo
      setAiText(val.raw || '');

      // Listas tipadas
      const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
      setProteina(toArray(val.proteina));
      setHidrato(toArray(val.hidrato));
      setVerdura(toArray(val.verdura));
      setFruta(toArray(val.fruta));
      setLacteo(toArray(val.lacteo));
      setGrasa(val.grasa || null);
      setAlternativas(Array.isArray(val.alternativas) ? val.alternativas : []);
    }
  }, [opened, value, mealName]);

  function updateManualValue(setter) {
    return (nextValue) => {
      setAlternativas([]);
      setter(nextValue);
    };
  }

  const baseProteinaOptions = useMemo(() => getTreeProteinaOptions(), []);
  const baseHidratoOptions = useMemo(() => getTreeHidratoOptions(), []);
  const baseVerduraOptions = useMemo(() => getTreeVerduraOptions(), []);
  const baseFrutaOptions = useMemo(() => getTreeFrutaOptions(), []);
  const baseLacteoOptions = useMemo(() => getTreeLacteoOptions(), []);
  const baseGrasaOptions = useMemo(() => getTreeGrasaOptions(), []);

  const proteinaOptions = useMemo(() => ensureOptionsContain(baseProteinaOptions, proteina), [baseProteinaOptions, proteina]);
  const hidratoOptions = useMemo(() => ensureOptionsContain(baseHidratoOptions, hidrato), [baseHidratoOptions, hidrato]);
  const verduraOptions = useMemo(() => ensureOptionsContain(baseVerduraOptions, verdura), [baseVerduraOptions, verdura]);
  const frutaOptions = useMemo(() => ensureOptionsContain(baseFrutaOptions, fruta), [baseFrutaOptions, fruta]);
  const lacteoOptions = useMemo(() => ensureOptionsContain(baseLacteoOptions, lacteo), [baseLacteoOptions, lacteo]);

  async function handleInterpretWithAI() {
    if (!aiText.trim()) {
      setIsComplete(true);
      setProteina([]);
      setHidrato([]);
      setVerdura([]);
      setFruta([]);
      setLacteo([]);
      setGrasa(null);
      setAlternativas([]);
      setAiError(null);
      return;
    }

    setIsAnalyzing(true);
    setAiError(null);
    try {
      const data = await parseMealTree({
        text: aiText,
        mealName: mealName || 'Comida',
        jugadorId,
      });

      const mealData = data.tree || Object.values(data.results || {})[0];
      if (!mealData) {
        setAiError('Respuesta inesperada del analizador.');
        return;
      }

      if (mealData.isComplete) {
        setIsComplete(true);
        setProteina([]);
        setHidrato([]);
        setVerdura([]);
        setFruta([]);
        setLacteo([]);
        setGrasa(null);
        setAlternativas([]);
      } else {
        setIsComplete(false);
        setProteina(mealData.alternativas?.length ? [] : (mealData.proteina || []));
        setHidrato(mealData.alternativas?.length ? [] : (mealData.hidrato || []));
        setVerdura(mealData.alternativas?.length ? [] : (mealData.verdura || []));
        setFruta(mealData.alternativas?.length ? [] : (mealData.fruta || []));
        setLacteo(mealData.alternativas?.length ? [] : (mealData.lacteo || []));
        setGrasa(mealData.alternativas?.length ? null : (mealData.grasa || null));
        setAlternativas(Array.isArray(mealData.alternativas) ? mealData.alternativas : []);
      }

      notifications.show({
        color: 'teal',
        title: 'Interpretación completada',
        message: 'Las categorías se han clasificado correctamente.',
        icon: <IconCheck size={16} />,
      });
    } catch (err) {
      setAiError(err.message || 'Error de conexión con el servicio de IA.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSave() {
    const allParts = [
      ...hidrato,
      ...proteina,
      ...verdura,
      ...fruta,
      ...lacteo,
      ...(grasa && grasa !== 'Sin grasa añadida' ? [grasa] : []),
    ];

    const hasAlternatives = !isComplete && alternativas.length > 0;
    const label = hasAlternatives
      ? alternativas.map((alternative, index) => alternative.label || alternative.nombre || `Alternativa ${index + 1}`).join(' / ')
      : isComplete
      ? 'Rotación variada'
      : allParts.length > 0
      ? allParts.join(' + ')
      : 'Rotación variada';

    const structuredMeal = {
      isMainMeal: Boolean(isMainMeal),
      isComplete: isComplete || (!hasAlternatives && allParts.length === 0),
      proteina: isComplete || hasAlternatives ? [] : proteina,
      hidrato: isComplete || hasAlternatives ? [] : hidrato,
      verdura: isComplete || hasAlternatives ? [] : verdura,
      fruta: isComplete || hasAlternatives ? [] : fruta,
      lacteo: isComplete || hasAlternatives ? [] : lacteo,
      grasa: isComplete || hasAlternatives ? null : (grasa && grasa !== 'Sin grasa añadida' ? grasa : null),
      alternativas: hasAlternatives ? alternativas : [],
      raw: aiText.trim() || label,
      label,
      isValid: true,
      unrecognized: [],
    };

    onSave(structuredMeal);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={700} size="md">
            Pauta Nutricional: {mealName}
          </Text>
          {timing && (
            <Text size="xs" c="dimmed">
              ({timing})
            </Text>
          )}
        </Group>
      }
      size="lg"
      radius="md"
    >
      <Stack gap="md">
        {/* Jerarquía de ingesta: Comida Principal vs Toma Ligera */}
        <Paper p="sm" withBorder radius="sm" bg={isMainMeal ? 'blue.0' : 'gray.0'}>
          <Group justify="space-between" align="center">
            <Box style={{ flex: 1 }}>
              <Group gap={6} align="center">
                <Text size="sm" fw={600} c={isMainMeal ? 'blue.9' : 'dark.7'}>
                  {isMainMeal ? 'Comida principal' : 'Toma ligera / secundaria'}
                </Text>
                <Text size="11px" fw={600} c={isMainMeal ? 'blue.7' : 'dimmed'}>
                  ● {isMainMeal ? 'Plato fuerte cocinado' : 'Desayuno / Merienda / Snack'}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt={2}>
                {isMainMeal
                  ? 'Ingesta principal del día (almuerzo o cena). Permite carnes y pescados cocinados en cocina.'
                  : 'Toma secundaria o ligera. Enfocada en alimentos ligeros: huevos, lácteos, fiambres magros, conservas, panes y fruta.'}
              </Text>
            </Box>
            <Switch
              checked={isMainMeal}
              onChange={(e) => setIsMainMeal(e.currentTarget.checked)}
              color="blue"
              size="md"
            />
          </Group>
        </Paper>

        {/* Toggle Árbol Completo */}
        <Paper p="sm" withBorder radius="sm" bg={isComplete ? 'teal.0' : 'gray.0'}>
          <Group justify="space-between" align="center">
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={600} c={isComplete ? 'teal.9' : 'dark.7'}>
                Rotación variada (pauta abierta)
              </Text>
              <Text size="xs" c="dimmed">
                El jugador rota libremente entre las opciones aptas y saludables de la cocina sin restricciones fijas.
              </Text>
            </Box>
            <Switch
              checked={isComplete}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setIsComplete(checked);
                if (checked) setAlternativas([]);
              }}
              color="teal"
              size="md"
            />
          </Group>
        </Paper>

        {/* Asistente IA para escribir texto libre y clasificar */}
        {!isComplete && (
          <Paper p="sm" withBorder radius="sm" bg="blue.0">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Group gap={6}>
                  <IconSparkles size={16} color="#1c7ed6" />
                  <Text size="xs" fw={700} c="blue.9">
                    Asistente de Clasificación con IA
                  </Text>
                </Group>
                <Button
                  size="compact-xs"
                  variant="filled"
                  color="blue"
                  radius="xl"
                  leftSection={<IconSparkles size={13} />}
                  onClick={handleInterpretWithAI}
                  loading={isAnalyzing}
                >
                  Interpretar con IA
                </Button>
              </Group>

              <Textarea
                placeholder="Escribe o pega lo que suele tomar el jugador... Ej: Arroz con tomate y huevos plancha + pollo con patata + arroz con leche"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                minRows={2}
                maxRows={3}
                size="xs"
              />

              {aiError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Término no reconocido"
                  color="red"
                  variant="light"
                  p="xs"
                >
                  <Text size="xs">{aiError}</Text>
                </Alert>
              )}
            </Stack>
          </Paper>
        )}

        {/* Selectores tipados por categoría */}
        {!isComplete ? (
          <Stack gap="sm">
            {alternativas.length > 0 && (
              <Paper p="xs" withBorder radius="sm" bg="yellow.0">
                <Text size="xs" fw={700} c="yellow.9" mb={4}>
                  Opciones completas detectadas
                </Text>
                <Text size="xs" c="dark.7">
                  {alternativas.map((alternative, index) => (
                    `${index > 0 ? ' / ' : ''}${alternative.label || alternative.nombre || `Alternativa ${index + 1}`}`
                  )).join('')}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Se elegirá una opción entera; sus ingredientes no se mezclarán con los de las demás.
                </Text>
              </Paper>
            )}

            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Componentes de la pauta
            </Text>

            <MultiSelect
              label="Hidratos de carbono y tubérculos"
              placeholder="Seleccionar hidratos..."
              data={hidratoOptions}
              value={hidrato}
              onChange={updateManualValue(setHidrato)}
              searchable
              clearable
              size="xs"
            />

            <MultiSelect
              label="Proteínas"
              placeholder="Seleccionar fuentes de proteína..."
              data={proteinaOptions}
              value={proteina}
              onChange={updateManualValue(setProteina)}
              searchable
              clearable
              size="xs"
            />

            <MultiSelect
              label="Verduras y ensaladas"
              placeholder="Seleccionar verduras / hojas verdes..."
              data={verduraOptions}
              value={verdura}
              onChange={updateManualValue(setVerdura)}
              searchable
              clearable
              size="xs"
            />

            <MultiSelect
              label="Frutas"
              placeholder="Seleccionar frutas..."
              data={frutaOptions}
              value={fruta}
              onChange={updateManualValue(setFruta)}
              searchable
              clearable
              size="xs"
            />

            <MultiSelect
              label="Lácteos, yogures y postres"
              placeholder="Seleccionar lácteos o postres..."
              data={lacteoOptions}
              value={lacteo}
              onChange={updateManualValue(setLacteo)}
              searchable
              clearable
              size="xs"
            />

            <Select
              label="Grasa añadida / aliño"
              placeholder="Seleccionar grasa..."
              data={baseGrasaOptions}
              value={grasa}
              onChange={updateManualValue(setGrasa)}
              clearable
              size="xs"
            />
          </Stack>
        ) : (
          <Box py="md" style={{ textAlign: 'center' }}>
            <Text size="sm" c="teal.8" fw={500}>
              ● Esta toma utilizará la rotación completa del buffet oficial del club.
            </Text>
          </Box>
        )}

        <Divider />

        {/* Resumen tipográfico de la pauta */}
        <Box>
          <Text size="xs" fw={700} c="dimmed" mb={4}>
            Resumen de la toma configurada:
          </Text>
          <Text size="xs" mb={3}>
            <Text span fw={600} c={isMainMeal ? 'blue.8' : 'dimmed'}>● Jerarquía: </Text>
            <Text span c="dark.7" fw={500}>{isMainMeal ? 'Comida principal' : 'Toma ligera / secundaria'}</Text>
          </Text>
          {isComplete ? (
            <Text size="xs" c="teal.8" fw={600}>
              ● Rotación variada y equilibrada
            </Text>
          ) : (
            <Stack gap={3}>
              {hidrato.length > 0 && (
                <Text size="xs">
                  <Text span fw={600} c="orange.8">● Hidratos: </Text>
                  <Text span c="dark.6">{hidrato.join(', ')}</Text>
                </Text>
              )}
              {proteina.length > 0 && (
                <Text size="xs">
                  <Text span fw={600} c="blue.8">● Proteínas: </Text>
                  <Text span c="dark.6">{proteina.join(', ')}</Text>
                </Text>
              )}
              {verdura.length > 0 && (
                <Text size="xs">
                  <Text span fw={600} c="green.8">● Verduras: </Text>
                  <Text span c="dark.6">{verdura.join(', ')}</Text>
                </Text>
              )}
              {fruta.length > 0 && (
                <Text size="xs">
                  <Text span fw={600} c="pink.8">● Frutas: </Text>
                  <Text span c="dark.6">{fruta.join(', ')}</Text>
                </Text>
              )}
              {lacteo.length > 0 && (
                <Text size="xs">
                  <Text span fw={600} c="indigo.8">● Lácteos / Postre: </Text>
                  <Text span c="dark.6">{lacteo.join(', ')}</Text>
                </Text>
              )}
              {grasa && (
                <Text size="xs">
                  <Text span fw={600} c="yellow.9">● Grasa: </Text>
                  <Text span c="dark.6">{grasa}</Text>
                </Text>
              )}
              {hidrato.length === 0 && proteina.length === 0 && verdura.length === 0 && fruta.length === 0 && lacteo.length === 0 && !grasa && (
                <Text size="xs" c="dimmed" fs="italic">
                  Ningún componente seleccionado (se aplicará rotación variada).
                </Text>
              )}
            </Stack>
          )}
        </Box>

        {/* Acciones */}
        <Group justify="flex-end" gap="xs" mt="sm">
          <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={onClose} leftSection={<IconX size={14} />}>
            Cancelar
          </Button>
          <Button variant="filled" color="dark" size="xs" radius="xl" onClick={handleSave} leftSection={<IconCheck size={14} />}>
            Guardar pauta
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
