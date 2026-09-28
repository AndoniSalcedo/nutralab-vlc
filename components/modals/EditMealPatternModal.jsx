'use client';

import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Group,
  Button,
  Paper,
  Switch,
  Textarea,
  Alert,
  Box,
} from '@mantine/core';
import ResponsiveModal from './ResponsiveModal';
import { notifications } from '@mantine/notifications';
import { IconSparkles, IconAlertCircle, IconCheck, IconX } from '@/components/icons3d';
import { parseMealTree } from '@/actions/mealActions';
import { validateMealAst } from '@/lib/engine/meal-ast';
import { isMainMeal as checkIsMainMeal } from '@/config/nutrition-days';

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

  const [tree, setTree] = useState(null);
  const [astLabel, setAstLabel] = useState('');

  useEffect(() => {
    if (opened) {
      setAiError(null);
      const val = value || {};

      setIsMainMeal(checkIsMainMeal(mealName, val));
      setTree(val.tree || null);
      setAstLabel(val.label || '');

      // Detectar si es árbol completo
      const complete = val.type === 'complete';
      setIsComplete(complete);

      // Texto raw previo
      setAiText(val.raw || '');

    }
  }, [opened, value, mealName]);

  async function handleInterpretWithAI() {
    if (!aiText.trim()) {
      setIsComplete(true);
      setTree(null);
      setAstLabel('Rotación variada');
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

      if (mealData.type === 'complete') {
        setIsComplete(true);
        setTree(null);
        setAstLabel(mealData.label || '');
      } else {
        const validation = validateMealAst({ type: 'meal', tree: mealData.tree });
        if (!validation.valid) throw new Error(validation.error);
        setIsComplete(false);
        setTree(mealData.tree || null);
        setAstLabel(mealData.label || '');
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
    const converted = isComplete
      ? { type: 'complete', raw: aiText.trim(), label: 'Rotación variada', unrecognized: [] }
      : { type: 'meal', tree, raw: aiText.trim(), label: astLabel, unrecognized: [] };
    const structuredMeal = {
      ...converted,
      isMainMeal: Boolean(isMainMeal),
    };

    onSave(structuredMeal);
    onClose();
  }

  return (
    <ResponsiveModal
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
                Sin pauta fija prescrita. El motor rotará libremente entre opciones aptas y equilibradas (menú de comedor si está disponible o catálogo general).
              </Text>
            </Box>
            <Switch
              checked={isComplete}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setIsComplete(checked);
                if (checked) setTree(null);
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

        <Paper p="sm" withBorder radius="md" bg={isComplete ? 'teal.0' : 'gray.0'} style={{ borderColor: isComplete ? 'var(--mantine-color-teal-2)' : undefined }}>
          <Group justify="space-between" align="center" mb={4}>
            <Text size="11px" fw={700} c="dimmed" tt="uppercase">
              Resumen de la pauta ({mealName})
            </Text>
            <Text size="11px" fw={600} c={isMainMeal ? 'blue.7' : 'dimmed'}>
              ● {isMainMeal ? 'Comida principal' : 'Toma ligera / secundaria'}
            </Text>
          </Group>
          {isComplete ? (
            <Stack gap={2}>
              <Text size="xs" c="teal.9" fw={600}>
                ● Rotación variada (pauta abierta)
              </Text>
              <Text size="11px" c="dimmed">
                El motor seleccionará combinaciones equilibradas y rotatorias según las tolerancias del jugador (menú de comedor si está disponible o catálogo taxonómico general).
              </Text>
            </Stack>
          ) : tree ? (
            <Stack gap={2}>
              <Text size="xs" fw={700} c="dark.8">
                {astLabel}
              </Text>
            </Stack>
          ) : (
            <Text size="xs" c="dimmed">
              {aiText.trim() ? aiText.trim() : 'Sin pauta definida; escribe en el asistente o activa rotación variada.'}
            </Text>
          )}
        </Paper>

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
    </ResponsiveModal>
  );
}
