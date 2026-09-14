'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  MultiSelect,
  Checkbox,
  NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@/components/icons3d';
import { BentoCard } from '@/components/BentoItem';
import { updatePlayerField } from '@/services/player';
import { useRouter } from 'next/navigation';
import { AVAILABLE_MEALS, STANDARD_MEALS, sortMeals } from '@/config/nutrition-days';
import EditMealPatternModal from '@/components/modals/EditMealPatternModal';

export function getRawText(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.raw || val.text || '';
}

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
    <BentoCard title={label} icon3d={icon3d} style={{ height: 'auto' }}>
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
    const count = Number(val);
    return STANDARD_MEALS.slice(0, Math.min(count, 5));
  }
  return sortMeals(val.split(',').map((s) => s.trim()).filter(Boolean));
}

export function ComidasEditable({
  label,
  numComidas,
  postentreno,
  preentreno,
  jugadorId,
  recomendacionesDefecto = {},
  _jugador = null,
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
    <BentoCard title={label} icon3d={icon3d} style={{ height: 'auto' }}>
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
            <Stack gap="xs">
              {activeMeals.map((meal) => {
                const mealData = recsDefecto[meal] || {};
                const isCompl = Boolean(mealData.isComplete);
                const hidratos = Array.isArray(mealData.hidrato) ? mealData.hidrato : mealData.hidrato ? [mealData.hidrato] : [];
                const proteinas = Array.isArray(mealData.proteina) ? mealData.proteina : mealData.proteina ? [mealData.proteina] : [];
                const verduras = Array.isArray(mealData.verdura) ? mealData.verdura : mealData.verdura ? [mealData.verdura] : [];
                const frutas = Array.isArray(mealData.fruta) ? mealData.fruta : mealData.fruta ? [mealData.fruta] : [];
                const lacteos = Array.isArray(mealData.lacteo) ? mealData.lacteo : mealData.lacteo ? [mealData.lacteo] : [];
                const grasa = mealData.grasa;

                const hasAnySpecific = hidratos.length > 0 || proteinas.length > 0 || verduras.length > 0 || frutas.length > 0 || lacteos.length > 0 || Boolean(grasa);

                return (
                  <Paper key={meal} p="xs" withBorder radius="sm">
                    <Group justify="space-between" align="flex-start" mb={4}>
                      <Group gap="xs" align="center">
                        <Text size="xs" fw={700} c="dark.8">
                          {meal}
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
                        >
                          Configurar pauta
                        </Button>
                      )}
                    </Group>

                    {isCompl || !hasAnySpecific ? (
                      <Text size="11px" c="dimmed">
                        Rotación variada y completa del comedor oficial del club según preferencias.
                      </Text>
                    ) : (
                      <Stack gap={2} mt={2}>
                        {hidratos.length > 0 && (
                          <Text size="11px">
                            <Text span fw={600} c="orange.8">● Hidratos: </Text>
                            <Text span c="dark.6">{hidratos.join(', ')}</Text>
                          </Text>
                        )}
                        {proteinas.length > 0 && (
                          <Text size="11px">
                            <Text span fw={600} c="blue.8">● Proteínas: </Text>
                            <Text span c="dark.6">{proteinas.join(', ')}</Text>
                          </Text>
                        )}
                        {verduras.length > 0 && (
                          <Text size="11px">
                            <Text span fw={600} c="green.8">● Verduras: </Text>
                            <Text span c="dark.6">{verduras.join(', ')}</Text>
                          </Text>
                        )}
                        {frutas.length > 0 && (
                          <Text size="11px">
                            <Text span fw={600} c="pink.8">● Frutas: </Text>
                            <Text span c="dark.6">{frutas.join(', ')}</Text>
                          </Text>
                        )}
                        {lacteos.length > 0 && (
                          <Text size="11px">
                            <Text span fw={600} c="indigo.8">● Lácteos / Postres: </Text>
                            <Text span c="dark.6">{lacteos.join(', ')}</Text>
                          </Text>
                        )}
                        {grasa && (
                          <Text size="11px">
                            <Text span fw={600} c="yellow.9">● Grasa: </Text>
                            <Text span c="dark.6">{grasa}</Text>
                          </Text>
                        )}
                      </Stack>
                    )}
                  </Paper>
                );
              })}
            </Stack>
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
          onSave={async (updatedMeal) => {
            const newRecs = {
              ...recsDefecto,
              [selectedMealForModal]: updatedMeal,
            };
            setRecsDefecto(newRecs);
            try {
              await updatePlayerField(jugadorId, 'recomendaciones_defecto', newRecs);
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
    <Paper radius="lg" p="md" withBorder shadow="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4}>{title}</Title>
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
        </Group>

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
      </Stack>
    </Paper>
  );
}

const SCHEDULE_OPTIONS = [
  { label: 'Mañana', value: 'manana' },
  { label: 'Tarde', value: 'tarde' },
  { label: 'Noche', value: 'noche' },
];

function sortPreMatchMealsChronological(scheduleKey, meals = []) {
  if (!Array.isArray(meals)) return [];
  // For match schedules, dinner is the 24h pre-match loading meal (the previous night!)
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

function getMealTimingBadge(scheduleKey, mealName) {
  const norm = String(mealName).toLowerCase().trim();
  if (scheduleKey === 'manana') {
    if (norm === 'cena' || norm === 'merienda') return 'Día anterior';
    return 'Día de partido';
  }
  if (scheduleKey === 'tarde' || scheduleKey === 'noche') {
    if (norm === 'cena') return 'Día anterior';
    return 'Día de partido';
  }
  return null;
}

export function PrepartidoEditable({
  label,
  configPrepartido = {},
  numComidas,
  postentreno,
  jugadorId,
  _jugador = null,
  readOnly = false,
}) {
  const router = useRouter();
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [config, setConfig] = useState(() => configPrepartido || {});
  const [saving, setSaving] = useState(false);
  const [selectedPreMeal, setSelectedPreMeal] = useState(null);

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

  function handleUpdateSchedule(scheduleKey, updates) {
    const currentCfg = config?.[scheduleKey] || {};
    const currentMeals = Array.isArray(currentCfg.ingestas) ? currentCfg.ingestas : defaultMeals;
    const currentPost = currentCfg.postentreno !== undefined ? Boolean(currentCfg.postentreno) : defaultPost;
    const currentRecs = currentCfg.recomendaciones || {};

    if (updates.ingestas && Array.isArray(updates.ingestas)) {
      updates.ingestas = sortPreMatchMealsChronological(scheduleKey, updates.ingestas);
    }

    setConfig((prev) => ({
      ...prev,
      [scheduleKey]: {
        ingestas: sortPreMatchMealsChronological(scheduleKey, currentMeals),
        postentreno: currentPost,
        recomendaciones: { ...currentRecs },
        ...(prev?.[scheduleKey] || {}),
        ...updates,
      },
    }));
  }

  async function saveSchedule(scheduleLabel, customConfig = null) {
    setSaving(true);
    try {
      const toSave = customConfig ? { ...customConfig } : { ...config };
      await updatePlayerField(jugadorId, 'config_prepartido', toSave);
      if (customConfig) setConfig(customConfig);
      else setConfig(toSave);
      setEditingSchedule(null);
      router.refresh();
      notifications.show({
        color: 'green',
        title: 'Rutina guardada',
        message: `La configuración para partidos por la ${scheduleLabel.toLowerCase()} se ha guardado correctamente.`,
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

  async function handleResetSchedule(scheduleKey, scheduleLabel) {
    const next = { ...config };
    delete next[scheduleKey];
    await saveSchedule(scheduleLabel, next);
  }

  function handleCancel() {
    try {
      setConfig(JSON.parse(configStr));
    } catch {
      setConfig({});
    }
    setEditingSchedule(null);
  }

  return (
    <BentoCard title={label} icon3d="flag" style={{ height: 'auto' }}>
      <Stack gap="sm">
        {scheduleOptions.map((opt) => {
          const cfg = config?.[opt.value];
          const hasCustomMeals = Array.isArray(cfg?.ingestas) && cfg.ingestas.length > 0;
          const hasRecs = Boolean(cfg?.recomendaciones && Object.values(cfg.recomendaciones).some((v) => Boolean(v && (typeof v === 'object' || String(v).trim()))));
          const hasLegacy = Boolean(cfg?.dia_anterior && String(cfg.dia_anterior).trim());
          const isConfigured = Boolean(cfg && (hasCustomMeals || hasRecs || hasLegacy));

          const isEditingThis = editingSchedule === opt.value;
          const currentMeals = sortPreMatchMealsChronological(opt.value, Array.isArray(cfg?.ingestas) ? cfg.ingestas : defaultMeals);
          const currentPost = cfg?.postentreno !== undefined ? Boolean(cfg.postentreno) : defaultPost;
          const currentRecs = { ...(cfg?.recomendaciones || {}) };
          if (cfg?.dia_anterior && !currentRecs.Cena && !currentRecs.cena) {
            currentRecs.Cena = cfg.dia_anterior;
          }
          const mealsList = cfg?.ingestas && cfg.ingestas.length > 0 ? sortPreMatchMealsChronological(opt.value, cfg.ingestas).join(', ') : 'Habituales';

          if (!isEditingThis) {
            if (!isConfigured) {
              return (
                <Paper key={opt.value} p="sm" withBorder radius="md">
                  <Group justify="space-between" align="center" mb={4}>
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
                        variant="subtle"
                        size="xs"
                        radius="xl"
                        disabled={editingSchedule !== null && editingSchedule !== opt.value}
                        onClick={() => setEditingSchedule(opt.value)}
                      >
                        Configurar
                      </Button>
                    )}
                  </Group>

                  <Text size="xs" c="dimmed">
                    Sin protocolo específico configurado. En días de partido por la {opt.label.toLowerCase()} se aplicará el menú del comedor de la ciudad deportiva o sus ingestas habituales.
                  </Text>
                </Paper>
              );
            }

            return (
              <Paper key={opt.value} p="sm" withBorder radius="md">
                <Group justify="space-between" align="center" mb={6}>
                  <Group gap="xs" align="center">
                    <Text size="sm" fw={700} c="dark.7">
                      Partido por la {opt.label}
                    </Text>
                    <Text size="xs" c="teal.7" fw={600}>
                      ● Configurado ({currentMeals.length} {currentMeals.length === 1 ? 'ingesta' : 'ingestas'})
                    </Text>
                  </Group>

                  {!readOnly && (
                    <Button
                      variant="subtle"
                      size="xs"
                      radius="xl"
                      disabled={editingSchedule !== null && editingSchedule !== opt.value}
                      onClick={() => setEditingSchedule(opt.value)}
                    >
                      Editar tomas
                    </Button>
                  )}
                </Group>

                <Stack gap={6}>
                  <Text size="xs" c="dark.6">
                    <Text span fw={600} c="dimmed">Ingestas pautadas: </Text>
                    {mealsList} ({currentPost ? 'con toma post-partido' : 'sin post-partido'})
                  </Text>

                  {/* Detalle estructurado de cada comida */}
                  <Stack gap="xs" mt={4}>
                    {currentMeals.map((m) => {
                      const timing = getMealTimingBadge(opt.value, m);
                      const mealData = currentRecs[m] || {};
                      const isCompl = Boolean(mealData.isComplete);
                      const hidratos = Array.isArray(mealData.hidrato) ? mealData.hidrato : mealData.hidrato ? [mealData.hidrato] : [];
                      const proteinas = Array.isArray(mealData.proteina) ? mealData.proteina : mealData.proteina ? [mealData.proteina] : [];
                      const verduras = Array.isArray(mealData.verdura) ? mealData.verdura : mealData.verdura ? [mealData.verdura] : [];
                      const frutas = Array.isArray(mealData.fruta) ? mealData.fruta : mealData.fruta ? [mealData.fruta] : [];
                      const lacteos = Array.isArray(mealData.lacteo) ? mealData.lacteo : mealData.lacteo ? [mealData.lacteo] : [];
                      const grasa = mealData.grasa;

                      const hasAnySpecific = hidratos.length > 0 || proteinas.length > 0 || verduras.length > 0 || frutas.length > 0 || lacteos.length > 0 || Boolean(grasa);

                      return (
                        <Paper key={m} p="xs" withBorder radius="sm" bg="gray.0">
                          <Group justify="space-between" align="flex-start" mb={2}>
                            <Group gap="xs" align="center">
                              <Text size="xs" fw={700} c="dark.8">
                                {m} {timing ? `(${timing})` : ''}
                              </Text>
                            </Group>

                            {!readOnly && (
                              <Button
                                variant="light"
                                color="dark"
                                size="compact-xs"
                                radius="xl"
                                leftSection={<IconEdit size={12} />}
                                onClick={() => setSelectedPreMeal({ scheduleKey: opt.value, scheduleLabel: opt.label, meal: m })}
                              >
                                Configurar pauta
                              </Button>
                            )}
                          </Group>

                          {isCompl || !hasAnySpecific ? (
                            <Text size="11px" c="dimmed">
                              Rotación pre-partido completa (fácil digestión y carga energética equilibrada).
                            </Text>
                          ) : (
                            <Stack gap={2} mt={2}>
                              {hidratos.length > 0 && (
                                <Text size="11px">
                                  <Text span fw={600} c="orange.8">● Hidratos: </Text>
                                  <Text span c="dark.6">{hidratos.join(', ')}</Text>
                                </Text>
                              )}
                              {proteinas.length > 0 && (
                                <Text size="11px">
                                  <Text span fw={600} c="blue.8">● Proteínas: </Text>
                                  <Text span c="dark.6">{proteinas.join(', ')}</Text>
                                </Text>
                              )}
                              {verduras.length > 0 && (
                                <Text size="11px">
                                  <Text span fw={600} c="green.8">● Verduras: </Text>
                                  <Text span c="dark.6">{verduras.join(', ')}</Text>
                                </Text>
                              )}
                              {frutas.length > 0 && (
                                <Text size="11px">
                                  <Text span fw={600} c="pink.8">● Frutas: </Text>
                                  <Text span c="dark.6">{frutas.join(', ')}</Text>
                                </Text>
                              )}
                              {lacteos.length > 0 && (
                                <Text size="11px">
                                  <Text span fw={600} c="indigo.8">● Lácteos / Postres: </Text>
                                  <Text span c="dark.6">{lacteos.join(', ')}</Text>
                                </Text>
                              )}
                              {grasa && (
                                <Text size="11px">
                                  <Text span fw={600} c="yellow.9">● Grasa: </Text>
                                  <Text span c="dark.6">{grasa}</Text>
                                </Text>
                              )}
                            </Stack>
                          )}
                        </Paper>
                      );
                    })}
                  </Stack>
                </Stack>
              </Paper>
            );
          }

          return (
            <Paper key={opt.value} p="sm" withBorder radius="md" bg="gray.0">
              <Group justify="space-between" align="center" mb="sm" wrap="wrap">
                <Group gap="xs" align="center">
                  <Text size="sm" fw={700} c="dark.8">
                    Editando: Partidos por la {opt.label}
                  </Text>
                  {isConfigured ? (
                    <Text size="xs" c="teal.7" fw={600}>● Configurado</Text>
                  ) : (
                    <Text size="xs" c="dimmed">● Sin configurar</Text>
                  )}
                </Group>
                <Group gap={6}>
                  {isConfigured && (
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      radius="xl"
                      onClick={() => handleResetSchedule(opt.value, opt.label)}
                      disabled={saving}
                    >
                      Desactivar
                    </Button>
                  )}
                  <Button variant="filled" size="xs" radius="xl" onClick={() => saveSchedule(opt.label)} loading={saving}>
                    Guardar tomas
                  </Button>
                  <Button variant="subtle" color="gray" size="xs" radius="xl" onClick={handleCancel} disabled={saving}>
                    Cancelar
                  </Button>
                </Group>
              </Group>

              <Stack gap="xs">
                {/* 1º Ingestas que componen la rutina pre-partido */}
                <Box>
                  <Text size="xs" fw={700} c="dark.7" mb={2}>Ingestas del Protocolo Pre-Partido</Text>
                  <Text size="11px" c="dimmed" mb={6}>
                    Selecciona las ingestas que componen la rutina previa (incluyendo la cena de carga del día anterior):
                  </Text>
                  <MultiSelect
                    placeholder="Ej. Cena, Desayuno, Comida, Merienda"
                    data={AVAILABLE_MEALS}
                    value={currentMeals}
                    onChange={(val) => {
                      const sorted = sortPreMatchMealsChronological(opt.value, val);
                      const cleanRecs = { ...currentRecs };
                      Object.keys(cleanRecs).forEach((k) => {
                        if (!sorted.includes(k)) delete cleanRecs[k];
                      });
                      handleUpdateSchedule(opt.value, { ingestas: sorted, recomendaciones: cleanRecs });
                    }}
                    size="xs"
                    searchable
                    clearable
                  />
                  <Checkbox
                    label="Incluir toma Post-partido / Batido de recuperación"
                    checked={currentPost}
                    onChange={(e) => handleUpdateSchedule(opt.value, { postentreno: e.currentTarget.checked })}
                    mt="xs"
                    size="xs"
                  />
                </Box>
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {/* Modal para editar la pauta de una toma pre-partido */}
      {selectedPreMeal && (
        <EditMealPatternModal
          opened={Boolean(selectedPreMeal)}
          onClose={() => setSelectedPreMeal(null)}
          mealName={selectedPreMeal.meal}
          timing={`${selectedPreMeal.scheduleLabel} - ${getMealTimingBadge(selectedPreMeal.scheduleKey, selectedPreMeal.meal) || 'Día de partido'}`}
          value={config?.[selectedPreMeal.scheduleKey]?.recomendaciones?.[selectedPreMeal.meal] || null}
          jugadorId={jugadorId}
          onSave={async (updatedMeal) => {
            const scheduleKey = selectedPreMeal.scheduleKey;
            const currentCfg = config?.[scheduleKey] || {};
            const currentRecs = { ...(currentCfg.recomendaciones || {}) };
            currentRecs[selectedPreMeal.meal] = updatedMeal;

            const newConfig = {
              ...config,
              [scheduleKey]: {
                ...currentCfg,
                recomendaciones: currentRecs,
              },
            };

            setConfig(newConfig);
            try {
              await updatePlayerField(jugadorId, 'config_prepartido', newConfig);
              notifications.show({
                color: 'teal',
                title: 'Pauta pre-partido guardada',
                message: `Pauta para ${selectedPreMeal.meal} guardada correctamente.`,
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
