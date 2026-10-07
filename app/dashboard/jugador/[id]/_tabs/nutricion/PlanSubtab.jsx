'use client';

import { useEffect, useMemo, useState } from 'react';
import { filenameFromResponse } from '@/lib/utils';
import { renderSafeMarkdown } from '@/lib/utils/markdown';
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
  Collapse,
  ActionIcon
} from '@mantine/core';
import CreateNutritionPlanModal from '@/components/modals/CreateNutritionPlanModal';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getAiPlans, generateAiPlanDraft, saveAiPlan, updateAiPlan, deleteAiPlan } from '@/actions/planActions';
import { downloadAiPlanPdf } from '@/services/report';
import { getWeeklyMenus } from '@/actions/menuActions';
import { getPlayerSupplementation } from '@/actions/supplementActions';
import { resolvePlayerSupplementsData } from '@/lib/nutrition/supplementation';
import { IconDownload, IconArrowsLeftRight, IconPlus, IconSparkles, IconEdit, IconCheck, IconTrash, IconChevronDown, IconBrain } from '@/components/icons3d';
import SubtabHeader from '../SubtabHeader';
import classes from '../SubtabSectionHeader.module.css';
import { buildBasePlanData, sanitizePlanData, getDefaultCalendar } from '@/lib/engine';
import { calculateByObjective } from '@/lib/metrics/anthropometry';
import { getUserMeals, getTeamNutritionDayTypes } from '@/config/nutrition-days';
import IntercambiosModal from '@/components/modals/IntercambiosModal';
import NothingFound from '@/components/NothingFound';
import ConfirmModal from '@/components/modals/ConfirmModal';
import PlanFicha from '@/components/plan/PlanFicha';



const DAY_LABELS = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };

/** Avisa de las referencias de las pautas del jugador que el motor no ha podido servir. */
function notifyPlanWarnings(datos) {
  const avisos = datos?.meta?.avisos || [];
  if (avisos.length === 0) return;
  const lines = avisos.slice(0, 4).map((a) => `${DAY_LABELS[a.dia] || a.dia} · ${a.ingesta}: ${a.mensaje}`);
  if (avisos.length > 4) lines.push(`… y ${avisos.length - 4} aviso(s) más.`);
  notifications.show({
    color: 'orange',
    title: 'Revisa las pautas del jugador',
    message: lines.join('\n'),
    autoClose: false,
    withCloseButton: true,
    styles: { description: { whiteSpace: 'pre-line' } },
  });
}

function planLabel(plan) {
  const date = plan.updated_at || plan.created_at;
  const suffix = date ? ` · ${new Date(date).toLocaleDateString('es-ES')}` : '';
  return `${plan.nombre}${suffix}`;
}

function planWithMeta(data, { nombre }) {
  const clean = sanitizePlanData(data);
  if (!clean) return null;
  return {
    ...clean,
    meta: {
      ...clean.meta,
      nombre,
    },
  };
}

function clonePlan(data) {
  return data ? JSON.parse(JSON.stringify(data)) : null;
}

const INDIVIDUAL_GENERATION_MESSAGES = [
  "Analizando métricas corporales...",
  "Calculando requerimientos energéticos y objetivos...",
  "Sincronizando con el menú del buffet...",
  "Calculando distribución de macronutrientes...",
  "Optimizando ingestas para los días de entrenamiento...",
  "Personalizando suplementación y sugerencias..."
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
            background: 'linear-gradient(135deg, var(--mantine-color-nutralabColor-6), var(--mantine-color-nutralabColor-8))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(108, 112, 90, 0.25)',
            animation: 'pulseGlow 2s infinite ease-in-out',
          }}>
            <IconSparkles size={32} color="white" style={{ animation: 'spinSlow 6s infinite linear' }} />
          </div>
        </div>

        <Text fw={700} size="lg" c="dark.5" mb="xs">
          Generando Planificación Inteligente
        </Text>

        <Text size="sm" c="dimmed" fw={500} style={{ minHeight: '24px' }}>
          {messages[index]}
        </Text>

        <div style={{ width: '150px', height: '4px', backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: '2px', marginTop: '1.5rem', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--mantine-color-nutralabColor-5), var(--mantine-color-nutralabColor-8))',
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
  const isMobile = useMediaQuery('(max-width: 48em)', true);
  const [expanded, { toggle: toggleExpanded }] = useDisclosure(false);
  const [planes, setPlanes] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [mode, setMode] = useState('view');
  const [intercambiosOpened, setIntercambiosOpened] = useState(false);
  const [activeSupplements, setActiveSupplements] = useState([]);
  const [nombre, setNombre] = useState('');
  const [contenido, setContenido] = useState('');
  const [datos, setDatos] = useState(null);
  const [hasGeneratedAi, setHasGeneratedAi] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedMenuWeek, setSelectedMenuWeek] = useState('none');
  const [creationModalOpened, setCreationModalOpened] = useState(false);
  const [modalNombre, setModalNombre] = useState('');
  const [modalSelectedMenuWeek, setModalSelectedMenuWeek] = useState('none');
  const [modalCalendar, setModalCalendar] = useState(getDefaultCalendar());
  const [modalPreMatchConfig, setModalPreMatchConfig] = useState({
    enabled: false,
    diaPartido: 'sabado',
    horario: 'tarde',
  });
  const [loadingList, setLoadingList] = useState(true);
  const [availableMenus, setAvailableMenus] = useState([]);

  useEffect(() => {
    let active = true;
    if (!jugador?.id) return;
    getPlayerSupplementation(jugador.id)
      .then((suppData) => {
        if (!active) return;
        const resolved = resolvePlayerSupplementsData({
          suplementos: suppData.suplementos,
          listas: suppData.listas,
          items: suppData.items,
          asignacion: suppData.asignacion,
          extras: suppData.extras,
          peso: jugador.peso_kg,
        });
        setActiveSupplements(resolved);
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, [jugador?.id, jugador?.peso_kg]);

  const teamConfig = jugador?.equipos?.configuracion_nutricional;

  const dayTypeOptions = useMemo(() => {
    return getTeamNutritionDayTypes(teamConfig).map((d) => ({
      value: d.key,
      label: d.label,
    }));
  }, [teamConfig]);
  const isDocumentMode = mode === 'create' || mode === 'edit';
  const loadingAction = Boolean(actionType);
  const [deleting, setDeleting] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState(null);

  const [themeOverride, setThemeOverride] = useState(null);

  useEffect(() => {
    setThemeOverride(null);
  }, [currentId]);

  const currentPlan = useMemo(
    () => planes.find((plan) => String(plan.id) === String(currentId)) || null,
    [planes, currentId]
  );

  const currentDatos = useMemo(() => sanitizePlanData(currentPlan?.datos), [currentPlan]);

  const planHtml = useMemo(() => {
    if (!currentPlan?.contenido || currentDatos || mode !== 'view') return '';
    return renderSafeMarkdown(currentPlan.contenido);
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
        setAvailableMenus(menus);
        if (menus.length > 0) {
          setSelectedMenuWeek(menus[0].semana);
        } else {
          setSelectedMenuWeek('none');
        }
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

  function openCreateModal() {
    const now = new Date();
    setModalNombre(`Ficha ${now.toLocaleDateString('es-ES')}`);
    setModalSelectedMenuWeek(selectedMenuWeek || 'none');
    const defaultCal = getDefaultCalendar();
    setModalCalendar(defaultCal);
    const matchDay = Object.keys(defaultCal).find((k) => defaultCal[k] === 'partido') || 'sabado';
    setModalPreMatchConfig({
      enabled: false,
      diaPartido: matchDay,
      horario: 'tarde',
    });
    setCreationModalOpened(true);
  }

  function createEmptyPlan() {
    try {
      setMode('create');
      setNombre(modalNombre);
      setSelectedMenuWeek(modalSelectedMenuWeek);
      setContenido('');

      let resolvedMenu = null;
      if (modalSelectedMenuWeek !== 'none' && modalSelectedMenuWeek) {
        resolvedMenu = availableMenus.find(m => m.semana === modalSelectedMenuWeek) || null;
      }

      setDatos(buildBasePlanData({
        jugador,
        nombre: modalNombre,
        menu: resolvedMenu,
        calendario: modalCalendar,
        preMatchConfig: modalPreMatchConfig,
        teamConfig,
        suplementacion: activeSupplements,
      }));

      setHasGeneratedAi(false);
      setCreationModalOpened(false);
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo crear la ficha',
        message: e.message,
      });
    }
  }

  async function generatePlanFromModal() {
    const notificationId = 'ai-plan-generate';
    setActionType('generate');
    notifications.show({
      id: notificationId,
      color: 'nutralabColor',
      title: 'Generando ficha nutricional',
      message: `Preparando ficha compacta para ${jugador.nombre}.`,
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    try {
      if (modalSelectedMenuWeek === 'none') {
        notifications.show({
          color: 'yellow',
          title: 'Generando sin menú',
          message: 'Se generará la propuesta según las recomendaciones y preferencias del jugador ya que no se ha seleccionado menú comedor.',
        });
      }

      const data = await generateAiPlanDraft({
        jugador,
        nombre: modalNombre,
        calendario: modalCalendar,
        semanaMenu: modalSelectedMenuWeek,
        preMatchConfig: modalPreMatchConfig,
      });

      setNombre(modalNombre);
      setSelectedMenuWeek(modalSelectedMenuWeek);

      setDatos(data.datos || null);
      notifyPlanWarnings(data.datos);
      setContenido('');
      setHasGeneratedAi(true);
      setMode('create');
      setCreationModalOpened(false);

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

  function startEdit() {
    if (!currentPlan) return;
    setMode('edit');
    setNombre(currentPlan.nombre || '');
    setSelectedMenuWeek(currentPlan.datos?.meta?.semanaMenu || 'none');
    setContenido(currentPlan.contenido || '');
    setDatos(currentDatos ? clonePlan(currentDatos) : null);
    setHasGeneratedAi(true);
  }

  function cancelForm() {
    setMode('view');
  }


  async function generateDraft() {
    const notificationId = 'ai-plan-generate';
    setActionType('generate');
    notifications.show({
      id: notificationId,
      color: 'nutralabColor',
      title: 'Generando ficha nutricional',
      message: `Preparando ficha compacta para ${jugador.nombre}.`,
      loading: true,
      autoClose: false,
      withCloseButton: false,
    });
    try {
      let currentCalendar = undefined;
      if (datos && datos.dias) {
        currentCalendar = {};
        for (const [dayKey, dayData] of Object.entries(datos.dias)) {
          currentCalendar[dayKey] = dayData.tipoDia;
        }
      }

      if (selectedMenuWeek === 'none') {
        notifications.show({
          color: 'yellow',
          title: 'Generando sin menú',
          message: 'Se generará la propuesta según las recomendaciones y preferencias del jugador ya que no se ha seleccionado menú comedor.',
        });
      }

      const data = await generateAiPlanDraft({
        jugador,
        nombre,
        calendario: currentCalendar || getDefaultCalendar(),
        semanaMenu: selectedMenuWeek,
        preMatchConfig: datos?.meta?.preMatchConfig || null,
      });
      setDatos(data.datos || null);
      notifyPlanWarnings(data.datos);
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
    const finalDatos = planWithMeta(datos, { nombre });
    setActionType('save');
    notifications.show({
      id: notificationId,
      color: 'nutralabColor',
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
        datos: finalDatos,
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
    if (menuChangedWithoutRegeneration) {
      notifications.show({
        color: 'yellow',
        title: 'Regenera la ficha',
        message: 'Has cambiado el menú. Pulsa “Regenerar ficha” antes de guardar para aplicar la nueva semana a las comidas.',
      });
      return;
    }
    const notificationId = 'ai-plan-save';
    const finalDatos = planWithMeta(datos, { nombre });
    setActionType('save');
    notifications.show({
      id: notificationId,
      color: 'nutralabColor',
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

  function handleDeletePlan(id) {
    if (!id) return;
    setDeletePlanId(id);
  }

  async function confirmDeletePlan() {
    if (!deletePlanId) return;
    setDeleting(true);
    try {
      await deleteAiPlan(deletePlanId);
      notifications.show({
        color: 'green',
        title: 'Plan eliminado',
        message: 'El plan nutricional se ha eliminado correctamente.',
      });
      const filtered = planes.filter((p) => p.id !== deletePlanId);
      setPlanes(filtered);
      setCurrentId(filtered.length ? String(filtered[0].id) : null);
      setDeletePlanId(null);
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

  const storedMenuWeek = datos?.meta?.semanaMenu || 'none';
  const menuChangedWithoutRegeneration = mode === 'edit'
    && Boolean(datos)
    && (selectedMenuWeek || 'none') !== storedMenuWeek;
  const canSave = nombre.trim()
    && (datos || contenido.trim())
    && actionType !== 'generate'
    && !menuChangedWithoutRegeneration;

  return (
    <Stack gap={0}>
      <Paper className={classes.mobileSticky} p={{ base: 'sm', sm: 'md' }} bg="white" shadow="xs" radius="lg" withBorder style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
            <Group gap="xs" style={{ flex: 1 }}>
              <SubtabHeader tab="nutricion" subtab="plan" />
            </Group>

            {!isMobile && (
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
                  <>
                    <Button
                      size="xs"
                      radius="xl"
                      variant="light"
                      leftSection={<IconDownload size={16} />}
                      onClick={downloadPdf}
                      loading={actionType === 'download'}
                    >
                      Descargar
                    </Button>
                  </>
                )}
                {!readOnly && (
                  <>
                    {currentPlan && mode === 'view' && (
                      <Button
                        size="xs"
                        radius="xl"
                        variant="light"
                        color="arcilla"
                        leftSection={<IconTrash size={16} />}
                        onClick={() => handleDeletePlan(currentPlan.id)}
                        loading={deleting}
                      >
                        Eliminar
                      </Button>
                    )}
                    {currentPlan && mode === 'view' && (
                      <Button
                        size="xs"
                        radius="xl"
                        variant="light"
                        leftSection={<IconEdit size={16} />}
                        onClick={startEdit}
                      >
                        Editar
                      </Button>
                    )}
                    <Button size="xs" radius="xl" color="lima" leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
                      Crear
                    </Button>
                  </>
                )}
              </Group>
            )}

            {isMobile && (
              <ActionIcon variant="light" color="gray" onClick={toggleExpanded} size="lg" radius="md" aria-label={expanded ? 'Ocultar opciones' : 'Mostrar opciones'}>
                <IconChevronDown size={20} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '200ms' }} />
              </ActionIcon>
            )}
          </Group>

          <Collapse expanded={!isMobile || expanded} transitionDuration={isMobile ? 200 : 0}>
            <Stack gap="sm">
              {isMobile && (
                <Group gap="xs" justify="center" style={{ flexDirection: 'column' }}>
                  <Button
                    size="xs"
                    radius="xl"
                    color="dark"
                    leftSection={<IconArrowsLeftRight size={16} />}
                    onClick={() => setIntercambiosOpened(true)}
                    fullWidth
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
                      fullWidth
                    >
                      Descargar
                    </Button>
                  )}
                  {!readOnly && (
                    <>
                      {currentPlan && mode === 'view' && (
                        <Button
                          size="xs"
                          radius="xl"
                          variant="light"
                          color="arcilla"
                          leftSection={<IconTrash size={16} />}
                          onClick={() => handleDeletePlan(currentPlan.id)}
                          loading={deleting}
                          fullWidth
                        >
                          Eliminar
                        </Button>
                      )}
                      {currentPlan && mode === 'view' && (
                        <Button
                          size="xs"
                          radius="xl"
                          variant="light"
                          leftSection={<IconEdit size={16} />}
                          onClick={startEdit}
                          fullWidth
                        >
                          Editar
                        </Button>
                      )}
                      <Button size="xs" radius="xl" color="lima" leftSection={<IconPlus size={16} />} onClick={openCreateModal} fullWidth>
                        Crear
                      </Button>
                    </>
                  )}
                </Group>
              )}

              <Select
                placeholder={loadingList ? 'Cargando planes...' : 'Sin planes creados'}
                data={planes.map((plan) => ({ value: String(plan.id), label: planLabel(plan) }))}
                value={currentId}
                onChange={(val) => {
                  if (val && mode === 'view') setCurrentId(val);
                }}
                disabled={mode !== 'view' || planes.length === 0}
                variant="filled"
                radius="md"
              />
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      <Box py={{ base: 'sm', sm: 'md' }}>
        {loadingList ? (
          <Paper p={{ base: 'md', sm: 'xl' }} radius={24} shadow="xs" style={{ textAlign: 'center' }}>
            <Loader size="lg" />
          </Paper>
        ) : isDocumentMode ? (
          <Paper p={{ base: 'sm', sm: 'lg' }} radius={24} shadow="xs" style={{ position: 'relative', overflow: 'hidden', minHeight: (actionType === 'generate' || (actionType === 'save' && !hasGeneratedAi)) ? '400px' : 'auto' }}>
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
                    {datos ? 'Regenerar ficha' : 'Generar ficha'}
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
                  placeholder="Ej: Semana de 3 partidos"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />

                <Select
                  label="Menú a utilizar"
                  placeholder="Selecciona una semana o Sin Menú..."
                  value={selectedMenuWeek}
                  onChange={(val) => setSelectedMenuWeek(val || '')}
                  data={[
                    { value: 'none', label: 'Sin menú comedor' },
                    ...availableMenus.map((m) => ({
                      value: m.semana,
                      label: `Menú de la semana del ${m.semana}`,
                    }))
                  ]}
                  size="sm"
                  allowDeselect={false}
                />
              </SimpleGrid>

              {menuChangedWithoutRegeneration && (
                <Text size="xs" c="orange.8">
                  Has cambiado el menú. Pulsa “Regenerar ficha” antes de guardar para aplicar la nueva semana a las comidas.
                </Text>
              )}


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
                          onChange={(value) => {
                            setDatos((prev) => ({
                              ...prev,
                              metricas: {
                                ...prev?.metricas,
                                [key]: value === '' ? null : Number(value),
                              },
                            }));
                          }}
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
                                const weight = Number(datos?.metricas?.peso || jugador?.peso_kg || 0);
                                const objectiveKey = jugador?.objetivo || 'mejora_rendimiento';
                                let kcal, protein, cho, fat;
                                if (weight) {
                                  const result = calculateByObjective({ weightKg: weight, objectiveKey, dayTypeKey: value, teamConfig });
                                  if (result) {
                                    kcal = Math.round(result.kcal);
                                    protein = Math.round(result.protein);
                                    cho = Math.round(result.cho);
                                    fat = Math.round(result.fat);
                                  }
                                }

                                const existingMeals = datos?.dias?.[dayKey]?.ingestas || [];
                                const fallbackMeals = getUserMeals(jugador).map((name) => {
                                  const existing = existingMeals.find(m => String(m?.nombre || '').toLowerCase() === String(name || '').toLowerCase());
                                  return {
                                    nombre: name,
                                    detalle: existing?.detalle || '',
                                  };
                                });

                                setDatos((prev) => ({
                                  ...prev,
                                  dias: {
                                    ...prev?.dias,
                                    [dayKey]: {
                                      ...prev?.dias?.[dayKey],
                                      tipoDia: value,
                                      ...(kcal !== undefined ? { kcal, proteina: protein, hidratos: cho, grasa: fat } : {}),
                                      ingestas: fallbackMeals,
                                    },
                                  },
                                }));
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
                              onChange={(value) => {
                                setDatos((prev) => ({
                                  ...prev,
                                  dias: {
                                    ...prev?.dias,
                                    [dayKey]: {
                                      ...prev?.dias?.[dayKey],
                                      [key]: value === '' ? null : Number(value),
                                    },
                                  },
                                }));
                              }}
                            />
                          ))}
                        </SimpleGrid>
                        <Stack gap="sm">
                          {item.ingestas?.map((meal, index) => (
                            <SimpleGrid key={`${dayKey}-${index}`} cols={{ base: 1, md: 4 }} spacing="sm">
                              <TextInput
                                label="Ingesta"
                                value={meal.nombre}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDatos((prev) => ({
                                    ...prev,
                                    dias: {
                                      ...prev?.dias,
                                      [dayKey]: {
                                        ...prev?.dias?.[dayKey],
                                        ingestas: prev?.dias?.[dayKey]?.ingestas?.map((m, i) =>
                                          i === index ? { ...m, nombre: val } : m
                                        ),
                                      },
                                    },
                                  }));
                                }}
                              />
                              <Box className="meal-detail-field">
                                <Textarea
                                  label="Detalle"
                                  value={meal.detalle}
                                  autosize
                                  minRows={1}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDatos((prev) => ({
                                      ...prev,
                                      dias: {
                                        ...prev?.dias,
                                        [dayKey]: {
                                          ...prev?.dias?.[dayKey],
                                          ingestas: prev?.dias?.[dayKey]?.ingestas?.map((m, i) =>
                                            i === index ? { ...m, detalle: val } : m
                                          ),
                                        },
                                      },
                                    }));
                                  }}
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
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').map((line) => line.trim()).filter(Boolean);
                      setDatos((prev) => ({
                        ...prev,
                        notas: lines,
                      }));
                    }}
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
              icon3d="salad"
              description="Todavía no hay planes nutricionales creados para este jugador."
              actionLabel={!readOnly ? 'Crear primera ficha' : undefined}
              onAction={!readOnly ? openCreateModal : undefined}
            />
          </Box>
        ) : currentDatos ? (
          <PlanFicha data={currentDatos} jugador={jugador} activeSupplements={activeSupplements} themeColors={themeOverride} />
        ) : planHtml ? (
          <Paper p={{ base: 'sm', sm: 'xl' }} radius={24} shadow="xs">
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
        @media (min-width: 62em) { .meal-detail-field { grid-column: span 3; } }
        .plan-md h1 { font-size: 24px; font-weight: 700; color: var(--mantine-color-dark-5); margin: 0 0 12px; letter-spacing: 0; }
        .plan-md h2 { font-size: 14px; font-weight: 700; color: var(--mantine-color-dark-5); text-transform: uppercase; letter-spacing: 0.8px; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid var(--mantine-color-gray-2); }
        .plan-md h3 { font-size: 15px; font-weight: 600; color: var(--mantine-color-dark-5); margin: 20px 0 10px; }
        .plan-md p { margin: 10px 0; color: var(--mantine-color-dark-4); font-size: 14px; line-height: 1.7; }
        .plan-md strong { color: var(--mantine-color-dark-5); font-weight: 700; }
        .plan-md ul, .plan-md ol { padding-left: 24px; margin: 12px 0; }
        .plan-md li { margin: 8px 0; color: var(--mantine-color-dark-4); font-size: 14px; line-height: 1.6; }
        .plan-md table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        .plan-md th { background: var(--mantine-color-gray-0); color: var(--mantine-color-dark-5); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 12px; border: 1px solid var(--mantine-color-gray-2); text-align: left; }
        .plan-md td { padding: 12px; border: 1px solid var(--mantine-color-gray-2); color: var(--mantine-color-dark-4); }
      `}</style>
      <ConfirmModal
        opened={!!deletePlanId}
        onClose={() => setDeletePlanId(null)}
        onConfirm={confirmDeletePlan}
        title="Eliminar plan nutricional"
        message="¿Estás seguro de que deseas eliminar este plan nutricional? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleting}
      />

      <CreateNutritionPlanModal
        opened={creationModalOpened}
        onClose={() => setCreationModalOpened(false)}
        isMobile={isMobile}
        modalNombre={modalNombre}
        setModalNombre={setModalNombre}
        modalSelectedMenuWeek={modalSelectedMenuWeek}
        setModalSelectedMenuWeek={setModalSelectedMenuWeek}
        availableMenus={availableMenus}
        modalCalendar={modalCalendar}
        setModalCalendar={setModalCalendar}
        modalPreMatchConfig={modalPreMatchConfig}
        setModalPreMatchConfig={setModalPreMatchConfig}
        dayTypeOptions={dayTypeOptions}
        createEmptyPlan={createEmptyPlan}
        generatePlanFromModal={generatePlanFromModal}
        actionType={actionType}
      />
    </Stack>
  );
}
