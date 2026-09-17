import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconDownload,
  IconEdit,
  IconFileDownload,
  IconPlus,
  IconRotate,
  IconShieldCheck,
  IconTrash,
  IconUserCheck,
} from '@/components/icons3d';
import ConfirmModal from '@/components/modals/ConfirmModal';

const DAYS_OF_WEEK = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function formatMacro(value, suffix = '') {
  return value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`;
}

export default function SquadReportReviewModal({
  opened,
  preview,
  index,
  total,
  loading,
  actionLoading,
  onValidate,
  onDiscard,
  onCancel,
  onRegenerate,
  onDownloadSingle,
  onDownloadAll,
  semana,
  allPreviews = [],
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null); // { dayKey, mealIndex }
  const [editablePlan, setEditablePlan] = useState(null);
  const [originalPlan, setOriginalPlan] = useState(null);
  const [confirmRegenerateOpened, setConfirmRegenerateOpened] = useState(false);
  const [confirmDownloadAllOpened, setConfirmDownloadAllOpened] = useState(false);
  const [confirmOverwriteOpened, setConfirmOverwriteOpened] = useState(false);
  const [overwriteModalData, setOverwriteModalData] = useState({ title: '', message: '', onConfirm: null });

  const contentRef = useRef(null);
  const playerName = `${preview?.nombre || 'Jugador'} ${preview?.apellidos || ''}`.trim();

  const isLastPlayer = index + 1 >= total;

  const playersWithExistingPlan = useMemo(() => {
    return (allPreviews || []).filter((p) => p?.hasExistingPlan);
  }, [allPreviews]);

  function handleSaveClick() {
    // 1. Si el jugador actual tiene un plan previo en esta semana
    if (preview?.hasExistingPlan) {
      setOverwriteModalData({
        title: 'Plan existente en esta semana',
        message: `Atención: Existen planes para esta semana que se sobrescribirán al guardar. Ya existe un plan registrado para ${playerName} en la semana seleccionada (${semana || 'esta semana'}). Al guardar, se sobrescribirá con los datos actuales. ¿Deseas continuar?`,
        onConfirm: () => {
          setConfirmOverwriteOpened(false);
          onValidate(editablePlan);
        },
      });
      setConfirmOverwriteOpened(true);
      return;
    }

    // 2. Si es el último jugador y en la plantilla hay jugadores que sobrescribirán plan
    if (isLastPlayer && playersWithExistingPlan.length > 0) {
      const names = playersWithExistingPlan
        .map((p) => `${p.nombre || 'Jugador'} ${p.apellidos || ''}`.trim())
        .join(', ');
      setOverwriteModalData({
        title: 'Planes existentes en esta semana',
        message: `Atención: Existen planes guardados para esta semana (${semana || 'esta semana'}) que se sobrescribirán al guardar el informe definitivo (${names}). ¿Deseas continuar y sobrescribirlos?`,
        onConfirm: () => {
          setConfirmOverwriteOpened(false);
          onValidate(editablePlan);
        },
      });
      setConfirmOverwriteOpened(true);
      return;
    }

    // 3. Sin planes existentes a sobrescribir
    onValidate(editablePlan);
  }

  // Initialize editable state whenever preview changes
  useEffect(() => {
    setConfirmed(false);
    setIsEditing(false);
    setEditingMeal(null);

    if (preview?.plan) {
      const clone = JSON.parse(JSON.stringify(preview.plan));
      setEditablePlan(clone);
      setOriginalPlan(JSON.parse(JSON.stringify(preview.plan)));
    } else {
      setEditablePlan(null);
      setOriginalPlan(null);
    }

    const content = contentRef.current;
    if (!content) return undefined;

    const frame = requestAnimationFrame(() => {
      let parent = content.parentElement;
      while (parent && parent !== document.body) {
        const styles = window.getComputedStyle(parent);
        const canScroll = parent.scrollHeight > parent.clientHeight
          && ['auto', 'scroll'].includes(styles.overflowY);
        if (canScroll) {
          parent.scrollTo({ top: 0, behavior: 'auto' });
          break;
        }
        parent = parent.parentElement;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [preview?.id, preview?.plan, index]);

  const plan = editablePlan || preview?.plan;

  const activeDays = useMemo(
    () => DAYS_OF_WEEK.filter((dayKey) => plan?.dias?.[dayKey]),
    [plan]
  );

  const weeklyNotes = useMemo(
    () => (Array.isArray(plan?.notas) ? plan.notas : (Array.isArray(plan?.notes) ? plan.notes : [])),
    [plan?.notas, plan?.notes]
  );

  const hasChanges = useMemo(() => {
    if (!editablePlan || !originalPlan) return false;
    return JSON.stringify(editablePlan) !== JSON.stringify(originalPlan);
  }, [editablePlan, originalPlan]);

  const updateMetrica = (field, val) => {
    setEditablePlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        metricas: {
          ...(prev.metricas || {}),
          [field]: val === '' ? null : Number(val),
        },
      };
    });
  };

  const updateDayMacro = (dayKey, macroKey, val) => {
    setEditablePlan((prev) => {
      if (!prev?.dias?.[dayKey]) return prev;
      return {
        ...prev,
        dias: {
          ...prev.dias,
          [dayKey]: {
            ...prev.dias[dayKey],
            [macroKey]: val === '' ? null : Number(val),
          },
        },
      };
    });
  };

  const updateMeal = (dayKey, mealIndex, field, val) => {
    setEditablePlan((prev) => {
      if (!prev?.dias?.[dayKey]?.ingestas) return prev;
      const newIngestas = [...prev.dias[dayKey].ingestas];
      if (!newIngestas[mealIndex]) return prev;
      newIngestas[mealIndex] = {
        ...newIngestas[mealIndex],
        [field]: val,
      };
      return {
        ...prev,
        dias: {
          ...prev.dias,
          [dayKey]: {
            ...prev.dias[dayKey],
            ingestas: newIngestas,
          },
        },
      };
    });
  };

  const addMeal = (dayKey) => {
    setEditablePlan((prev) => {
      if (!prev?.dias?.[dayKey]) return prev;
      const currentIngestas = prev.dias[dayKey].ingestas || [];
      const newIngestas = [
        ...currentIngestas,
        { nombre: 'NUEVA INGESTA', detalle: '' },
      ];
      return {
        ...prev,
        dias: {
          ...prev.dias,
          [dayKey]: {
            ...prev.dias[dayKey],
            ingestas: newIngestas,
          },
        },
      };
    });
  };

  const removeMeal = (dayKey, mealIndex) => {
    setEditablePlan((prev) => {
      if (!prev?.dias?.[dayKey]?.ingestas) return prev;
      const newIngestas = prev.dias[dayKey].ingestas.filter((_, idx) => idx !== mealIndex);
      return {
        ...prev,
        dias: {
          ...prev.dias,
          [dayKey]: {
            ...prev.dias[dayKey],
            ingestas: newIngestas,
          },
        },
      };
    });
  };

  const updateNote = (noteIndex, val) => {
    setEditablePlan((prev) => {
      const currentNotes = Array.isArray(prev?.notas) ? [...prev.notas] : (Array.isArray(prev?.notes) ? [...prev.notes] : []);
      currentNotes[noteIndex] = val;
      return {
        ...prev,
        notas: currentNotes,
      };
    });
  };

  const addNote = () => {
    setEditablePlan((prev) => {
      const currentNotes = Array.isArray(prev?.notas) ? [...prev.notas] : (Array.isArray(prev?.notes) ? [...prev.notes] : []);
      return {
        ...prev,
        notas: [...currentNotes, ''],
      };
    });
  };

  const removeNote = (noteIndex) => {
    setEditablePlan((prev) => {
      const currentNotes = Array.isArray(prev?.notas) ? [...prev.notas] : (Array.isArray(prev?.notes) ? [...prev.notes] : []);
      return {
        ...prev,
        notas: currentNotes.filter((_, idx) => idx !== noteIndex),
      };
    });
  };

  const resetToOriginal = () => {
    if (originalPlan) {
      setEditablePlan(JSON.parse(JSON.stringify(originalPlan)));
      setEditingMeal(null);
    }
  };

  return (
    <>
      <Modal
      opened={opened}
      onClose={onCancel}
      closeOnClickOutside={false}
      closeOnEscape={false}
      title={
        <Group gap="xs">
          <IconShieldCheck size={20} color="var(--mantine-color-nutralabColor-6)" stroke={1.8} />
          <Stack gap={0}>
            <Text fw={700} size="md" c="dark.5">Validación previa del informe</Text>
            <Text size="xs" c="dimmed">Jugador {Math.min(index + 1, total)} de {total}</Text>
          </Stack>
        </Group>
      }
      size="1000px"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
    >
      <Stack ref={contentRef} gap="md">
        <Paper p="md" radius="md" withBorder bg="gray.0">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Group gap="sm" wrap="nowrap">
              <IconUserCheck size={24} color="var(--mantine-color-nutralabColor-6)" stroke={1.8} />
              <Box>
                <Text fw={700} size="lg" c="dark.5">{playerName}</Text>
                <Text size="sm" c="dimmed">{preview?.posicion || 'Jugador'} · Plan semanal generado</Text>
              </Box>
            </Group>

            <Group gap="xs">
              {preview?.hasExistingPlan && (
                <Group gap={6} px="xs" py={4} style={{ borderRadius: 6, backgroundColor: 'var(--mantine-color-orange-0)', border: '1px solid var(--mantine-color-orange-3)' }}>
                  <Box style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--mantine-color-orange-7)' }} />
                  <Text size="xs" fw={700} c="orange.9">Plan existente esta semana</Text>
                </Group>
              )}

              {hasChanges ? (
                <Group gap={6} px="xs" py={4} style={{ borderRadius: 6, backgroundColor: 'var(--mantine-color-yellow-0)', border: '1px solid var(--mantine-color-yellow-3)' }}>
                  <Box style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--mantine-color-yellow-7)' }} />
                  <Text size="xs" fw={700} c="yellow.9">Editado manualmente</Text>
                </Group>
              ) : (
                <Group gap={6} px="xs" py={4} style={{ borderRadius: 6, backgroundColor: 'var(--mantine-color-gray-1)', border: '1px solid var(--mantine-color-gray-3)' }}>
                  <Box style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--mantine-color-nutralabColor-6)' }} />
                  <Text size="xs" fw={600} c="dimmed">Borrador de validación</Text>
                </Group>
              )}

              {hasChanges && (
                <Button
                  size="xs"
                  radius="xl"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconRotate size={14} />}
                  onClick={resetToOriginal}
                  disabled={loading}
                >
                  Restablecer
                </Button>
              )}

              <Button
                size="xs"
                radius="xl"
                variant="light"
                color="blue"
                leftSection={<IconRotate size={14} />}
                onClick={() => {
                  if (hasChanges) {
                    setConfirmRegenerateOpened(true);
                  } else {
                    onRegenerate?.();
                  }
                }}
                loading={actionLoading === 'regenerate'}
                disabled={loading}
                title="Generar una nueva combinación aleatoria del árbol de opciones para este jugador"
              >
                Regenerar dieta
              </Button>

              <Button
                size="xs"
                radius="xl"
                variant={isEditing ? 'filled' : 'light'}
                color="nutralabColor"
                leftSection={<IconEdit size={14} />}
                onClick={() => {
                  setIsEditing((prev) => !prev);
                  setEditingMeal(null);
                }}
                disabled={loading}
              >
                {isEditing ? 'Finalizar edición' : 'Modo edición'}
              </Button>
            </Group>
          </Group>
        </Paper>

        {preview?.hasExistingPlan && (
          <Paper
            p="xs"
            radius="md"
            style={{
              backgroundColor: 'var(--mantine-color-orange-0)',
              border: '1px solid var(--mantine-color-orange-3)',
            }}
          >
            <Group gap="xs" wrap="nowrap" align="center">
              <IconAlertTriangle size={18} color="var(--mantine-color-orange-8)" style={{ flexShrink: 0 }} />
              <Box>
                <Text size="xs" fw={700} c="orange.9">
                  Plan existente en esta semana
                </Text>
                <Text size="xs" c="orange.8">
                  Ya existe un plan registrado ({preview.existingPlanName || `semana ${semana || ''}`}) para {playerName}. Al guardar el informe, se sobrescribirá con los datos actuales.
                </Text>
              </Box>
            </Group>
          </Paper>
        )}

        <Paper p="sm" radius="md" withBorder>
          <Group gap="xs" mb="xs">
            <IconAlertTriangle size={18} color="var(--mantine-color-orange-6)" stroke={1.8} />
            <Text size="sm" fw={700} c="dark.5">
              {isEditing
                ? 'Modo edición activo: puedes modificar métricas, macros por día, comidas e indicaciones.'
                : 'Revisa las ingestas y las indicaciones. Si algo no cuadra, puedes editarlo directamente aquí mismo.'}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {isEditing
              ? 'Realiza los ajustes necesarios. Al guardar el informe se persistirán tus datos editados y se compilarán en el PDF final.'
              : 'Haz clic en el icono de lápiz de cualquier comida para editarla rápidamente, o activa "Modo edición" para editar todo el plan.'}
          </Text>
        </Paper>

        <Stack gap="sm">
          {/* Métricas del jugador */}
          <Stack gap={4}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.5px' }}>
              Métricas del jugador
            </Text>
            {isEditing ? (
              <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="xs">
                <Paper p="xs" withBorder radius="md">
                  <NumberInput
                    label="Peso (kg)"
                    size="xs"
                    value={plan?.metricas?.peso ?? ''}
                    decimalScale={1}
                    min={0}
                    onChange={(val) => updateMetrica('peso', val)}
                  />
                </Paper>
                <Paper p="xs" withBorder radius="md">
                  <NumberInput
                    label="Grasa (%)"
                    size="xs"
                    value={plan?.metricas?.grasa ?? ''}
                    decimalScale={1}
                    min={0}
                    onChange={(val) => updateMetrica('grasa', val)}
                  />
                </Paper>
                <Paper p="xs" withBorder radius="md">
                  <NumberInput
                    label="Masa magra (kg)"
                    size="xs"
                    value={plan?.metricas?.masaMagra ?? ''}
                    decimalScale={1}
                    min={0}
                    onChange={(val) => updateMetrica('masaMagra', val)}
                  />
                </Paper>
                <Paper p="xs" withBorder radius="md">
                  <NumberInput
                    label="% P. Muscular"
                    size="xs"
                    value={plan?.metricas?.pesoMuscular ?? ''}
                    decimalScale={1}
                    min={0}
                    onChange={(val) => updateMetrica('pesoMuscular', val)}
                  />
                </Paper>
              </SimpleGrid>
            ) : (
              <Group grow align="stretch">
                <Paper p="xs" withBorder radius="md">
                  <Text size="xs" c="dimmed">Peso</Text>
                  <Text fw={700} c="dark.5">{formatMacro(plan?.metricas?.peso, ' kg')}</Text>
                </Paper>
                <Paper p="xs" withBorder radius="md">
                  <Text size="xs" c="dimmed">Grasa</Text>
                  <Text fw={700} c="dark.5">{formatMacro(plan?.metricas?.grasa, '%')}</Text>
                </Paper>
                <Paper p="xs" withBorder radius="md">
                  <Text size="xs" c="dimmed">Masa magra</Text>
                  <Text fw={700} c="dark.5">{formatMacro(plan?.metricas?.masaMagra, ' kg')}</Text>
                </Paper>
                {plan?.metricas?.pesoMuscular != null && (
                  <Paper p="xs" withBorder radius="md">
                    <Text size="xs" c="dimmed">% Músculo</Text>
                    <Text fw={700} c="dark.5">{formatMacro(plan?.metricas?.pesoMuscular, '%')}</Text>
                  </Paper>
                )}
              </Group>
            )}
          </Stack>

          {/* Días y comidas */}
          <Accordion multiple defaultValue={activeDays.slice(0, 1)} variant="separated">
            {activeDays.map((dayKey) => {
              const day = plan.dias[dayKey];
              if (!day) return null;

              return (
                <Accordion.Item key={dayKey} value={dayKey}>
                  <Accordion.Control>
                    <Group justify="space-between" pr="sm" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap">
                        <Text fw={700} c="dark.5">{day.label}</Text>
                        {day.tipoDia && (
                          <Text size="xs" c="dimmed" fw={600}>
                            · {day.tipoDia.toUpperCase()}
                          </Text>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed" ta="right">
                        {formatMacro(day.kcal, ' kcal')} · P {formatMacro(day.proteina, 'g')} · HC {formatMacro(day.hidratos, 'g')} · G {formatMacro(day.grasa, 'g')}
                      </Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="sm">
                      {/* En modo edición: inputs de macros del día */}
                      {isEditing && (
                        <Paper p="xs" withBorder radius="md" bg="gray.0">
                          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={6}>
                            Objetivos de macronutrientes para {day.label}
                          </Text>
                          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                            <NumberInput
                              label="Kcal"
                              size="xs"
                              value={day.kcal ?? ''}
                              min={0}
                              onChange={(val) => updateDayMacro(dayKey, 'kcal', val)}
                            />
                            <NumberInput
                              label="Proteína (g)"
                              size="xs"
                              value={day.proteina ?? ''}
                              min={0}
                              onChange={(val) => updateDayMacro(dayKey, 'proteina', val)}
                            />
                            <NumberInput
                              label="Hidratos (g)"
                              size="xs"
                              value={day.hidratos ?? ''}
                              min={0}
                              onChange={(val) => updateDayMacro(dayKey, 'hidratos', val)}
                            />
                            <NumberInput
                              label="Grasa (g)"
                              size="xs"
                              value={day.grasa ?? ''}
                              min={0}
                              onChange={(val) => updateDayMacro(dayKey, 'grasa', val)}
                            />
                          </SimpleGrid>
                        </Paper>
                      )}

                      {/* Lista de ingestas */}
                      {(day.ingestas || []).map((meal, mealIndex) => {
                        const isSingleEditing = !isEditing && editingMeal?.dayKey === dayKey && editingMeal?.mealIndex === mealIndex;

                        if (isEditing) {
                          return (
                            <Paper key={`${dayKey}-${mealIndex}`} p="xs" withBorder radius="md" bg="white">
                              <Stack gap="xs">
                                <Group justify="space-between" align="center">
                                  <TextInput
                                    size="xs"
                                    placeholder="NOMBRE DE LA INGESTA (Ej: COMIDA)"
                                    value={meal.nombre || ''}
                                    onChange={(e) => updateMeal(dayKey, mealIndex, 'nombre', e.target.value)}
                                    style={{ flex: 1, maxWidth: 300 }}
                                    styles={{ input: { fontWeight: 700, textTransform: 'uppercase', color: 'var(--mantine-color-nutralabColor-8)' } }}
                                  />
                                  <ActionIcon
                                    size="sm"
                                    color="red"
                                    variant="subtle"
                                    title="Eliminar ingesta"
                                    onClick={() => removeMeal(dayKey, mealIndex)}
                                  >
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                </Group>
                                <Textarea
                                  size="xs"
                                  autosize
                                  minRows={2}
                                  placeholder="Detalle de alimentos, gramajes en crudo..."
                                  value={meal.detalle || ''}
                                  onChange={(e) => updateMeal(dayKey, mealIndex, 'detalle', e.target.value)}
                                />
                              </Stack>
                            </Paper>
                          );
                        }

                        if (isSingleEditing) {
                          return (
                            <Paper key={`${dayKey}-${mealIndex}`} p="xs" withBorder radius="md" bg="gray.0" style={{ borderColor: 'var(--mantine-color-nutralabColor-4)' }}>
                              <Stack gap="xs">
                                <Group justify="space-between" align="center">
                                  <TextInput
                                    size="xs"
                                    value={meal.nombre || ''}
                                    onChange={(e) => updateMeal(dayKey, mealIndex, 'nombre', e.target.value)}
                                    style={{ flex: 1, maxWidth: 280 }}
                                    styles={{ input: { fontWeight: 700, textTransform: 'uppercase', color: 'var(--mantine-color-nutralabColor-8)' } }}
                                  />
                                  <Button
                                    size="xs"
                                    radius="xl"
                                    variant="light"
                                    color="teal"
                                    leftSection={<IconCheck size={14} />}
                                    onClick={() => setEditingMeal(null)}
                                  >
                                    Listo
                                  </Button>
                                </Group>
                                <Textarea
                                  size="xs"
                                  autosize
                                  minRows={2}
                                  value={meal.detalle || ''}
                                  onChange={(e) => updateMeal(dayKey, mealIndex, 'detalle', e.target.value)}
                                />
                              </Stack>
                            </Paper>
                          );
                        }

                        // Vista lectura para esta comida
                        return (
                          <Box key={`${dayKey}-${mealIndex}`}>
                            <Group justify="space-between" align="center" mb={2}>
                              <Text size="xs" fw={700} c="nutralabColor.8" tt="uppercase">{meal.nombre}</Text>
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                title="Editar esta ingesta"
                                onClick={() => setEditingMeal({ dayKey, mealIndex })}
                              >
                                <IconEdit size={13} />
                              </ActionIcon>
                            </Group>
                            <Text size="sm" lh={1.35} c="dark.6">{meal.detalle || 'Sin detalle generado'}</Text>
                            {mealIndex < day.ingestas.length - 1 && <Divider mt="xs" />}
                          </Box>
                        );
                      })}

                      {isEditing && (
                        <Button
                          variant="light"
                          size="xs"
                          radius="xl"
                          color="nutralabColor"
                          leftSection={<IconPlus size={14} />}
                          onClick={() => addMeal(dayKey)}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          Añadir ingesta a {day.label}
                        </Button>
                      )}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>

          {/* Indicaciones semanales */}
          <Paper p="sm" radius="md" withBorder bg="gray.0" style={{ borderColor: 'var(--mantine-color-gray-2)' }}>
            <Group justify="space-between" align="center" mb={4}>
              <Text size="xs" fw={700} c="dark.5" tt="uppercase">Indicaciones semanales</Text>
              {isEditing && (
                <Button
                  size="xs"
                  radius="xl"
                  variant="subtle"
                  color="nutralabColor"
                  leftSection={<IconPlus size={14} />}
                  onClick={addNote}
                >
                  Añadir indicación
                </Button>
              )}
            </Group>

            {isEditing ? (
              <Stack gap="xs" mt="xs">
                {weeklyNotes.map((note, noteIndex) => (
                  <Group key={noteIndex} gap="xs" align="center">
                    <TextInput
                      size="xs"
                      placeholder="Indicación para el jugador..."
                      value={note || ''}
                      onChange={(e) => updateNote(noteIndex, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <ActionIcon
                      size="sm"
                      color="red"
                      variant="subtle"
                      title="Eliminar indicación"
                      onClick={() => removeNote(noteIndex)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                ))}
                {weeklyNotes.length === 0 && (
                  <Text size="xs" c="dimmed" fs="italic">No hay indicaciones añadidas.</Text>
                )}
              </Stack>
            ) : (
              <Stack gap={4} mt={4}>
                {weeklyNotes.length > 0 ? (
                  weeklyNotes.map((note, noteIndex) => (
                    <Text key={noteIndex} size="sm">• {note}</Text>
                  ))
                ) : (
                  <Text size="xs" c="dimmed" fs="italic">Sin indicaciones específicas.</Text>
                )}
              </Stack>
            )}
          </Paper>
        </Stack>

        <Checkbox
          checked={confirmed}
          onChange={(event) => setConfirmed(event.currentTarget.checked)}
          label="He revisado este plan y confirmo que es correcto para este jugador."
          disabled={loading}
        />

        <Divider my={4} />

        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          {/* Izquierda: Cancelar */}
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            radius="xl"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar generación
          </Button>

          {/* Centro: Descargas */}
          <Group gap="xs" wrap="nowrap">
            <Button
              variant="light"
              color="nutralabColor"
              size="xs"
              radius="xl"
              leftSection={<IconDownload size={14} />}
              onClick={() => onDownloadSingle?.(editablePlan)}
              loading={actionLoading === 'single'}
              disabled={loading}
              title="Descargar el PDF de la dieta de este jugador (sin guardar en base de datos)"
            >
              Descargar dieta
            </Button>

            <Button
              variant="light"
              color="nutralabColor"
              size="xs"
              radius="xl"
              leftSection={<IconFileDownload size={14} />}
              onClick={() => {
                if (index + 1 < total) {
                  setConfirmDownloadAllOpened(true);
                } else {
                  onDownloadAll?.(editablePlan);
                }
              }}
              loading={actionLoading === 'all'}
              disabled={loading}
              title="Descargar el PDF conjunto de todos los jugadores (sin guardar en base de datos)"
            >
              Descargar todos ({total})
            </Button>
          </Group>

          {/* Derecha: Descartar y Guardar */}
          <Group gap="xs" wrap="nowrap">
            <Button
              variant="subtle"
              color="red"
              size="xs"
              radius="xl"
              onClick={onDiscard}
              loading={actionLoading === 'discard'}
              disabled={loading}
            >
              Descartar jugador
            </Button>

            <Button
              color="teal"
              size="xs"
              radius="xl"
              leftSection={<IconCheck size={14} />}
              onClick={handleSaveClick}
              loading={actionLoading === 'validate'}
              disabled={!confirmed || loading}
            >
              {index + 1 < total ? 'Guardar y continuar' : 'Guardar informe'}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>

    {/* Modal de confirmación para regenerar dieta si hay cambios manuales */}
    <ConfirmModal
      opened={confirmRegenerateOpened}
      onClose={() => setConfirmRegenerateOpened(false)}
      title={`¿Regenerar dieta de ${playerName}?`}
      message="Has realizado modificaciones manuales en la dieta de este jugador. Al regenerar, se descartarán los cambios no guardados y se creará una nueva combinación aleatoria del árbol de alimentos."
      confirmLabel="Regenerar dieta"
      cancelLabel="Cancelar"
      color="blue"
      onConfirm={() => {
        setConfirmRegenerateOpened(false);
        onRegenerate?.();
      }}
    />

    {/* Modal de confirmación para descargar todos si quedan pendientes */}
    <ConfirmModal
      opened={confirmDownloadAllOpened}
      onClose={() => setConfirmDownloadAllOpened(false)}
      title={`¿Descargar PDF de toda la plantilla (${total} jugadores)?`}
      message={`Quedan ${total - (index + 1)} jugadores por revisar. Se generará y descargará el PDF conjunto con los borradores de todos los jugadores sin guardar ningún cambio en la base de datos. Podrás continuar revisándolos o guardarlos cuando termines.`}
      confirmLabel={`Descargar PDF (${total})`}
      cancelLabel="Seguir revisando"
      color="nutralabColor"
      onConfirm={() => {
        setConfirmDownloadAllOpened(false);
        onDownloadAll?.(editablePlan);
      }}
    />

    {/* Modal de confirmación cuando existen planes que se sobrescribirán */}
    <ConfirmModal
      opened={confirmOverwriteOpened}
      onClose={() => setConfirmOverwriteOpened(false)}
      title={overwriteModalData.title || 'Planes existentes en esta semana'}
      message={overwriteModalData.message}
      confirmLabel="Sobrescribir y continuar"
      cancelLabel="Volver a revisar"
      color="orange"
      onConfirm={() => {
        overwriteModalData.onConfirm?.();
      }}
    />
    </>
  );
}

