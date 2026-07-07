'use client';

import { useEffect, useMemo, useState } from 'react';
import { filenameFromResponse, formatNumberDecimal, formatInteger as formatInt } from '@/lib/utils';
import { marked } from 'marked';
import {
  Badge,
  Box,
  Button,
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
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getAiPlans, generateAiPlanDraft, saveAiPlan, updateAiPlan, downloadAiPlanPdf, deleteAiPlan } from '@/services/plan';
import { getWeeklyMenus } from '@/services/menu';
import {
  IconArrowsLeftRight,
  IconBrain,
  IconCheck,
  IconDownload,
  IconEdit,
  IconFileAi,
  IconPlus,
  IconSparkles,
  IconTrash,
} from '@tabler/icons-react';
import { buildBasePlanData, sanitizePlanData } from '@/lib/nutrition-plan-card';
import { calculateByObjective, getDayTypeColor, getDayTypeLabel, getObjectiveLabel, PLAN_CONTEXTS, getTeamNutritionDayTypes } from '@/lib/calculations';
import { getUserMeals } from '@/lib/nutrition-day-types';
import IntercambiosModal from './IntercambiosModal';
import NothingFound from '@/components/NothingFound/NothingFound';



function planLabel(plan) {
  const date = plan.updated_at || plan.created_at;
  const suffix = date ? ` · ${new Date(date).toLocaleDateString('es-ES')}` : '';
  return `${plan.nombre}${suffix}`;
}

function formatNumber(value, suffix = '') {
  return formatNumberDecimal(value, suffix, 1);
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

function PlanFicha({ data }) {
  const plan = sanitizePlanData(data);
  if (!plan) return null;

  const leftDays = ['lunes', 'martes', 'miercoles', 'jueves'];
  const rightDays = ['viernes', 'sabado', 'domingo'];

  const renderDayBox = (dayKey) => {
    const dayData = plan.dias[dayKey];
    if (!dayData) return null;
    const color = getDayTypeColor(dayData.tipoDia);
    const label = getDayTypeLabel(dayData.tipoDia);
    return (
      <Paper key={dayKey} p="md" radius="md" style={{ backgroundColor: '#151932', border: '1px solid #2d335a' }} mb="sm">
        <Group justify="space-between" align="center" mb="xs">
          <Text size="md" fw={900} tt="uppercase">{dayData.label}</Text>
          <Badge variant="light" color={color}>{label}</Badge>
        </Group>
        <Text size="xs" fw={700} c="dimmed" mb="sm">
          {formatInt(dayData.kcal)} kcal · P: {formatInt(dayData.proteina)}g · HC: {formatInt(dayData.hidratos)}g · G: {formatInt(dayData.grasa)}g
        </Text>
        <Stack gap="xs">
          {dayData.ingestas.map((meal, mealIndex) => (
            <Box key={mealIndex} p="xs" style={{ backgroundColor: '#1d1f46', borderRadius: '4px' }}>
              <Text size="xs" fw={800} c="orange.4" tt="uppercase" lh={1.1}>{meal.nombre}</Text>
              <Text size="sm" c="gray.3" mt={2} style={{ lineHeight: 1.35 }}>{meal.detalle || '-'}</Text>
            </Box>
          ))}
        </Stack>
      </Paper>
    );
  };

  return (
    <Paper className="ficha" radius="sm" shadow="sm">
      <Box className="ficha-top">
        <Text>Valencia CF · Nutrición Deportiva · Temporada 2025/26</Text>
      </Box>

      <Box className="ficha-body">
        <Title className="ficha-title">{plan.jugador.nombre}</Title>
        <Text className="ficha-position">{plan.jugador.posicion}</Text>
        <Box className="ficha-rule" />

        <SimpleGrid cols={{ base: 2, md: 3 }} spacing="sm" mt="xl" mb="xl">
          <MetricCard label="Peso" value={formatNumber(plan.metricas.peso, ' kg')} color="orange.4" />
          <MetricCard label="Grasa" value={formatNumber(plan.metricas.grasa, ' %')} color="orange.4" />
          <MetricCard label="% P. Muscular Lee&cols" value={formatNumber(plan.metricas.pesoMuscular, ' %')} color="green.4" />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Stack gap={0}>
            {leftDays.map(renderDayBox)}
          </Stack>
          <Stack gap={0}>
            {rightDays.map(renderDayBox)}
            {plan.notas?.length > 0 && (
              <Paper p="md" radius="md" style={{ backgroundColor: '#071e36', border: '1px solid #1e3a8a' }}>
                <Title order={5} c="teal.3" tt="uppercase" mb="xs">Indicaciones de la semana</Title>
                <Stack gap={4}>
                  {plan.notas.map((note, index) => (
                    <Text key={index} size="sm" c="blue.1">• {note}</Text>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </SimpleGrid>

        <Text className="ficha-footer" mt="xl">Carlos Ferrando · Valencia CF · @c.ferrando · Nutricionista Deportivo y Clínico</Text>
      </Box>
    </Paper>
  );
}

const INDIVIDUAL_GENERATION_MESSAGES = [
  "Analizando métricas corporales...",
  "Calculando requerimientos energéticos y objetivos...",
  "Sincronizando con el menú del buffet...",
  "IA: Diseñando distribución de macronutrientes...",
  "IA: Optimizando ingestas para los días de entrenamiento...",
  "IA: Personalizando suplementación y sugerencias..."
];

function AiGenerationOverlay({ opened, messages = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!opened) {
      setIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [opened, messages.length]);

  if (!opened) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      borderRadius: 'var(--mantine-radius-lg)',
      display: 'block',
    }}>
      <div style={{
        position: 'sticky',
        top: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--mantine-color-blue-5), var(--mantine-color-grape-5))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(34, 139, 230, 0.35)',
            animation: 'pulseGlow 2s infinite ease-in-out',
          }}>
            <IconSparkles size={32} color="white" style={{ animation: 'spinSlow 6s infinite linear' }} />
          </div>
        </div>

        <Text fw={800} size="lg" variant="gradient" gradient={{ from: 'blue.6', to: 'grape.6', deg: 135 }} mb="xs">
          Generando Planificación Inteligente
        </Text>

        <Text size="sm" c="dimmed" fw={500} style={{ minHeight: '24px' }}>
          {messages[index]}
        </Text>

        <div style={{ width: '150px', height: '4px', backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: '2px', marginTop: '1.5rem', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--mantine-color-blue-5), var(--mantine-color-grape-5))',
            width: '100%',
            animation: 'loadingProgress 2s infinite ease-in-out',
          }} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 20px rgba(34, 139, 230, 0.35); }
          50% { transform: scale(1.08); box-shadow: 0 8px 30px rgba(156, 54, 181, 0.5); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes loadingProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      ` }} />
    </div>
  );
}

export default function PlanSubtab({ jugador, readOnly = false }) {
  const isMobile = useMediaQuery('(max-width: 48em)');
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

  const teamConfig = jugador?.equipos?.configuracion_nutricional;

  const dayTypeOptions = useMemo(() => {
    return getTeamNutritionDayTypes(teamConfig).map((d) => ({
      value: d.key,
      label: d.label,
    }));
  }, [teamConfig]);
  const [hasGeneratedAi, setHasGeneratedAi] = useState(false);
  const isDocumentMode = mode === 'create' || mode === 'edit';
  const loadingAction = Boolean(actionType);
  const [deleting, setDeleting] = useState(false);
  const [latestMenu, setLatestMenu] = useState(null);

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
        const [plansData, menuData] = await Promise.all([
          getAiPlans(jugador.id),
          jugador.equipo_id ? getWeeklyMenus(jugador.equipo_id).catch(() => ({ menus: [] })) : { menus: [] },
        ]);
        if (!active) return;
        const list = plansData.planes || [];
        setPlanes(list);
        setCurrentId(list.length ? String(list[0].id) : null);
        setMode('view');
        const menus = menuData.menus || [];
        setLatestMenu(menus.length > 0 ? menus[0] : null);
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
  }, [jugador.id, jugador.equipo_id]);

  function startCreate() {
    const now = new Date();
    const nextNombre = `Ficha ${now.toLocaleDateString('es-ES')}`;
    setMode('create');
    setNombre(nextNombre);
    setContexto('semana_normal');
    setContextoAdicional('');
    setContenido('');
    setDatos(buildBasePlanData({ jugador, nombre: nextNombre, contexto: 'semana_normal', contextoAdicional: '', menu: latestMenu }));
    setHasGeneratedAi(false);
  }

  function startEdit() {
    if (!currentPlan) return;
    setMode('edit');
    setNombre(currentPlan.nombre || '');
    setContexto(currentPlan.contexto || currentPlan.datos?.meta?.contexto || 'semana_normal');
    setContextoAdicional(currentPlan.contexto_adicional || currentPlan.datos?.meta?.contextoAdicional || '');
    setContenido(currentPlan.contenido || '');
    setDatos(currentDatos ? clonePlan(currentDatos) : null);
    setHasGeneratedAi(true);
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
      const data = await generateAiPlanDraft({ jugador, nombre, contexto, contextoAdicional });
      setDatos(data.datos || null);
      setContenido('');
      setHasGeneratedAi(true);
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
      const data = await saveAiPlan({
        jugador,
        nombre,
        contexto,
        contextoAdicional,
        datos: hasGeneratedAi ? finalDatos : undefined,
        contenido
      });
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
      const data = await updateAiPlan({
        id: currentPlan.id,
        nombre,
        contenido,
        datos: finalDatos,
        contexto,
        contextoAdicional,
      });
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
      const res = await downloadAiPlanPdf(currentPlan.id);
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

  async function handleDeletePlan(id) {
    if (!id) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este plan nutricional? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      await deleteAiPlan(id);
      notifications.show({
        color: 'green',
        title: 'Plan eliminado',
        message: 'El plan nutricional se ha eliminado correctamente.',
      });
      setPlanes((prev) => {
        const filtered = prev.filter((p) => p.id !== id);
        setCurrentId(filtered.length ? String(filtered[0].id) : null);
        return filtered;
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al eliminar el plan',
        message: e.message,
      });
    } finally {
      setDeleting(false);
    }
  }

  const getComidasResumen = () => {
    if (!jugador.num_comidas) {
      return jugador.postentreno ? 'Post-entreno' : null;
    }
    const label = !isNaN(Number(jugador.num_comidas))
      ? `${jugador.num_comidas} comidas/día`
      : jugador.num_comidas;
    return jugador.postentreno ? `${label} + Post-entreno` : label;
  };

  const perfilResumen = [
    getComidasResumen(),
    jugador.objetivo ? getObjectiveLabel(jugador.objetivo) : null,
    jugador.alergias ? `Alergias: ${jugador.alergias.slice(0, 30)}` : null,
    jugador.intolerancias ? `Intol: ${jugador.intolerancias.slice(0, 30)}` : null,
    jugador.gustos_preferencias ? `Gustos: ${jugador.gustos_preferencias.slice(0, 30)}` : null,
  ].filter(Boolean);

  const canSave = nombre.trim() && (datos || contenido.trim()) && actionType !== 'generate';

  return (
    <Stack gap={0}>
      <Paper p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Stack gap="md">
          <Group justify="space-between" align={isMobile ? 'stretch' : 'flex-start'} style={{ flexDirection: isMobile ? 'column' : 'row' }} gap="md">
            <Group gap="xs">
              <IconBrain size={22} color="var(--mantine-color-blue-filled)" />
              <Stack gap={2}>
                <Title order={3} fw={800} c="dark.4">Planes nutricionales</Title>
                <Text size="sm" c="dimmed">
                  Fichas con métricas, macros y pautas.
                </Text>
              </Stack>
            </Group>
            <Group gap="xs" style={{ width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }} align={isMobile ? 'stretch' : 'center'}>
              <Button
                size="xs"
                radius="xl"
                color="dark"
                leftSection={<IconArrowsLeftRight size={16} />}
                onClick={() => setIntercambiosOpened(true)}
                fullWidth={isMobile}
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
                  fullWidth={isMobile}
                >
                  Descargar PDF
                </Button>
              )}
              {!readOnly && (
                <>
                  {currentPlan && mode === 'view' && (
                    <Button
                      size="xs"
                      radius="xl"
                      variant="light"
                      color="red"
                      leftSection={<IconTrash size={16} />}
                      onClick={() => handleDeletePlan(currentPlan.id)}
                      loading={deleting}
                      fullWidth={isMobile}
                    >
                      Eliminar actual
                    </Button>
                  )}
                  {currentPlan && mode === 'view' && (
                    <Button
                      size="xs"
                      radius="xl"
                      variant="light"
                      leftSection={<IconEdit size={16} />}
                      onClick={startEdit}
                      fullWidth={isMobile}
                    >
                      Editar actual
                    </Button>
                  )}
                  <Button size="xs" radius="xl" leftSection={<IconPlus size={16} />} onClick={startCreate} fullWidth={isMobile}>
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
            variant="filled"
            radius="md"
            leftSection={<IconFileAi size={16} />}
            disabled={loadingList || planes.length === 0 || isDocumentMode}
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
          <Paper p={{ base: 'sm', sm: 'lg' }} radius="lg" withBorder shadow="sm" style={{ position: 'relative', overflow: 'hidden', minHeight: (actionType === 'generate' || (actionType === 'save' && !hasGeneratedAi)) ? '400px' : 'auto' }}>
            <AiGenerationOverlay opened={actionType === 'generate' || (actionType === 'save' && !hasGeneratedAi)} messages={INDIVIDUAL_GENERATION_MESSAGES} />
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
                  data={PLAN_CONTEXTS}
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
                        ['pesoMuscular', '% Peso Muscular Lee&cols'],
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

                  {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dayKey) => {
                    const item = datos.dias?.[dayKey];
                    if (!item) return null;
                    return (
                      <Paper key={dayKey} p="md" radius="md" withBorder>
                        <Group justify="space-between" align={isMobile ? 'stretch' : 'center'} mb="md" wrap="wrap" style={{ flexDirection: isMobile ? 'column' : 'row' }} gap="xs">
                          <Group gap="xs" wrap="wrap" style={{ width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }} align={isMobile ? 'stretch' : 'center'}>
                            <Title order={4} style={{ textAlign: isMobile ? 'center' : 'left' }}>{item.label}</Title>
                            <Select
                              placeholder="Tipo de día"
                              data={dayTypeOptions}
                              value={item.tipoDia}
                              onChange={(value) => {
                                if (!value) return;
                                updateDatos((draft) => {
                                  draft.dias[dayKey].tipoDia = value;

                                  const weight = Number(draft.metricas?.peso || jugador?.peso_kg || 0);
                                  const objectiveKey = jugador?.objetivo || 'mejora_rendimiento';

                                  if (weight) {
                                    let kcal, protein, cho, fat;

                                    const result = calculateByObjective({ weightKg: weight, objectiveKey, dayTypeKey: value, teamConfig });
                                    if (result) {
                                      kcal = result.kcal;
                                      protein = result.protein;
                                      cho = result.cho;
                                      fat = result.fat;
                                    }

                                    if (kcal !== undefined) {
                                      draft.dias[dayKey].kcal = Math.round(kcal);
                                      draft.dias[dayKey].proteina = Math.round(protein);
                                      draft.dias[dayKey].hidratos = Math.round(cho);
                                      draft.dias[dayKey].grasa = Math.round(fat);
                                    }
                                  }

                                  const existingMeals = draft.dias[dayKey].ingestas || [];
                                  const fallbackMeals = getUserMeals(jugador).map((name) => {
                                    const existing = existingMeals.find(m => m.nombre.toLowerCase() === name.toLowerCase());
                                    return {
                                      nombre: name,
                                      detalle: existing?.detalle || '',
                                    };
                                  });
                                  draft.dias[dayKey].ingestas = fallbackMeals;
                                });
                              }}
                              size="xs"
                              radius="xl"
                              style={{ width: isMobile ? '100%' : 150 }}
                            />
                          </Group>
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
                              value={item[key] ?? ''}
                              min={0}
                              onChange={(value) => updateDatos((draft) => {
                                draft.dias[dayKey][key] = value === '' ? null : Number(value);
                              })}
                            />
                          ))}
                        </SimpleGrid>
                        <Stack gap="sm">
                          {item.ingestas?.map((meal, index) => (
                            <SimpleGrid key={`${dayKey}-${index}`} cols={{ base: 1, md: 4 }} spacing="sm">
                              <TextInput
                                label="Ingesta"
                                value={meal.nombre}
                                onChange={(e) => updateDatos((draft) => {
                                  draft.dias[dayKey].ingestas[index].nombre = e.target.value;
                                })}
                              />
                              <Box className="meal-detail-field">
                                <Textarea
                                  label="Detalle"
                                  value={meal.detalle}
                                  autosize
                                  minRows={1}
                                  onChange={(e) => updateDatos((draft) => {
                                    draft.dias[dayKey].ingestas[index].detalle = e.target.value;
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
          <PlanFicha data={currentDatos} jugador={jugador} />
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
