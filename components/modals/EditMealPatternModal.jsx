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
import {
  getTreeProteinaOptions,
  getTreeHidratoOptions,
  getTreeVerduraOptions,
  getTreeFrutaOptions,
  getTreeLacteoOptions,
  getTreeGrasaOptions,
} from '@/lib/engine';

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

  useEffect(() => {
    if (opened) {
      setAiError(null);
      const val = value || {};

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
    }
  }, [opened, value]);

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
      setAiError(null);
      return;
    }

    setIsAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch('/api/nutrition/parse-meal-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiText,
          mealName: mealName || 'Comida',
          jugadorId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAiError(data.error || 'No se pudo interpretar el texto. Por favor, revisa los términos.');
        return;
      }

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
      } else {
        setIsComplete(false);
        setProteina(mealData.proteina || []);
        setHidrato(mealData.hidrato || []);
        setVerdura(mealData.verdura || []);
        setFruta(mealData.fruta || []);
        setLacteo(mealData.lacteo || []);
        setGrasa(mealData.grasa || null);
      }

      notifications.show({
        color: 'teal',
        title: 'Interpretación completada',
        message: 'Las categorías del árbol nutricional se han clasificado correctamente.',
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

    const label = isComplete
      ? 'Árbol completo (rotación variada)'
      : allParts.length > 0
      ? allParts.join(' + ')
      : 'Árbol completo (rotación variada)';

    const structuredMeal = {
      isComplete: isComplete || allParts.length === 0,
      proteina: isComplete ? [] : proteina,
      hidrato: isComplete ? [] : hidrato,
      verdura: isComplete ? [] : verdura,
      fruta: isComplete ? [] : fruta,
      lacteo: isComplete ? [] : lacteo,
      grasa: isComplete ? null : (grasa && grasa !== 'Sin grasa añadida' ? grasa : null),
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
        {/* Toggle Árbol Completo */}
        <Paper p="sm" withBorder radius="sm" bg={isComplete ? 'teal.0' : 'gray.0'}>
          <Group justify="space-between" align="center">
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={600} c={isComplete ? 'teal.9' : 'dark.7'}>
                Árbol completo (rotación equilibrada)
              </Text>
              <Text size="xs" c="dimmed">
                El jugador rota libremente entre las opciones aptas y saludables de la cocina sin restricciones fijas.
              </Text>
            </Box>
            <Switch
              checked={isComplete}
              onChange={(e) => setIsComplete(e.currentTarget.checked)}
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
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Componentes del Árbol Nutricional
            </Text>

            <MultiSelect
              label="Hidratos de carbono y tubérculos"
              placeholder="Seleccionar hidratos..."
              data={hidratoOptions}
              value={hidrato}
              onChange={setHidrato}
              searchable
              clearable
              size="xs"
            />

            <MultiSelect
              label="Proteínas"
              placeholder="Seleccionar fuentes de proteína..."
              data={proteinaOptions}
              value={proteina}
              onChange={setProteina}
              searchable
              clearable
              size="xs"
            />

            <MultiSelect
              label="Verduras y ensaladas"
              placeholder="Seleccionar verduras / hojas verdes..."
              data={verduraOptions}
              value={verdura}
              onChange={setVerdura}
              searchable
              clearable
              size="xs"
            />

            <MultiSelect
              label="Frutas"
              placeholder="Seleccionar frutas..."
              data={frutaOptions}
              value={fruta}
              onChange={setFruta}
              searchable
              clearable
              size="xs"
            />

            <MultiSelect
              label="Lácteos, yogures y postres"
              placeholder="Seleccionar lácteos o postres..."
              data={lacteoOptions}
              value={lacteo}
              onChange={setLacteo}
              searchable
              clearable
              size="xs"
            />

            <Select
              label="Grasa añadida / aliño"
              placeholder="Seleccionar grasa..."
              data={baseGrasaOptions}
              value={grasa}
              onChange={setGrasa}
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
          {isComplete ? (
            <Text size="xs" c="teal.8" fw={600}>
              ● Árbol completo (rotación variada y equilibrada)
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
                  Ningún componente seleccionado (se tratará como árbol completo).
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
