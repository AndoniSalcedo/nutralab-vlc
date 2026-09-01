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
  Collapse,
  ActionIcon,
  Menu,
} from '@mantine/core';
import CreateNutritionPlanModal from '@/components/modals/CreateNutritionPlanModal';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { getAiPlans, generateAiPlanDraft, saveAiPlan, updateAiPlan, downloadAiPlanPdf, deleteAiPlan } from '@/services/plan';
import { getWeeklyMenus } from '@/services/menu';
import { getPlayerSupplementation } from '@/services/supplement';
import { resolvePlayerSupplementsData } from '@/lib/supplementation-helper';
import { IconDownload, IconArrowsLeftRight, IconPlus, IconSparkles, IconEdit, IconCheck, IconTrash, IconChevronDown, IconBrain, IconPalette } from '@tabler/icons-react';
import SubtabHeader from '../SubtabHeader';
import classes from '../SubtabSectionHeader.module.css';
import { buildBasePlanData, sanitizePlanData, getDefaultCalendar, PLAN_THEME_PRESETS } from '@/lib/nutrition-plan-card';
import { calculateByObjective, getDayTypeColor, getDayTypeLabel, getTeamNutritionDayTypes } from '@/lib/calculations';
import { getUserMeals } from '@/lib/nutrition-day-types';
import IntercambiosModal from '@/components/modals/IntercambiosModal';
import NothingFound from '@/components/NothingFound';
import ConfirmModal from '@/components/modals/ConfirmModal';
import ProtocolIcon from '@/components/ProtocolIcon';



function planLabel(plan) {
  const date = plan.updated_at || plan.created_at;
  const suffix = date ? ` · ${new Date(date).toLocaleDateString('es-ES')}` : '';
  return `${plan.nombre}${suffix}`;
}

function formatNumber(value, suffix = '') {
  return formatNumberDecimal(value, suffix, 1);
}

function planWithMeta(data, { nombre, contextoAdicional, recomendacionesIngestas }) {
  const clean = sanitizePlanData(data);
  if (!clean) return null;
  return {
    ...clean,
    meta: {
      ...clean.meta,
      nombre,
      contexto: clean.meta?.contexto || 'semana_normal',
      contextoAdicional,
      recomendacionesIngestas,
    },
  };
}

function clonePlan(data) {
  return data ? JSON.parse(JSON.stringify(data)) : null;
}

function MetricCard({ label, value, color, bg, border }) {
  return (
    <Paper p="sm" radius="md" style={{ backgroundColor: bg, border: `1px solid ${border}`, textAlign: 'center' }}>
      <Text size="10px" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.8px' }}>{label}</Text>
      <Title order={3} style={{ color, fontSize: '20px', fontWeight: 850, marginTop: '2px', letterSpacing: '-0.3px' }}>{value}</Title>
    </Paper>
  );
}

function PlanFicha({ data, activeSupplements = [], jugador, themeColors }) {
  const plan = useMemo(() => sanitizePlanData(data), [data]);

  const rawColors = themeColors || data?.meta?.planColors || data?.planColors || jugador?.equipos?.configuracion_nutricional?.planColors || {};
  const colors = {
    cardTopBg: rawColors.cardTopBg || '#254d5c',
    cardTopText: rawColors.cardTopText || '#cad6df',
    cardBodyBg: rawColors.cardBodyBg || '#101229',
    cardBodyText: rawColors.cardBodyText || '#ffffff',
    boxBg: rawColors.boxBg || rawColors.dayBoxBg || rawColors.suppBoxBg || '#151932',
    boxBorder: rawColors.boxBorder || rawColors.dayBoxBorder || rawColors.suppBoxBorder || '#2d335a',
    itemBg: rawColors.itemBg || rawColors.mealBoxBg || rawColors.suppItemBg || '#1d1f46',
    accentText: rawColors.accentText || rawColors.mealTitleText || rawColors.suppTitleText || '#ffa94d',
    itemText: rawColors.itemText || rawColors.mealDescText || rawColors.notesDescText || '#dee2e6'
  };

  const leftDays = ['lunes', 'martes', 'miercoles', 'jueves'];
  const rightDays = ['viernes', 'sabado', 'domingo'];

  const supplementsToShow = (plan?.suplementacion && plan.suplementacion.length > 0)
    ? plan.suplementacion
    : activeSupplements;

  const teamProtocols = useMemo(() => jugador?.equipos?.configuracion_nutricional?.protocols || [], [jugador?.equipos?.configuracion_nutricional?.protocols]);
  const customProtocols = useMemo(() => jugador?.protocolos_custom || {}, [jugador?.protocolos_custom]);
  const activeDayTypes = useMemo(() => {
    if (!plan?.dias) return new Set();
    return new Set(Object.values(plan.dias).map((d) => d.tipoDia).filter(Boolean));
  }, [plan?.dias]);

  const protocolsToShow = useMemo(() => {
    if (!plan) return [];
    if (Array.isArray(plan.protocolos) && plan.protocolos.length > 0) {
      return plan.protocolos;
    }
    return teamProtocols
      .map((p) => customProtocols[p.id] || p)
      .filter((p) => {
        const isIncluded = p.incluirEnPlan !== false && (p.incluirEnPlan === true || p.dayTypeKey === 'partido' || p.dayTypeKey === 'match_day' || (typeof p.dayTypeKey === 'string' && p.dayTypeKey.includes('partido')));
        if (!isIncluded) return false;
        if (p.dayTypeKey && activeDayTypes.size > 0) {
          return activeDayTypes.has(p.dayTypeKey);
        }
        return true;
      });
  }, [plan, teamProtocols, customProtocols, activeDayTypes]);

  if (!plan) return null;;

  const renderDayBox = (dayKey) => {
    const dayData = plan.dias[dayKey];
    if (!dayData) return null;
    const color = getDayTypeColor(dayData.tipoDia);
    const label = getDayTypeLabel(dayData.tipoDia);
    return (
      <Paper key={dayKey} p="sm" radius="md" style={{ backgroundColor: colors.boxBg, border: `1px solid ${colors.boxBorder}` }} mb="sm">
        <Group justify="space-between" align="center" mb={6}>
          <Text size="sm" fw={900} tt="uppercase" style={{ color: colors.cardBodyText, letterSpacing: '0.3px' }}>
            {dayData.label}
          </Text>
          <Group gap={5} align="center" wrap="nowrap">
            <span style={{ fontSize: '7px', color: `var(--mantine-color-${color}-5)` }}>●</span>
            <Text size="11px" fw={700} tt="uppercase" style={{ color: `var(--mantine-color-${color}-4)`, letterSpacing: '0.5px' }}>
              {label}
            </Text>
          </Group>
        </Group>

        <Box py={3} px={7} mb="xs" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
          <Group gap={6} justify="space-between" wrap="nowrap">
            <Text size="11px" fw={800} style={{ color: colors.cardBodyText }}>
              {formatInt(dayData.kcal)} <span style={{ fontWeight: 400, opacity: 0.65, fontSize: '10px' }}>kcal</span>
            </Text>
            <Group gap={5} wrap="nowrap" style={{ fontSize: '11px' }}>
              <Text size="11px" style={{ color: colors.itemText }}>
                P <strong style={{ color: colors.cardBodyText }}>{formatInt(dayData.proteina)}g</strong>
              </Text>
              <Text size="11px" c="dimmed">·</Text>
              <Text size="11px" style={{ color: colors.itemText }}>
                HC <strong style={{ color: colors.cardBodyText }}>{formatInt(dayData.hidratos)}g</strong>
              </Text>
              <Text size="11px" c="dimmed">·</Text>
              <Text size="11px" style={{ color: colors.itemText }}>
                G <strong style={{ color: colors.cardBodyText }}>{formatInt(dayData.grasa)}g</strong>
              </Text>
            </Group>
          </Group>
        </Box>

        <Stack gap={5}>
          {dayData.ingestas.map((meal, mealIndex) => (
            <Box 
              key={mealIndex} 
              p={8} 
              style={{ 
                backgroundColor: colors.itemBg, 
                borderRadius: '6px',
                transition: 'background-color 0.2s ease'
              }}
            >
              <Text size="11px" fw={800} tt="uppercase" lh={1.1} style={{ color: colors.accentText, letterSpacing: '0.4px' }}>
                {meal.nombre}
              </Text>
              <Text size="xs" mt={3} style={{ color: colors.itemText, lineHeight: 1.4 }}>
                {meal.detalle || '-'}
              </Text>
            </Box>
          ))}
        </Stack>
      </Paper>
    );
  };

  return (
    <Paper radius="md" shadow="sm" style={{ overflow: 'hidden', backgroundColor: colors.cardBodyBg, color: colors.cardBodyText, transition: 'all 0.2s ease' }}>
      <Box style={{ backgroundColor: colors.cardTopBg, color: colors.cardTopText, textAlign: 'center', padding: '16px 12px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1.4px', fontWeight: 700, transition: 'all 0.2s ease' }}>
        <Text>{jugador?.equipos?.nombre || 'Club'} · Nutrición Deportiva · Temporada 2025/26</Text>
      </Box>

      <Box p={{ base: 'md', sm: 'xl' }}>
        <Title style={{ color: colors.cardBodyText, textAlign: 'center', fontSize: 'clamp(26px, 4.5vw, 40px)', lineHeight: 1, textTransform: 'uppercase', letterSpacing: 0, transition: 'color 0.2s ease' }}>
          {plan.jugador.nombre}
        </Title>
        <Text style={{ color: colors.accentText, textAlign: 'center', textTransform: 'uppercase', fontWeight: 800, marginTop: '6px', fontSize: '12px', letterSpacing: '1px', transition: 'color 0.2s ease' }}>
          {plan.jugador.posicion}
        </Text>
        <Box style={{ height: '2px', backgroundColor: colors.accentText, margin: '10px auto 0', maxWidth: '75%', opacity: 0.85, transition: 'background-color 0.2s ease' }} />

        <SimpleGrid cols={{ base: 2, md: 3 }} spacing="sm" mt="lg" mb="lg">
          <MetricCard label="Peso" value={formatNumber(plan.metricas.peso, ' kg')} color={colors.accentText} bg={colors.boxBg} border={colors.boxBorder} />
          <MetricCard label="Grasa" value={formatNumber(plan.metricas.grasa, ' %')} color={colors.cardBodyText} bg={colors.boxBg} border={colors.boxBorder} />
          <MetricCard label="% P. Muscular Lee&cols" value={formatNumber(plan.metricas.pesoMuscular, ' %')} color={colors.accentText} bg={colors.boxBg} border={colors.boxBorder} />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Stack gap={0}>
            {leftDays.map(renderDayBox)}

            {supplementsToShow?.length > 0 && (
              <Paper p="sm" radius="md" style={{ backgroundColor: colors.boxBg, border: `1px solid ${colors.boxBorder}` }} mb="sm">
                <Group justify="space-between" align="center" mb={8}>
                  <Title order={5} tt="uppercase" style={{ color: colors.accentText, fontSize: '12px', letterSpacing: '0.6px' }}>
                    Suplementación Pautada
                  </Title>
                </Group>
                <Stack gap={5}>
                  {supplementsToShow.map((supp, index) => (
                    <Box key={index} p={7} style={{ backgroundColor: colors.itemBg, borderRadius: '6px' }}>
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Text size="xs" fw={800} style={{ color: colors.cardBodyText }}>{supp.nombre}</Text>
                        {supp.dosis && (
                          <Text size="11px" fw={800} style={{ 
                            color: colors.accentText, 
                            borderRadius: '4px', 
                            padding: '1px 6px',
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            letterSpacing: '0.2px'
                          }}>
                            {supp.dosis}
                          </Text>
                        )}
                      </Group>
                      {supp.timing && (
                        <Text size="11px" fw={700} mt={2} style={{ color: colors.itemText }}>
                          Momento: {supp.timing}
                        </Text>
                      )}
                      {supp.notas && (
                        <Text size="11px" fs="italic" mt={1} style={{ color: colors.itemText, opacity: 0.85 }}>
                          {supp.notas}
                        </Text>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>

          <Stack gap={0}>
            {rightDays.map(renderDayBox)}

            {protocolsToShow?.length > 0 && (
              <Stack gap="sm" mb="sm">
                {protocolsToShow.map((prot, pIdx) => (
                  <Paper key={prot.id || pIdx} p="sm" radius="md" style={{ backgroundColor: colors.boxBg, border: `1px solid ${colors.boxBorder}` }}>
                    <Group justify="space-between" align="center" mb={8}>
                      <Title order={5} tt="uppercase" style={{ color: colors.accentText, fontSize: '12px', letterSpacing: '0.6px' }}>
                        {prot.name || 'Protocolo de Partido'}
                      </Title>
                    </Group>
                    
                    {prot.timeline?.length > 0 && (
                      <Stack gap={5} mb={prot.checklist?.length > 0 ? 'xs' : 0}>
                        {prot.timeline.map((step, sIdx) => (
                          <Box key={step.id || sIdx} p={7} style={{ backgroundColor: colors.itemBg, borderRadius: '6px' }}>
                            <Group justify="space-between" align="center" wrap="nowrap" mb={2}>
                              <Group gap={6} wrap="nowrap" align="center">
                                <ProtocolIcon iconName={step.icon} size={14} color={colors.accentText} />
                                <Text size="xs" fw={800} style={{ color: colors.cardBodyText }}>
                                  {step.title}
                                </Text>
                              </Group>
                              {step.timeLabel && (
                                <Text size="11px" fw={800} style={{ 
                                  color: colors.accentText, 
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  backgroundColor: 'rgba(255,255,255,0.06)',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {step.timeLabel}
                                </Text>
                              )}
                            </Group>
                            {step.description && (
                              <Text size="xs" style={{ color: colors.itemText, lineHeight: 1.35 }}>
                                {step.description}
                              </Text>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    )}

                    {prot.checklist?.length > 0 && (
                      <Stack gap={4} mt="xs" pt="xs" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <Text size="11px" fw={800} tt="uppercase" style={{ color: colors.accentText, letterSpacing: '0.5px' }}>
                          Checklist
                        </Text>
                        {prot.checklist.map((item, cIdx) => (
                          <Box key={item.id || cIdx} p={6} style={{ backgroundColor: colors.itemBg, borderRadius: '6px' }}>
                            <Group gap={6} align="flex-start" wrap="nowrap">
                              <Text size="11px" style={{ color: colors.accentText, lineHeight: 1.2 }}>✓</Text>
                              <Box style={{ flex: 1 }}>
                                <Text size="xs" fw={700} style={{ color: colors.cardBodyText }}>
                                  {item.title}
                                </Text>
                                {item.description && (
                                  <Text size="xs" mt={1} style={{ color: colors.itemText, opacity: 0.85, lineHeight: 1.3 }}>
                                    {item.description}
                                  </Text>
                                )}
                              </Box>
                            </Group>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}

            {plan.notas?.length > 0 && (
              <Paper p="sm" radius="md" style={{ backgroundColor: colors.boxBg, border: `1px solid ${colors.boxBorder}` }}>
                <Title order={5} tt="uppercase" mb={6} style={{ color: colors.accentText, fontSize: '12px', letterSpacing: '0.6px' }}>
                  Indicaciones de la semana
                </Title>
                <Stack gap={4}>
                  {plan.notas.map((note, index) => (
                    <Text key={index} size="xs" style={{ color: colors.itemText, lineHeight: 1.4 }}>
                      • {note}
                    </Text>
                  ))}
                </Stack>
              </Paper>
            )}
          </Stack>
        </SimpleGrid>

        <Text mt="lg" style={{ color: colors.itemText, opacity: 0.65, textAlign: 'center', fontSize: '10px' }}>
          {jugador?.equipos?.nombre || 'Club'} · Nutrición Deportiva y Rendimiento
        </Text>
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
  const isMobile = useMediaQuery('(max-width: 48em)', true);
  const [expanded, { toggle: toggleExpanded }] = useDisclosure(false);
  const [planes, setPlanes] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [mode, setMode] = useState('view');
  const [intercambiosOpened, setIntercambiosOpened] = useState(false);
  const [activeSupplements, setActiveSupplements] = useState([]);

  const [nombre, setNombre] = useState('');
  const [contextoAdicional, setContextoAdicional] = useState('');
  const [contenido, setContenido] = useState('');
  const [datos, setDatos] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [actionType, setActionType] = useState(null);
  const [availableMenus, setAvailableMenus] = useState([]);
  const [selectedMenuWeek, setSelectedMenuWeek] = useState(null);

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

  const [recomendacionesIngestas, setRecomendacionesIngestas] = useState({});

  // Creation modal states
  const [creationModalOpened, setCreationModalOpened] = useState(false);
  const [modalNombre, setModalNombre] = useState('');
  const [modalSelectedMenuWeek, setModalSelectedMenuWeek] = useState('none');
  const [modalContextoAdicional, setModalContextoAdicional] = useState('');
  const [modalRecomendacionesIngestas, setModalRecomendacionesIngestas] = useState({});
  const [modalCalendar, setModalCalendar] = useState(getDefaultCalendar());
  const [modalPreMatchConfig, setModalPreMatchConfig] = useState({
    enabled: false,
    diaPartido: 'sabado',
    horario: 'tarde',
  });

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
    marked.setOptions({ breaks: true, gfm: true });
    return marked(currentPlan.contenido);
  }, [currentPlan, currentDatos, mode]);

  const handleSelectTheme = async (presetColors, presetName) => {
    setThemeOverride(presetColors);
    if (mode === 'edit') {
      updateDatos((draft) => {
        if (!draft.meta) draft.meta = {};
        draft.meta.planColors = presetColors;
      });
    } else if (currentPlan && !readOnly) {
      try {
        const updatedDatos = {
          ...currentDatos,
          meta: {
            ...currentDatos?.meta,
            planColors: presetColors,
          },
        };
        await updateAiPlan(currentPlan.id, { datos: updatedDatos });
        setPlanes((prev) =>
          prev.map((p) => (p.id === currentPlan.id ? { ...p, datos: updatedDatos } : p))
        );
        notifications.show({
          color: 'green',
          title: 'Tema del plan actualizado',
          message: presetColors ? `Se aplicó el tema ${presetName || ''} a este plan.` : 'Se restableció el tema por defecto del equipo.',
        });
      } catch (err) {
        notifications.show({
          color: 'red',
          title: 'Error al actualizar el tema',
          message: err.message,
        });
      }
    }
  };

  const renderThemeMenu = (fullWidth = false) => {
    if (!currentDatos && !datos) return null;
    const activeData = currentDatos || datos;
    const currentActiveColors = themeOverride || activeData?.meta?.planColors || activeData?.planColors;

    return (
      <Menu position="bottom-end" shadow="md" width={240} radius="md">
        <Menu.Target>
          <Button
            size="xs"
            radius="xl"
            variant="light"
            color="gray"
            leftSection={<IconPalette size={16} />}
            fullWidth={fullWidth}
          >
            Tema
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Temas del Plan Nutricional</Menu.Label>
          {PLAN_THEME_PRESETS.map((preset) => {
            const isSelected = currentActiveColors?.cardBodyBg === preset.colors.cardBodyBg &&
                               currentActiveColors?.cardTopBg === preset.colors.cardTopBg &&
                               currentActiveColors?.boxBg === preset.colors.boxBg;
            return (
              <Menu.Item
                key={preset.id}
                onClick={() => handleSelectTheme(preset.colors, preset.name)}
                leftSection={
                  <Group gap={3}>
                    {preset.swatches.map((s, idx) => (
                      <Box
                        key={idx}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: s,
                          border: '1px solid rgba(0,0,0,0.15)',
                        }}
                      />
                    ))}
                  </Group>
                }
                rightSection={isSelected ? <IconCheck size={14} color="var(--mantine-color-teal-6)" /> : null}
              >
                <Text size="xs" fw={isSelected ? 700 : 500}>
                  {preset.name}
                </Text>
              </Menu.Item>
            );
          })}
          <Menu.Divider />
          <Menu.Item
            onClick={() => handleSelectTheme(null)}
            color="dimmed"
            rightSection={!currentActiveColors ? <IconCheck size={14} color="var(--mantine-color-teal-6)" /> : null}
          >
            <Text size="xs" fw={!currentActiveColors ? 700 : 400}>
              Tema por defecto del equipo
            </Text>
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  };

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
    setModalContextoAdicional('');
    const defaultCal = getDefaultCalendar();
    setModalCalendar(defaultCal);
    const matchDay = Object.keys(defaultCal).find((k) => defaultCal[k] === 'partido') || 'sabado';
    setModalPreMatchConfig({
      enabled: false,
      diaPartido: matchDay,
      horario: 'tarde',
    });

    const meals = getUserMeals(jugador);
    const initialRecs = {};
    const defaultRecs = jugador?.recomendaciones_defecto || {};
    meals.forEach((meal) => {
      initialRecs[meal] = defaultRecs[meal] || '';
    });
    setModalRecomendacionesIngestas(initialRecs);
    setCreationModalOpened(true);
  }

  function createEmptyPlan() {
    setMode('create');
    setNombre(modalNombre);
    setSelectedMenuWeek(modalSelectedMenuWeek);
    setContextoAdicional(modalContextoAdicional);
    setRecomendacionesIngestas(modalRecomendacionesIngestas);
    setContenido('');

    let resolvedMenu = null;
    if (modalSelectedMenuWeek !== 'none' && modalSelectedMenuWeek) {
      resolvedMenu = availableMenus.find(m => m.semana === modalSelectedMenuWeek) || null;
    }

    setDatos(buildBasePlanData({
      jugador,
      nombre: modalNombre,
      contexto: 'semana_normal',
      contextoAdicional: modalContextoAdicional,
      menu: resolvedMenu,
      calendario: modalCalendar,
      preMatchConfig: modalPreMatchConfig,
      teamConfig,
      suplementacion: activeSupplements,
    }));

    setHasGeneratedAi(false);
    setCreationModalOpened(false);
  }

  async function generatePlanFromModal() {
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
      if (modalSelectedMenuWeek === 'none') {
        notifications.show({
          color: 'yellow',
          title: 'Generando sin menú',
          message: 'La IA tendrá libertad total para crear los platos ya que no se ha seleccionado menú comedor.',
        });
      }

      const data = await generateAiPlanDraft({
        jugador,
        nombre: modalNombre,
        contextoAdicional: modalContextoAdicional,
        calendario: modalCalendar,
        semanaMenu: modalSelectedMenuWeek,
        recomendacionesIngestas: modalRecomendacionesIngestas,
        preMatchConfig: modalPreMatchConfig,
      });

      setNombre(modalNombre);
      setSelectedMenuWeek(modalSelectedMenuWeek);
      setContextoAdicional(modalContextoAdicional);
      setRecomendacionesIngestas(modalRecomendacionesIngestas);

      setDatos(data.datos || null);
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
    setContextoAdicional(currentPlan.contexto_adicional || currentPlan.datos?.meta?.contextoAdicional || '');
    setRecomendacionesIngestas(currentPlan.datos?.meta?.recomendacionesIngestas || {});
    setSelectedMenuWeek(currentPlan.datos?.meta?.semanaMenu || 'none');
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
          message: 'La IA tendrá libertad total para crear los platos ya que no se ha seleccionado menú comedor.',
        });
      }

      const data = await generateAiPlanDraft({
        jugador,
        nombre,
        contextoAdicional,
        calendario: currentCalendar || getDefaultCalendar(),
        semanaMenu: selectedMenuWeek,
        recomendacionesIngestas
      });
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
    const finalDatos = planWithMeta(datos, { nombre, contextoAdicional, recomendacionesIngestas });
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
        contexto: 'semana_normal',
        contextoAdicional,
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
    const notificationId = 'ai-plan-save';
    const finalDatos = planWithMeta(datos, { nombre, contextoAdicional, recomendacionesIngestas });
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
        contexto: 'semana_normal',
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
      setPlanes((prev) => {
        const filtered = prev.filter((p) => p.id !== deletePlanId);
        setCurrentId(filtered.length ? String(filtered[0].id) : null);
        return filtered;
      });
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

  const canSave = nombre.trim() && (datos || contenido.trim()) && actionType !== 'generate';

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
                    {renderThemeMenu()}
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
                        color="red"
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
                    <Button size="xs" radius="xl" leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
                      Crear
                    </Button>
                  </>
                )}
              </Group>
            )}

            {isMobile && (
              <ActionIcon variant="light" color="gray" onClick={toggleExpanded} size="lg" radius="md">
                <IconChevronDown size={20} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '200ms' }} />
              </ActionIcon>
            )}
          </Group>

          <Collapse in={!isMobile || expanded} transitionDuration={isMobile ? 200 : 0}>
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
                    <>
                      {renderThemeMenu(true)}
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
                    </>
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
                      <Button size="xs" radius="xl" leftSection={<IconPlus size={16} />} onClick={openCreateModal} fullWidth>
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

              <Textarea
                label="Instrucciones adicionales para la IA"
                placeholder="Ej: Sale de lesión, reduce fibra el día de partido..."
                value={contextoAdicional}
                onChange={(e) => setContextoAdicional(e.target.value)}
                rows={2}
              />

              <Paper p="sm" radius="md" withBorder bg="gray.0">
                <Text size="sm" fw={700} mb="xs">Recomendaciones para las ingestas del jugador</Text>
                <Stack gap="sm">
                  {getUserMeals(jugador).filter((meal) => meal.toLowerCase() !== 'post-entreno').map((meal) => (
                    <TextInput
                      key={meal}
                      label={meal}
                      placeholder={`Ej: Tostadas de aguacate con pavo...`}
                      value={recomendacionesIngestas[meal] || ''}
                      onChange={(e) => setRecomendacionesIngestas((prev) => ({ ...prev, [meal]: e.target.value }))}
                      size="sm"
                    />
                  ))}
                </Stack>
              </Paper>

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
              onAction={!readOnly ? openCreateModal : undefined}
            />
          </Box>
        ) : currentDatos ? (
          <PlanFicha data={currentDatos} jugador={jugador} activeSupplements={activeSupplements} themeColors={themeOverride} />
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
        modalContextoAdicional={modalContextoAdicional}
        setModalContextoAdicional={setModalContextoAdicional}
        jugador={jugador}
        modalRecomendacionesIngestas={modalRecomendacionesIngestas}
        setModalRecomendacionesIngestas={setModalRecomendacionesIngestas}
        modalCalendar={modalCalendar}
        setModalCalendar={setModalCalendar}
        modalPreMatchConfig={modalPreMatchConfig}
        setModalPreMatchConfig={setModalPreMatchConfig}
        dayTypeOptions={dayTypeOptions}
        createEmptyPlan={createEmptyPlan}
        generatePlanFromModal={generatePlanFromModal}
        actionType={actionType}
        getUserMeals={getUserMeals}
      />
    </Stack>
  );
}
