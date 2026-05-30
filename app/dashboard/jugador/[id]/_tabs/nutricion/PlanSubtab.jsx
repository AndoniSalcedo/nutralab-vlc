'use client';

import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowsLeftRight,
  IconBrain,
  IconCheck,
  IconDownload,
  IconEdit,
  IconFileAi,
  IconPlus,
  IconSparkles,
} from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound/NothingFound';
import { buildBasePlanData, PLAN_DAY_TYPES, sanitizePlanData } from '@/lib/nutrition-plan-card';
import IntercambiosModal from './IntercambiosModal';

const CONTEXTOS = [
  { value: 'semana_normal', label: 'Semana normal de entrenamiento' },
  { value: 'semana_partido', label: 'Semana con partido oficial' },
  { value: 'dia_partido', label: 'Día de partido' },
  { value: 'viaje', label: 'Viaje / desplazamiento' },
  { value: 'lesion', label: 'Lesión / inactividad' },
  { value: 'vacaciones', label: 'Vacaciones / fuera de temporada' },
  { value: 'pretemporada', label: 'Pretemporada (alta carga)' },
];

function planLabel(plan) {
  const date = plan.updated_at || plan.created_at;
  const suffix = date ? ` · ${new Date(date).toLocaleDateString('es-ES')}` : '';
  return `${plan.nombre}${suffix}`;
}

function filenameFromResponse(response, fallback) {
  const header = response.headers.get('Content-Disposition') || '';
  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) return decodeURIComponent(encodedMatch[1]);
  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

function formatNumber(value, suffix = '') {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '-';
  return `${String(Math.round(n * 10) / 10).replace('.', ',')}${suffix}`;
}

function formatInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '-';
  return Math.round(n).toLocaleString('es-ES');
}

function planWithMeta(data, { nombre, contexto, contextoAdicional }) {
  const clean = sanitizePlanData(data);
  if (!clean) return null;
  return {
    ...clean,
    meta: {
      ...clean.meta,
      nombre,
      contexto,
      contextoAdicional,
    },
  };
}

function clonePlan(data) {
  return data ? JSON.parse(JSON.stringify(data)) : null;
}

function MetricCard({ label, value, color = 'orange' }) {
  return (
    <Paper className="ficha-metric" p="md" radius="sm">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
      <Title order={3} c={color} mt={4}>{value}</Title>
    </Paper>
  );
}

function MacroCard({ item, index }) {
  return (
    <Paper className={`ficha-macro ${index === 1 ? 'is-middle' : ''}`} p="md" radius="sm">
      <Text size="xs" fw={800} tt="uppercase" c={index === 2 ? 'orange.4' : 'teal.3'}>{item.kcalLabel}</Text>
      <Title order={2} c="orange.4" mt={4}>{formatInt(item.kcal)}</Title>
      <Text size="xs" c="dimmed">kcal</Text>
      <SimpleGrid cols={3} spacing={4} mt="sm">
        <Box ta="center">
          <Text size="sm" fw={800} c="grape.3">{formatInt(item.proteina)} g</Text>
          <Text size="9px" c="dimmed" tt="uppercase">Proteína</Text>
        </Box>
        <Box ta="center">
          <Text size="sm" fw={800} c="teal.3">{formatInt(item.hidratos)} g</Text>
          <Text size="9px" c="dimmed" tt="uppercase">Hidratos</Text>
        </Box>
        <Box ta="center">
          <Text size="sm" fw={800} c="orange.3">{formatInt(item.grasa)} g</Text>
          <Text size="9px" c="dimmed" tt="uppercase">Grasas</Text>
        </Box>
      </SimpleGrid>
    </Paper>
  );
}

function PlanFicha({ data }) {
  const plan = sanitizePlanData(data);
  if (!plan) return null;

  return (
    <Paper className="ficha" radius="sm" shadow="sm">
      <Box className="ficha-top">
        <Text>Valencia CF · Nutrición Deportiva · Temporada 2025/26</Text>
      </Box>

      <Box className="ficha-body">
        <Title className="ficha-title">{plan.jugador.nombre}</Title>
        <Text className="ficha-position">{plan.jugador.posicion}</Text>
        <Box className="ficha-rule" />

        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm" mt="xl">
          <MetricCard label="Peso" value={formatNumber(plan.metricas.peso, ' kg')} color="orange.4" />
          <MetricCard label="Grasa" value={formatNumber(plan.metricas.grasa, ' %')} color="orange.4" />
          <MetricCard label="M. magra" value={formatNumber(plan.metricas.masaMagra, ' kg')} color="green.4" />
          <MetricCard label="Objetivo" value={plan.metricas.pesoObjetivo ? `~${formatNumber(plan.metricas.pesoObjetivo, ' kg')}` : '-'} color="teal.3" />
        </SimpleGrid>

        <Text className="ficha-section">Distribución calórica por tipo de día</Text>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
          {PLAN_DAY_TYPES.map((dayType, index) => (
            <MacroCard key={dayType.key} item={plan.tiposDia[dayType.key]} index={index} />
          ))}
        </SimpleGrid>

        <Divider my="md" color="#343963" />

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
          {PLAN_DAY_TYPES.map((dayType, index) => {
            const item = plan.tiposDia[dayType.key];
            return (
              <Stack key={dayType.key} gap={4}>
                <Box className="ficha-day-header" data-match={index === 2 ? 'true' : 'false'}>
                  {item.label}
                </Box>
                {item.ingestas.map((meal, mealIndex) => (
                  <Box key={`${dayType.key}-${meal.nombre}-${mealIndex}`} className="ficha-meal">
                    <Text className="ficha-meal-name">{meal.nombre}</Text>
                    <Text className="ficha-meal-detail">{meal.detalle || '-'}</Text>
                  </Box>
                ))}
              </Stack>
            );
          })}
        </SimpleGrid>

        {plan.notas.length > 0 && (
          <Box className="ficha-notes">
            {plan.notas.join('   ·   ')}
          </Box>
        )}

        <Text className="ficha-footer">Carlos Ferrando · Valencia CF · @c.ferrando · Nutricionista Deportivo y Clínico</Text>
      </Box>
    </Paper>
  );
}

export default function PlanSubtab({ jugador, readOnly = false }) {
  const [planes, setPlanes] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [mode, setMode] = useState('view');
  const [intercambiosOpened, setIntercambiosOpened] = useState(false);

  const [nombre, setNombre] = useState('');
  const [contexto, setContexto] = useState('semana_normal');
  const [contextoAdicional, setContextoAdicional] = useState('');
  const [contenido, setContenido] = useState('');
  const [datos, setDatos] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [actionType, setActionType] = useState(null);
  const isDocumentMode = mode === 'create' || mode === 'edit';
  const loadingAction = Boolean(actionType);

  const currentPlan = useMemo(
    () => planes.find((plan) => String(plan.id) === String(currentId)) || null,
    [planes, currentId]
  );

  const currentDatos = useMemo(() => sanitizePlanData(currentPlan?.datos), [currentPlan]);

  const planHtml = useMemo(() => {
    if (!currentPlan?.contenido || currentDatos || mode !== 'view') return '';
    marked.setOptions({ breaks: true, gfm: true });
    return marked(currentPlan.contenido);
  }, [currentPlan, currentDatos, mode]);

  useEffect(() => {
    let active = true;
    async function loadPlanes() {
      setLoadingList(true);
      try {
        const res = await fetch(`/api/ai-plan?jugador_id=${jugador.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al cargar planes');
        if (!active) return;
        const list = data.planes || [];
        setPlanes(list);
        setCurrentId(list.length ? String(list[0].id) : null);
        setMode('view');
      } catch (e) {
        if (active) {
          notifications.show({
            color: 'red',
            title: 'No se pudieron cargar los planes',
            message: e.message,
          });
        }
      } finally {
        if (active) setLoadingList(false);
      }
    }
    loadPlanes();
    return () => {
      active = false;
    };
  }, [jugador.id]);

  function startCreate() {
    const now = new Date();
    const nextNombre = `Ficha ${now.toLocaleDateString('es-ES')}`;
    setMode('create');
    setNombre(nextNombre);
    setContexto('semana_normal');
    setContextoAdicional('');
    setContenido('');
    setDatos(buildBasePlanData({ jugador, nombre: nextNombre, contexto: 'semana_normal', contextoAdicional: '' }));
  }

  function startEdit() {
    if (!currentPlan) return;
    setMode('edit');
    setNombre(currentPlan.nombre || '');
    setContexto(currentPlan.contexto || currentPlan.datos?.meta?.contexto || 'semana_normal');
    setContextoAdicional(currentPlan.contexto_adicional || currentPlan.datos?.meta?.contextoAdicional || '');
    setContenido(currentPlan.contenido || '');
    setDatos(currentDatos ? clonePlan(currentDatos) : null);
  }

  function cancelForm() {
    setMode('view');
  }

  function updateDatos(updater) {
    setDatos((prev) => {
      const draft = clonePlan(prev);
      if (!draft) return prev;
      updater(draft);
      return draft;
    });
  }

  async function generateDraft() {
    const notificationId = 'ai-plan-generate';
    setActionType('generate');
    notifications.show({
      id: notificationId,
      color: 'blue',
      title: 'Generando ficha nutricional',
      message: `Preparando ficha compacta para ${jugador.nombre}.`,
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador, nombre, contexto, contextoAdicional, draftOnly: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar la ficha');
      setDatos(data.datos || null);
      setContenido('');
      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Ficha generada',
        message: 'Ya puedes revisar y editar los datos antes de guardarlos.',
        loading: false,
        autoClose: 4000,
        withCloseButton: true,
      });
    } catch (e) {
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'No se pudo generar la ficha',
        message: e.message,
        loading: false,
        autoClose: 6000,
        withCloseButton: true,
      });
    } finally {
      setActionType(null);
    }
  }

  async function saveCreate() {
    const notificationId = 'ai-plan-save';
    const finalDatos = planWithMeta(datos, { nombre, contexto, contextoAdicional });
    setActionType('save');
    notifications.show({
      id: notificationId,
      color: 'blue',
      title: 'Guardando ficha',
      message: 'Guardando cambios del plan nutricional.',
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador, nombre, contexto, contextoAdicional, datos: finalDatos, contenido }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el plan');
      setPlanes((prev) => [data.plan, ...prev]);
      setCurrentId(String(data.plan.id));
      setMode('view');
      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Ficha guardada',
        message: 'El nuevo plan nutricional se ha guardado correctamente.',
        loading: false,
        autoClose: 4000,
        withCloseButton: true,
      });
    } catch (e) {
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'No se pudo guardar el plan',
        message: e.message,
        loading: false,
        autoClose: 6000,
        withCloseButton: true,
      });
    } finally {
      setActionType(null);
    }
  }

  async function saveEdit() {
    if (!currentPlan) return;
    const notificationId = 'ai-plan-save';
    const finalDatos = planWithMeta(datos, { nombre, contexto, contextoAdicional });
    setActionType('save');
    notifications.show({
      id: notificationId,
      color: 'blue',
      title: 'Guardando ficha',
      message: 'Guardando cambios del plan nutricional.',
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentPlan.id,
          nombre,
          contenido,
          datos: finalDatos,
          contexto,
          contextoAdicional,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el plan');
      setPlanes((prev) => [data.plan, ...prev.filter((plan) => plan.id !== data.plan.id)]);
      setCurrentId(String(data.plan.id));
      setMode('view');
      notifications.update({
        id: notificationId,
        color: 'green',
        title: 'Ficha guardada',
        message: 'Los cambios del plan nutricional se han guardado correctamente.',
        loading: false,
        autoClose: 4000,
        withCloseButton: true,
      });
    } catch (e) {
      notifications.update({
        id: notificationId,
        color: 'red',
        title: 'No se pudo guardar el plan',
        message: e.message,
        loading: false,
        autoClose: 6000,
        withCloseButton: true,
      });
    } finally {
      setActionType(null);
    }
  }

  async function downloadPdf() {
    if (!currentPlan?.id || !currentDatos) return;
    setActionType('download');
    try {
      const res = await fetch(`/api/ai-plan/${currentPlan.id}/pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo descargar el PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filenameFromResponse(res, `Ficha_${currentPlan.nombre || 'Nutricional'}.pdf`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notifications.show({
        color: 'green',
        title: 'PDF listo',
        message: 'La ficha nutricional se ha descargado correctamente.',
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error de descarga',
        message: e.message,
      });
    } finally {
      setActionType(null);
    }
  }

  const perfilResumen = [
    jugador.num_comidas ? `${jugador.num_comidas} comidas/día` : null,
    jugador.objetivo || null,
    jugador.alergias ? `Alergias: ${jugador.alergias.slice(0, 30)}` : null,
    jugador.intolerancias ? `Intol: ${jugador.intolerancias.slice(0, 30)}` : null,
    jugador.gustos_preferencias ? `Gustos: ${jugador.gustos_preferencias.slice(0, 30)}` : null,
  ].filter(Boolean);

  const canSave = nombre.trim() && (datos || contenido.trim()) && actionType !== 'generate';

  return (
    <Stack gap={0}>
      <Paper p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Group gap="xs">
              <IconBrain size={22} color="var(--mantine-color-blue-filled)" />
              <Stack gap={2}>
                <Title order={3} fw={800} c="dark.4">Planes nutricionales</Title>
                <Text size="sm" c="dimmed">
                  Fichas compactas con métricas, macros y pautas editables.
                </Text>
              </Stack>
            </Group>
            <Group gap="xs">
              <Button
                size="xs"
                radius="xl"
                color="dark"
                leftSection={<IconArrowsLeftRight size={16} />}
                onClick={() => setIntercambiosOpened(true)}
              >
                Intercambios
              </Button>
              {currentDatos && mode === 'view' && (
                <Button
                  size="xs"
                  radius="xl"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={downloadPdf}
                  loading={actionType === 'download'}
                >
                  Descargar PDF
                </Button>
              )}
              {!readOnly && (
                <>
                  <Button size="xs" radius="xl" variant="light" leftSection={<IconEdit size={16} />} onClick={startEdit} disabled={!currentPlan || mode !== 'view'}>
                    Editar actual
                  </Button>
                  <Button size="xs" radius="xl" leftSection={<IconPlus size={16} />} onClick={startCreate}>
                    Crear ficha
                  </Button>
                </>
              )}
            </Group>
          </Group>

          {perfilResumen.length > 0 && (
            <Group gap={6}>
              {perfilResumen.map((item, i) => (
                <Badge key={i} variant="light" color="gray" size="sm" radius="sm">
                  {item}
                </Badge>
              ))}
            </Group>
          )}

          <Select
            placeholder={loadingList ? 'Cargando planes...' : 'Sin planes creados'}
            data={planes.map((plan) => ({ value: String(plan.id), label: planLabel(plan) }))}
            value={currentId}
            onChange={(val) => {
              if (!val) return;
              setCurrentId(val);
              setMode('view');
            }}
            allowDeselect={false}
            searchable
            variant="filled"
            radius="md"
            leftSection={<IconFileAi size={16} />}
            disabled={loadingList || planes.length === 0 || isDocumentMode}
            rightSection={loadingList ? <Loader size={16} /> : null}
            style={{ flex: 1, minWidth: 260 }}
          />
        </Stack>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }} px={{ base: 'sm', sm: 0 }}>
        {loadingList ? (
          <Paper p={{ base: 'md', sm: 'xl' }} radius="lg" withBorder shadow="sm" style={{ textAlign: 'center' }}>
            <Loader size="lg" />
          </Paper>
        ) : isDocumentMode ? (
          <Paper p={{ base: 'sm', sm: 'lg' }} radius="lg" withBorder shadow="sm">
            <Stack gap="lg">
              <Group justify="space-between" align="flex-start" wrap="wrap">
                <Box>
                  <Title order={3}>{mode === 'create' ? 'Nueva ficha nutricional' : 'Editar plan nutricional'}</Title>
                  <Text size="sm" c="dimmed">
                    Genera una ficha breve, ajusta los datos y guarda la versión final.
                  </Text>
                </Box>
                <Group gap="xs">
                  <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={cancelForm} disabled={loadingAction}>
                    Cancelar
                  </Button>
                  <Button
                    variant="light"
                    size="xs"
                    radius="xl"
                    leftSection={<IconSparkles size={16} />}
                    onClick={generateDraft}
                    loading={actionType === 'generate'}
                    disabled={!nombre.trim() || actionType === 'save'}
                  >
                    {datos ? 'Regenerar ficha IA' : 'Generar ficha IA'}
                  </Button>
                  <Button
                    size="xs"
                    radius="xl"
                    leftSection={<IconCheck size={16} />}
                    onClick={mode === 'create' ? saveCreate : saveEdit}
                    loading={actionType === 'save'}
                    disabled={!canSave}
                  >
                    Guardar plan
                  </Button>
                </Group>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <TextInput
                  label="Nombre del plan"
                  placeholder="Ej: Semana partido vs Real Sociedad"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
                <Select
                  label="Contexto actual"
                  placeholder="Selecciona el contexto"
                  data={CONTEXTOS}
                  value={contexto}
                  onChange={(value) => setContexto(value || 'semana_normal')}
                />
              </SimpleGrid>

              <Textarea
                label="Instrucciones adicionales para la IA"
                placeholder="Ej: Sale de lesión, reduce fibra el día de partido..."
                value={contextoAdicional}
                onChange={(e) => setContextoAdicional(e.target.value)}
                rows={2}
              />

              {datos ? (
                <>
                  <Paper p="md" radius="md" withBorder bg="gray.0">
                    <Title order={4} mb="md">Métricas de la ficha</Title>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                      {[
                        ['peso', 'Peso (kg)'],
                        ['grasa', 'Grasa (%)'],
                        ['masaMagra', 'Masa magra (kg)'],
                        ['pesoObjetivo', 'Peso objetivo (kg)'],
                      ].map(([key, label]) => (
                        <NumberInput
                          key={key}
                          label={label}
                          value={datos.metricas?.[key] ?? ''}
                          decimalScale={1}
                          min={0}
                          onChange={(value) => updateDatos((draft) => {
                            draft.metricas[key] = value === '' ? null : Number(value);
                          })}
                        />
                      ))}
                    </SimpleGrid>
                  </Paper>

                  {PLAN_DAY_TYPES.map((dayType) => {
                    const item = datos.tiposDia?.[dayType.key];
                    return (
                      <Paper key={dayType.key} p="md" radius="md" withBorder>
                        <Group justify="space-between" align="center" mb="md">
                          <Title order={4}>{item?.label || dayType.label}</Title>
                          <Badge variant="light" color={dayType.key === 'partido' ? 'orange' : 'teal'}>
                            {formatInt(item?.kcal)} kcal
                          </Badge>
                        </Group>
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
                          {[
                            ['kcal', 'Kcal'],
                            ['proteina', 'Proteína (g)'],
                            ['hidratos', 'Hidratos (g)'],
                            ['grasa', 'Grasa (g)'],
                          ].map(([key, label]) => (
                            <NumberInput
                              key={key}
                              label={label}
                              value={item?.[key] ?? ''}
                              min={0}
                              onChange={(value) => updateDatos((draft) => {
                                draft.tiposDia[dayType.key][key] = value === '' ? null : Number(value);
                              })}
                            />
                          ))}
                        </SimpleGrid>
                        <Stack gap="sm">
                          {item?.ingestas?.map((meal, index) => (
                            <SimpleGrid key={`${dayType.key}-${index}`} cols={{ base: 1, md: 4 }} spacing="sm">
                              <TextInput
                                label="Ingesta"
                                value={meal.nombre}
                                onChange={(e) => updateDatos((draft) => {
                                  draft.tiposDia[dayType.key].ingestas[index].nombre = e.target.value;
                                })}
                              />
                              <Box className="meal-detail-field">
                                <Textarea
                                  label="Detalle"
                                  value={meal.detalle}
                                  autosize
                                  minRows={1}
                                  onChange={(e) => updateDatos((draft) => {
                                    draft.tiposDia[dayType.key].ingestas[index].detalle = e.target.value;
                                  })}
                                />
                              </Box>
                            </SimpleGrid>
                          ))}
                        </Stack>
                      </Paper>
                    );
                  })}

                  <Textarea
                    label="Notas de pie de ficha"
                    description="Una nota por línea."
                    value={(datos.notas || []).join('\n')}
                    autosize
                    minRows={3}
                    onChange={(e) => updateDatos((draft) => {
                      draft.notas = e.target.value.split('\n').map((line) => line.trim()).filter(Boolean);
                    })}
                  />
                </>
              ) : (
                <Textarea
                  label="Documento del plan legado"
                  description="Este plan antiguo no tiene datos de ficha; se puede editar como Markdown."
                  placeholder="Escribe el plan manualmente..."
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  autosize={false}
                  styles={{
                    input: {
                      minHeight: '58vh',
                      fontFamily: 'ui-serif, Georgia, Cambria, Times New Roman, Times, serif',
                      fontSize: 15,
                      lineHeight: 1.75,
                      padding: 24,
                      background: 'var(--mantine-color-gray-0)',
                    },
                  }}
                />
              )}
            </Stack>
          </Paper>
        ) : !currentPlan ? (
          <Box mt="xl">
            <NothingFound
              icon={IconBrain}
              title="Sin planes nutricionales"
              description="Todavía no hay planes nutricionales creados para este jugador."
              actionLabel={!readOnly ? 'Crear primera ficha' : undefined}
              onAction={!readOnly ? startCreate : undefined}
            />
          </Box>
        ) : currentDatos ? (
          <PlanFicha data={currentDatos} />
        ) : planHtml ? (
          <Paper p={{ base: 'sm', sm: 'xl' }} radius="lg" withBorder shadow="sm">
            <Badge mb="md" color="gray" variant="light">Plan legado</Badge>
            <Box className="plan-md" dangerouslySetInnerHTML={{ __html: planHtml }} />
          </Paper>
        ) : (
          <Box mt="xl">
            <NothingFound title="Error" description="No se pudo cargar el detalle seleccionado." />
          </Box>
        )}
      </Box>

      <IntercambiosModal opened={intercambiosOpened} onClose={() => setIntercambiosOpened(false)} />

      <style>{`
        .ficha { overflow: hidden; background: #101229; color: white; }
        .ficha-top { background: #254d5c; color: #cad6df; text-align: center; padding: 18px 12px; text-transform: uppercase; font-size: 11px; letter-spacing: 1.4px; }
        .ficha-body { padding: 28px clamp(16px, 4vw, 42px) 32px; }
        .ficha-title { color: white; text-align: center; font-size: clamp(28px, 5vw, 44px); line-height: 1; text-transform: uppercase; letter-spacing: 0; }
        .ficha-position { color: #ff8b52; text-align: center; text-transform: uppercase; font-weight: 800; margin-top: 6px; }
        .ficha-rule { height: 2px; background: #ff785f; margin: 12px auto 0; max-width: 82%; }
        .ficha-metric { background: #161839; text-align: center; border: 1px solid #1d2145; }
        .ficha-macro { background: #292b5c; text-align: center; border: 1px solid #343963; min-height: 132px; }
        .ficha-macro.is-middle { background: #1d1f46; }
        .ficha-section { text-align: center; color: #b9c7df; text-transform: uppercase; font-size: 13px; font-weight: 800; margin: 28px 0 12px; }
        .ficha-day-header { background: #254d5c; color: #38c6b4; text-align: center; padding: 8px; text-transform: uppercase; font-size: 11px; font-weight: 800; border-radius: 2px; }
        .ficha-day-header[data-match="true"] { color: #ff8b52; }
        .ficha-meal { background: #1d1f46; min-height: 54px; padding: 8px; border-radius: 2px; }
        .ficha-meal-name { color: #ff8b52; text-transform: uppercase; font-size: 11px; font-weight: 800; line-height: 1.1; }
        .ficha-meal-detail { color: #aab0c8; font-size: 12px; line-height: 1.35; margin-top: 3px; }
        .ficha-notes { background: #071e36; color: #d8e9f8; text-align: center; margin-top: 18px; padding: 12px; font-size: 12px; line-height: 1.45; }
        .ficha-footer { color: #aab0c8; text-align: center; font-size: 11px; margin-top: 18px; }
        @media (min-width: 62em) { .meal-detail-field { grid-column: span 3; } }
        .plan-md h1 { font-size: 24px; font-weight: 800; color: var(--mantine-color-dark-4); margin: 0 0 12px; letter-spacing: 0; }
        .plan-md h2 { font-size: 14px; font-weight: 700; color: var(--mantine-color-blue-filled); text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid var(--mantine-color-blue-light); }
        .plan-md h3 { font-size: 16px; font-weight: 600; color: var(--mantine-color-dark-4); margin: 20px 0 10px; }
        .plan-md p { margin: 10px 0; color: var(--mantine-color-gray-7); font-size: 14px; line-height: 1.7; }
        .plan-md strong { color: var(--mantine-color-dark-4); font-weight: 700; }
        .plan-md ul, .plan-md ol { padding-left: 24px; margin: 12px 0; }
        .plan-md li { margin: 8px 0; color: var(--mantine-color-gray-7); font-size: 14px; line-height: 1.6; }
        .plan-md table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        .plan-md th { background: var(--mantine-color-gray-0); color: var(--mantine-color-blue-filled); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 12px; border: 1px solid var(--mantine-color-gray-2); text-align: left; }
        .plan-md td { padding: 12px; border: 1px solid var(--mantine-color-gray-2); color: var(--mantine-color-gray-7); }
      `}</style>
    </Stack>
  );
}
