'use client';

import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  Group,
  Button,
  Paper,
  MultiSelect,
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
import { formatAstToText, validateMealAst } from '@/lib/engine/meal-ast';
import {
  AVAILABLE_MEALS,
  isMainMeal as checkIsMainMeal,
  getMealTimingBadge,
  sortPreMatchMealsChronological,
} from '@/config/nutrition-days';

const SCHEDULE_DETAILS = {
  manana: {
    label: 'Mañana',
    timeWindow: '12:00 - 14:00',
    description: 'Partidos matinales. Merienda y cena anterior como recarga nutricional (24h previas).',
    recommendedMeals: ['Merienda', 'Cena', 'Desayuno'],
  },
  tarde: {
    label: 'Tarde',
    timeWindow: '16:00 - 18:30',
    description: 'Partidos por la tarde. Merienda y cena previa como recarga, y comida pre-partido.',
    recommendedMeals: ['Merienda', 'Cena', 'Desayuno', 'Comida'],
  },
  noche: {
    label: 'Noche',
    timeWindow: '20:00 - 22:00',
    description: 'Partidos nocturnos. Cena previa de recarga 24h y merienda previa de fácil digestión.',
    recommendedMeals: ['Cena', 'Desayuno', 'Comida', 'Merienda'],
  },
};



function buildMealPatternData(mealName, mealData = {}) {
  const isMain = mealData.isMainMeal !== undefined ? Boolean(mealData.isMainMeal) : checkIsMainMeal(mealName, mealData);
  return {
    ...mealData,
    isMainMeal: Boolean(isMain),
  };
}

function getMealSummaryText(mealData) {
  if (!mealData || mealData.type === 'complete') return 'Rotación variada (pauta abierta)';
  return formatAstToText(mealData) || 'Sin pauta definida';
}

/**
 * Editor individual de pauta MealAst.
 * El asistente estructura la recomendación completa como allOf/oneOf/food.
 */
function SingleMealPautaEditor({
  mealName,
  mealData = {},
  onChange,
  jugadorId = null,
}) {
  const isMainMeal = mealData.isMainMeal !== undefined ? Boolean(mealData.isMainMeal) : checkIsMainMeal(mealName, mealData);
  const isComplete = mealData.type === 'complete';
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
        type: 'complete',
        raw: '',
        label: 'Rotación variada',
        isMainMeal,
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
        jugadorId,
      });

      const parsed = data.tree || Object.values(data.results || {})[0];
      if (!parsed) {
        setAiError('Respuesta inesperada del asistente de IA.');
        return;
      }

      if (parsed.type === 'complete') {
        onChange({
          type: 'complete',
          raw: aiText,
          label: 'Árbol completo (Rotación variada)',
          isMainMeal,
        });
      } else {
        const validation = validateMealAst({ type: 'meal', tree: parsed.tree });
        if (!validation.valid) throw new Error(validation.error);
        onChange({
          type: 'meal',
          tree: parsed.tree,
          label: parsed.label || formatAstToText({ tree: parsed.tree }),
          raw: aiText,
          isMainMeal,
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
            onChange={(e) => onChange({ ...mealData, isMainMeal: e.currentTarget.checked })}
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
              Rotación variada (pauta abierta)
            </Text>
            <Text size="11px" c="dimmed">
              Sin pauta fija. El motor rota entre opciones aptas y equilibradas (menú de comedor si está disponible o catálogo general).
            </Text>
          </Box>
          <Switch
            checked={isComplete}
            onChange={(e) => onChange(e.currentTarget.checked
              ? { type: 'complete', raw: mealData.raw || '', label: 'Rotación variada', isMainMeal, unrecognized: [] }
              : { type: 'meal', tree: { type: 'allOf', children: [] }, raw: mealData.raw || '', isMainMeal, unrecognized: [] })}
            color="teal"
            size="sm"
          />
        </Group>
      </Paper>

      {/* 3. Configuración de Componentes (Asistente IA + AST estructurado) */}
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

          {mealData?.tree && (
            <Paper p="xs" radius="md">
              <Group justify="space-between" align="center" mb={2}>
                <Text size="11px" fw={700} c="blue.9" tt="uppercase">
                  Pauta estructurada ({mealName})
                </Text>
              </Group>
              <Text size="xs" fw={700} c="dark.8">
                {formatAstToText({ tree: mealData.tree })}
              </Text>
            </Paper>
          )}
        </Stack>
      ) : (
        <Paper p="xs" withBorder radius="md" bg="teal.0" style={{ borderColor: 'var(--mantine-color-teal-2)' }}>
          <Text size="xs" c="teal.9" fw={600}>
            ● Pauta abierta para {mealName}
          </Text>
          <Text size="11px" c="dimmed" mt={2}>
            El motor seleccionará combinaciones equilibradas de forma rotatoria (menú del buffet si está disponible para comida/cena o catálogo taxonómico general).
          </Text>
        </Paper>
      )}
    </Stack>
  );
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
            type: 'complete',
            label: 'Rotación variada',
            unrecognized: [],
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
          type: 'complete',
          label: 'Rotación variada',
          unrecognized: [],
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
              type: 'complete',
              label: 'Rotación variada',
              unrecognized: [],
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
            type: 'complete',
            label: 'Rotación variada',
            unrecognized: [],
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
        finalRecs[m] = buildMealPatternData(m, recs[m] || {});
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
                            component="div"
                            role="button"
                            tabIndex={0}
                            variant="subtle"
                            color="red"
                            size="sm"
                            radius="xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMeal(meal);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                e.preventDefault();
                                handleRemoveMeal(meal);
                              }
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
                        jugadorId={jugadorId}
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
