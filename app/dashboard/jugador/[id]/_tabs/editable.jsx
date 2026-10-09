'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  MultiSelect,
  Checkbox,
  NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPlus } from '@/components/icons3d';
import { BentoCard } from '@/components/BentoItem';
import { updatePlayerField } from '@/actions/playerActions';
import { useRouter } from 'next/navigation';
import {
  AVAILABLE_MEALS,
  getMealsForCount,
  sortMeals,
  isMainMeal,
  sortPreMatchMealsChronological,
  getMealTimingBadge,
} from '@/config/nutrition-days';
import EditMealPatternModal from '@/components/modals/EditMealPatternModal';
import PrepartidoRoutineModal from '@/components/modals/PrepartidoRoutineModal';
import { convertLegacyToAst, formatAstToText } from '@/lib/engine/meal-ast';
import { isDefaultProtocolMeal } from '@/lib/nutrition/prematch-protocol';
import WidgetCard from '@/components/widgets/WidgetCard';

// Color de categoría de cada campo del perfil (mismo criterio que las teselas del Perfil)
const ICON_COLORS = {
  target: 'red',
  goal_net: 'red',
  strawberry: 'pink',
  scale: 'teal',
  apple: 'lime',
  warning: 'orange',
  shield: 'indigo',
  stethoscope: 'pink',
  bowl: 'blue',
};

export function CampoEditable({
  label,
  campo,
  valor,
  jugadorId,
  tipo = 'textarea',
  opciones,
  min,
  max,
  step = 0.1,
  decimalScale = 2,
  suffix = '',
  readOnly = false,
  icon3d,
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(() => {
    if (tipo === 'multiselect') {
      if (Array.isArray(valor)) return valor;
      if (typeof valor === 'string') return valor.split(/[,|;]/).map((s) => s.trim()).filter(Boolean);
      return [];
    }
    return valor || '';
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tipo === 'multiselect') {
      if (Array.isArray(valor)) setVal(valor);
      else if (typeof valor === 'string') setVal(valor.split(/[,|;]/).map((s) => s.trim()).filter(Boolean));
      else setVal([]);
    } else {
      setVal(valor || '');
    }
  }, [valor, tipo]);

  async function save() {
    setSaving(true);
    try {
      let finalVal = val;
      if (tipo === 'number') {
        const num = Number(val);
        finalVal = Number.isFinite(num) ? Math.round(num * 100) / 100 : val;
      } else if (tipo === 'multiselect') {
        finalVal = Array.isArray(val) ? val.join(', ') : String(val || '');
      }
      await updatePlayerField(jugadorId, campo, finalVal);
      setEditing(false);
      router.refresh();
      notifications.show({
        color: 'green',
        title: 'Campo guardado',
        message: `${label} se ha actualizado correctamente.`,
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo guardar',
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <BentoCard title={label} icon3d={icon3d} color={ICON_COLORS[icon3d] || 'gray'} style={{ height: 'auto' }}>
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Box style={{ flex: 1 }}>
            {editing ? (
              tipo === 'select' ? (
                <Select data={opciones} value={val} onChange={setVal} size="sm" />
              ) : tipo === 'multiselect' ? (
                <MultiSelect
                  data={opciones}
                  value={Array.isArray(val) ? val : []}
                  onChange={setVal}
                  searchable
                  clearable
                  size="sm"
                />
              ) : tipo === 'number' ? (
                <NumberInput
                  value={val === '' ? '' : Number(val)}
                  onChange={(v) => setVal(v === '' ? '' : (typeof v === 'number' ? Math.round(v * 100) / 100 : v))}
                  min={min}
                  max={max}
                  step={step}
                  decimalScale={decimalScale}
                  allowNegative={false}
                  suffix={suffix}
                  size="sm"
                />
              ) : tipo === 'text' ? (
                <TextInput value={val} onChange={(e) => setVal(e.target.value)} size="sm" />
              ) : (
                <Textarea value={val} onChange={(e) => setVal(e.target.value)} rows={3} size="sm" />
              )
            ) : (
              <Text size="sm" c={(val !== '' && val !== null && val !== undefined && (!Array.isArray(val) || val.length > 0)) ? 'dark' : 'dimmed'}>
                {tipo === 'select' && val && opciones
                  ? (opciones.find((o) => (o.value || o) === val)?.label || val)
                  : tipo === 'multiselect' && Array.isArray(val) && val.length > 0
                  ? val.map((v) => opciones?.find((o) => (o.value || o) === v)?.label || v).join(', ')
                  : tipo === 'number' && val !== '' && val !== null && val !== undefined
                  ? `${val}${suffix}`
                  : (typeof val === 'string' && val ? val : 'Sin especificar')}
              </Text>
            )}
          </Box>

          {!readOnly && (
            <Group gap={6}>
              {!editing ? (
                <Button variant="subtle" size="xs" radius="xl" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              ) : (
                <>
                  <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                  <Button variant="filled" size="xs" radius="xl" onClick={save} loading={saving}>
                    Guardar
                  </Button>
                </>
              )}
            </Group>
          )}
        </Group>
      </Stack>
    </BentoCard>
  );
}

function parseMeals(val) {
  if (!val) return [];
  if (!isNaN(Number(val))) {
    return getMealsForCount(val);
  }
  return sortMeals(val.split(',').map((s) => s.trim()).filter(Boolean));
}

export function ComidasEditable({
  label,
  numComidas,
  postentreno,
  preentreno,
  jugadorId,
  jugador = null,
  recomendacionesDefecto = {},
  readOnly = false,
  icon3d = 'bowl',
}) {
  const router = useRouter();
  const [editingDistribution, setEditingDistribution] = useState(false);
  const [meals, setMeals] = useState(() => parseMeals(numComidas));
  const [hasPost, setHasPost] = useState(Boolean(postentreno));
  const [recsDefecto, setRecsDefecto] = useState(() => recomendacionesDefecto || {});
  const [saving, setSaving] = useState(false);
  const [selectedMealForModal, setSelectedMealForModal] = useState(null);

  useEffect(() => {
    setMeals(parseMeals(numComidas));
    setHasPost(Boolean(postentreno));
    setRecsDefecto(recomendacionesDefecto || {});
  }, [numComidas, postentreno, preentreno, recomendacionesDefecto]);

  const MEAL_OPTIONS = AVAILABLE_MEALS;

  async function saveDistribution() {
    setSaving(true);
    try {
      const mealsValue = meals.join(', ');
      await updatePlayerField(jugadorId, 'num_comidas', mealsValue);
      await updatePlayerField(jugadorId, 'preentreno', false);
      await updatePlayerField(jugadorId, 'postentreno', hasPost);
      setEditingDistribution(false);
      router.refresh();
      notifications.show({
        color: 'green',
        title: 'Distribución guardada',
        message: 'La distribución de comidas y tomas se ha guardado correctamente.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo guardar',
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleCancelDistribution() {
    setMeals(parseMeals(numComidas));
    setHasPost(Boolean(postentreno));
    setEditingDistribution(false);
  }

  const activeMeals = meals.filter((m) => m.toLowerCase() !== 'post-entreno');
  const displayMeals = meals.length > 0 ? meals.join(', ') : 'Ninguna seleccionada';

  return (
    <BentoCard title={label} icon3d={icon3d} color={ICON_COLORS[icon3d] || 'gray'} style={{ height: 'auto' }}>
      <Stack gap="sm">
        {/* Cabecera de distribución general */}
        <Paper p="xs" withBorder radius="sm" bg="gray.0">
          <Group justify="space-between" align="center">
            <Box style={{ flex: 1 }}>
              {editingDistribution ? (
                <Stack gap="xs">
                  <MultiSelect
                    label="Distribución de tomas diarias"
                    placeholder="Ej. Desayuno, Merienda, Cena"
                    data={MEAL_OPTIONS}
                    value={meals}
                    onChange={(val) => {
                      const sorted = sortMeals(val);
                      setMeals(sorted);
                    }}
                    size="xs"
                    searchable
                    clearable
                  />
                  <Checkbox
                    label="Incluir toma Post-entreno / Recuperación"
                    checked={hasPost}
                    onChange={(event) => setHasPost(event.currentTarget.checked)}
                    size="xs"
                  />
                </Stack>
              ) : (
                <Stack gap={3}>
                  <Text size="xs">
                    <Text span fw={700} c="dimmed">Tomas activas: </Text>
                    <Text span c="dark.8" fw={600}>{displayMeals}</Text>
                  </Text>
                  <Text size="xs">
                    <Text span fw={700} c="dimmed">Post-entreno: </Text>
                    <Text span c="dark.7">{hasPost ? 'Sí (recuperación)' : 'No'}</Text>
                  </Text>
                </Stack>
              )}
            </Box>

            {!readOnly && (
              <Box>
                {!editingDistribution ? (
                  <Button
                    variant="subtle"
                    size="xs"
                    radius="xl"
                    onClick={() => setEditingDistribution(true)}
                  >
                    Editar tomas
                  </Button>
                ) : (
                  <Group gap={6}>
                    <Button
                      variant="filled"
                      size="xs"
                      radius="xl"
                      onClick={saveDistribution}
                      loading={saving}
                    >
                      Guardar
                    </Button>
                    <Button
                      variant="subtle"
                      color="gray"
                      size="xs"
                      radius="xl"
                      onClick={handleCancelDistribution}
                    >
                      Cancelar
                    </Button>
                  </Group>
                )}
              </Box>
            )}
          </Group>
        </Paper>

        {/* Lista de pautas tipadas por comida */}
        <Box mt={4}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={6}>
            Pautas por Ingesta
          </Text>

          {activeMeals.length === 0 ? (
            <Text size="xs" c="dimmed">No hay tomas configuradas.</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: Math.min(activeMeals.length, 4) || 1 }} spacing="xs">
              {activeMeals.map((meal) => {
                const mealData = recsDefecto[meal] || {};
                const isMainMealIntake = mealData.isMainMeal ?? isMainMeal(meal, mealData);
                const hasTree = Boolean(mealData.tree);
                const isComplete = mealData.type === 'complete';

                return (
                  <Paper key={meal} p="xs" withBorder radius="sm" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Group justify="space-between" align="center" mb={4} wrap="wrap" gap={4}>
                      <Group gap="xs" align="center">
                        <Text size="xs" fw={700} c="dark.8">
                          {meal}
                        </Text>
                        <Text size="11px" fw={600} c={isMainMealIntake ? 'blue.7' : 'dimmed'}>
                          ● {isMainMealIntake ? 'Comida principal' : 'Toma ligera'}
                        </Text>
                      </Group>

                      {!readOnly && (
                        <Button
                          variant="light"
                          color="dark"
                          size="compact-xs"
                          radius="xl"
                          leftSection={<IconEdit size={12} />}
                          onClick={() => setSelectedMealForModal(meal)}
                          style={{ flexShrink: 0 }}
                        >
                          Configurar pauta
                        </Button>
                      )}
                    </Group>

                    {isComplete || !hasTree ? (
                      <Text size="11px" c="dimmed" style={{ flex: 1 }}>
                        Rotación variada y completa del comedor oficial del club según preferencias.
                      </Text>
                    ) : hasTree ? (
                      <Stack gap={2} mt={2} style={{ flex: 1 }}>
                        <Text size="11px">
                          <Text span fw={600} c="teal.8">● Pauta: </Text>
                          <Text span c="dark.7" fw={500}>{formatAstToText(mealData)}</Text>
                        </Text>
                        {mealData.raw && mealData.raw !== formatAstToText(mealData) && (
                          <Text size="10px" c="dimmed" fs="italic">
                            Indicación: &quot;{mealData.raw}&quot;
                          </Text>
                        )}
                      </Stack>
                    ) : (
                      <Text size="11px" c="dark.7" style={{ flex: 1 }}>{formatAstToText(mealData)}</Text>
                    )}
                  </Paper>
                );
              })}
            </SimpleGrid>
          )}
        </Box>
      </Stack>

      {/* Modal para editar la pauta de una comida */}
      {selectedMealForModal && (
        <EditMealPatternModal
          opened={Boolean(selectedMealForModal)}
          onClose={() => setSelectedMealForModal(null)}
          mealName={selectedMealForModal}
          timing="Pauta habitual"
          value={recsDefecto[selectedMealForModal] || null}
          jugadorId={jugadorId}
          jugador={jugador}
          onSave={async (updatedMeal) => {
            const newRecs = {
              ...Object.fromEntries(Object.entries(recsDefecto).map(([name, meal]) => [name, convertLegacyToAst(meal)])),
              [selectedMealForModal]: updatedMeal,
            };
            try {
              const res = await updatePlayerField(jugadorId, 'recomendaciones_defecto', newRecs);
              if (!res?.ok) throw new Error(res?.error || 'No se pudo guardar la pauta.');
              setRecsDefecto(newRecs);
              notifications.show({
                color: 'teal',
                title: 'Pauta guardada',
                message: `La pauta de ${selectedMealForModal} se ha guardado correctamente.`,
              });
              router.refresh();
            } catch (err) {
              notifications.show({
                color: 'red',
                title: 'Error al guardar',
                message: err.message,
              });
            }
          }}
        />
      )}
    </BentoCard>
  );
}

export function EditableSection({ title, defaultValue, onSave, readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(value);
      setEditing(false);
      notifications.show({
        color: 'green',
        title: 'Sección guardada',
        message: `${title} se ha actualizado correctamente.`,
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo guardar',
        message: e.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <WidgetCard
      icon="memo"
      title={title}
      color="orange"
      style={{ height: 'auto' }}
      aside={
            <Group gap="xs">
              {!readOnly && (
                !editing ? (
                  <Button variant="light" size="xs" radius="xl" onClick={() => setEditing(true)} leftSection={<IconEdit size={14} />}>
                    Editar
                  </Button>
                ) : (
                  <>
                    <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={() => setEditing(false)}>
                      Cancelar
                    </Button>
                    <Button variant="filled" size="xs" radius="xl" onClick={handleSave} loading={saving}>
                      Guardar
                    </Button>
                  </>
                )
              )}
            </Group>
      }
    >
      {editing ? (
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={15}
          size="sm"
          styles={{ input: { lineHeight: 1.6 } }}
        />
      ) : (
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {value || 'Sin notas. Haz clic en Editar para personalizar.'}
        </Text>
      )}
    </WidgetCard>
  );
}

const SCHEDULE_OPTIONS = [
  { label: 'Mañana', value: 'manana' },
  { label: 'Tarde', value: 'tarde' },
  { label: 'Noche', value: 'noche' },
];

export function PrepartidoEditable({
  label,
  configPrepartido = {},
  numComidas,
  postentreno,
  jugadorId,
  jugador,
  readOnly = false,
}) {
  const router = useRouter();
  const [activeModalSchedule, setActiveModalSchedule] = useState(null);
  const [config, setConfig] = useState(() => configPrepartido || {});

  const defaultMeals = parseMeals(numComidas);
  const defaultPost = Boolean(postentreno);

  const configStr = JSON.stringify(configPrepartido || {});
  useEffect(() => {
    try {
      setConfig(JSON.parse(configStr));
    } catch {
      setConfig({});
    }
  }, [configStr]);

  const scheduleOptions = SCHEDULE_OPTIONS;

  return (
    <BentoCard title={label} icon3d="flag" color="red" style={{ height: 'auto' }}>
      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
        {scheduleOptions.map((opt) => {
          const cfg = config?.[opt.value];
          const hasCustomMeals = Array.isArray(cfg?.ingestas) && cfg.ingestas.length > 0;
          const hasRecs = Boolean(
            cfg?.recomendaciones &&
              Object.values(cfg.recomendaciones).some(
                (v) => Boolean(v && (typeof v === 'object' || String(v).trim()))
              )
          );
          const hasLegacy = Boolean(cfg?.dia_anterior && String(cfg.dia_anterior).trim());
          const isConfigured = Boolean(cfg && (hasCustomMeals || hasRecs || hasLegacy));

          const currentMeals = sortPreMatchMealsChronological(
            opt.value,
            Array.isArray(cfg?.ingestas) ? cfg.ingestas : defaultMeals
          );
          const currentPost = cfg?.postentreno !== undefined ? Boolean(cfg.postentreno) : defaultPost;
          const currentRecs = Object.fromEntries(
            Object.entries(cfg?.recomendaciones || {}).map(([name, meal]) => [name, convertLegacyToAst(meal)])
          );
          const manualCount = currentMeals
            .filter((m) => !isDefaultProtocolMeal(cfg?.recomendaciones?.[m])).length;
          const mealsList =
            cfg?.ingestas && cfg.ingestas.length > 0
              ? sortPreMatchMealsChronological(opt.value, cfg.ingestas).join(', ')
              : 'Habituales';

          if (!isConfigured) {
            return (
              <Paper key={opt.value} p="sm" withBorder radius="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Group justify="space-between" align="center" mb={4} wrap="wrap" gap="xs">
                  <Group gap="xs" align="center">
                    <Text size="sm" fw={700} c="dark.7">
                      Partido por la {opt.label}
                    </Text>
                    <Text size="xs" c="dimmed">
                      ● Sin configurar
                    </Text>
                  </Group>

                  {!readOnly && (
                    <Button
                      variant="light"
                      color="blue"
                      size="xs"
                      radius="xl"
                      leftSection={<IconPlus size={13} />}
                      onClick={() =>
                        setActiveModalSchedule({
                          key: opt.value,
                          label: opt.label,
                          activeMeal: null,
                        })
                      }
                      style={{ flexShrink: 0 }}
                    >
                      Configurar rutina
                    </Button>
                  )}
                </Group>

                <Text size="xs" c="dimmed" style={{ flex: 1 }}>
                  Por defecto: en días de partido por la {opt.label.toLowerCase()} come lo mismo que en sus
                  comidas habituales, con las reglas del protocolo.
                </Text>
              </Paper>
            );
          }

          return (
            <Paper key={opt.value} p="sm" withBorder radius="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Group justify="space-between" align="center" mb={6} wrap="wrap" gap="xs">
                <Group gap="xs" align="center">
                  <Text size="sm" fw={700} c="dark.7">
                    Partido por la {opt.label}
                  </Text>
                  <Text size="xs" c="teal.7" fw={600}>
                    ● {manualCount > 0
                      ? `${manualCount} ${manualCount === 1 ? 'toma manual' : 'tomas manuales'}, resto por defecto`
                      : 'Por defecto (sus comidas habituales)'}
                  </Text>
                </Group>

                {!readOnly && (
                  <Button
                    variant="light"
                    color="dark"
                    size="xs"
                    radius="xl"
                    leftSection={<IconEdit size={13} />}
                    onClick={() =>
                      setActiveModalSchedule({
                        key: opt.value,
                        label: opt.label,
                        activeMeal: null,
                      })
                    }
                    style={{ flexShrink: 0 }}
                  >
                    Editar rutina
                  </Button>
                )}
              </Group>

              <Stack gap={6} style={{ flex: 1 }}>
                <Text size="xs" c="dark.6">
                  <Text span fw={600} c="dimmed">
                    Ingestas pautadas:{' '}
                  </Text>
                  {mealsList} ({currentPost ? 'con toma post-partido' : 'sin post-partido'})
                </Text>

                {/* Detalle estructurado de cada comida */}
                <Stack gap="xs" mt={4} style={{ flex: 1 }}>
                  {currentMeals.map((m) => {
                    const timing = getMealTimingBadge(opt.value, m);
                    const mealData = currentRecs[m] || { type: 'complete' };
                    const isMainMealIntake = mealData.isMainMeal ?? isMainMeal(m, mealData);
                    const isComplete = mealData.type === 'complete';
                    const hasTree = Boolean(mealData.tree);

                    return (
                      <Paper key={m} p="xs" withBorder radius="sm" bg="gray.0">
                        <Group gap="xs" align="center" mb={2} wrap="wrap">
                          <Text size="xs" fw={700} c="dark.8">
                            {m} {timing ? `(${timing})` : ''}
                          </Text>
                          <Text size="11px" fw={600} c={isMainMealIntake ? 'blue.7' : 'dimmed'}>
                            ● {isMainMealIntake ? 'Comida principal' : 'Toma ligera'}
                          </Text>
                          <Text size="11px" fw={700} c={isDefaultProtocolMeal(cfg?.recomendaciones?.[m]) ? 'gray.6' : 'teal.7'}>
                            {isDefaultProtocolMeal(cfg?.recomendaciones?.[m]) ? 'Por defecto' : 'Manual'}
                          </Text>
                        </Group>

                        {isComplete || !hasTree ? (
                          <Text size="11px" c="dimmed">
                            Rotación pre-partido completa (fácil digestión y carga energética equilibrada).
                          </Text>
                        ) : hasTree ? (
                          <Stack gap={2} mt={2}>
                            <Text size="11px">
                              <Text span fw={600} c="teal.8">● Pauta: </Text>
                              <Text span c="dark.7" fw={500}>{formatAstToText(mealData)}</Text>
                            </Text>
                            {mealData.raw && mealData.raw !== formatAstToText(mealData) && (
                              <Text size="10px" c="dimmed" fs="italic">
                                Indicación: &quot;{mealData.raw}&quot;
                              </Text>
                            )}
                          </Stack>
                        ) : (
                          <Text size="11px" c="dark.7">{formatAstToText(mealData)}</Text>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              </Stack>
            </Paper>
          );
        })}
      </SimpleGrid>

      {/* Modal unificado para configurar la rutina completa con todas sus pautas */}
      {activeModalSchedule && (
        <PrepartidoRoutineModal
          opened={Boolean(activeModalSchedule)}
          onClose={() => setActiveModalSchedule(null)}
          scheduleKey={activeModalSchedule.key}
          scheduleLabel={activeModalSchedule.label}
          initialConfig={config?.[activeModalSchedule.key] || null}
          jugadorId={jugadorId}
          jugador={jugador}
          initialActiveMeal={activeModalSchedule.activeMeal}
          onSave={async (schedKey, schedConfig) => {
            const toSave = {
              ...config,
              [schedKey]: schedConfig,
            };
            delete toSave[schedKey].dia_anterior;
            const res = await updatePlayerField(jugadorId, 'config_prepartido', toSave);
            if (!res?.ok) throw new Error(res?.error || 'No se pudo guardar la rutina pre-partido.');
            setConfig(toSave);
            router.refresh();
            notifications.show({
              color: 'teal',
              title: 'Rutina pre-partido guardada',
              message: `La rutina para partidos por la ${activeModalSchedule.label.toLowerCase()} se ha guardado correctamente.`,
            });
          }}
          onDeactivate={async (schedKey) => {
            const toSave = { ...config };
            delete toSave[schedKey];
            const res = await updatePlayerField(jugadorId, 'config_prepartido', toSave);
            if (!res?.ok) throw new Error(res?.error || 'No se pudo restablecer el protocolo pre-partido.');
            setConfig(toSave);
            router.refresh();
            notifications.show({
              color: 'teal',
              title: 'Protocolo restablecido',
              message: `El protocolo para partidos por la ${activeModalSchedule.label.toLowerCase()} vuelve a seguir sus comidas habituales.`,
            });
          }}
        />
      )}
    </BentoCard>
  );
}

