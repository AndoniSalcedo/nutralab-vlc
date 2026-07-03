'use client';

import { useEffect, useMemo, useState } from 'react';
import { Anchor, Button, Group, Paper, SimpleGrid, Stack, Text, Title, ThemeIcon, Box, Table, ScrollArea, Avatar, Badge, ActionIcon, Menu, Modal, Tooltip, TextInput, Select, Pagination, Textarea, Checkbox } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconArrowLeft, IconArrowRight, IconCalendarEvent, IconChartLine, IconDots, IconDownload, IconFileTypePdf, IconFlame, IconMail, IconSearch, IconTrash, IconUsers, IconUserPlus, IconPencil, IconFileText, IconChefHat, IconBook, IconCalendar, IconSettings, IconSparkles } from '@tabler/icons-react';
import DashboardActions from '@/components/DashboardActions';
import NothingFound from '@/components/NothingFound/NothingFound';
import PlayerCredentialsButton from '@/components/PlayerCredentialsButton';
import PlayerForm from '@/components/PlayerForm';
import { cunninghamPlan, resolveNutritionDayType } from '@/lib/calculations';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 8;

const SQUAD_GENERATION_MESSAGES = [
  "Iniciando procesamiento de plantilla...",
  "Cargando métricas físicas y composición corporal...",
  "Consultando el menú semanal del comedor...",
  "Calculando requerimientos energéticos por día...",
  "IA: Generando recomendaciones individuales en paralelo...",
  "IA: Estructurando ingestas, gramos y suplementación...",
  "Diseñando maquetación y reglas del PDF final...",
  "Compilando informe completo en formato A4..."
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

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() || '').join('');
}

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

function DashboardStat({ title, icon: Icon, color = 'blue', value, description, href, onClick }) {
  const isClickable = Boolean(href || onClick);
  const content = (
    <Box
      component={onClick ? 'button' : 'div'}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      px={{ base: 'sm', sm: 'md' }}
      py="xs"
      style={{
        width: '100%',
        textAlign: 'left',
        cursor: isClickable ? 'pointer' : 'default',
        font: 'inherit',
        height: '100%',
        minHeight: 62,
        borderRadius: 'var(--mantine-radius-xl)',
        background: 'rgba(248,249,245,0.82)',
        border: '1px solid rgba(222,226,230,0.9)',
        transition: 'border-color 120ms ease, transform 120ms ease',
      }}
    >
      <Group gap="sm" wrap="nowrap" align="center">
        <ThemeIcon color={color} variant="light" radius="md" size={34} style={{ flex: '0 0 auto' }}>
          <Icon size={18} stroke={1.6} />
        </ThemeIcon>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text fw={750} c="dimmed" size="xs" tt="uppercase" lts={0.5} truncate>
            {title}
          </Text>
          <Group gap={8} align="baseline" wrap="nowrap">
            <Text fw={800} size="lg" c="#24291f" lh={1.1} truncate>
              {value}
            </Text>
            <Text size="xs" c="dimmed" truncate visibleFrom="xs">
              {description}
            </Text>
          </Group>
        </Box>
        {isClickable && (
          <ThemeIcon color={color} variant="subtle" radius="xl" size={28} style={{ flex: '0 0 auto' }}>
            <IconArrowRight size={16} stroke={1.8} />
          </ThemeIcon>
        )}
      </Group>
    </Box>
  );

  if (!href) return content;

  return (
    <Anchor href={href} underline="never" c="inherit">
      {content}
    </Anchor>
  );
}

const DAYS_OF_WEEK = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

const DAY_TYPE_OPTIONS = [
  { value: 'descanso', label: '💤 Descanso' },
  { value: 'recuperacion', label: '🟢 Recuperación' },
  { value: 'entreno', label: '⚡ Entrenamiento' },
  { value: 'doble', label: '🔥 Doble sesión' },
  { value: 'partido', label: '⚽ Partido' },
];

const CONTEXTOS = [
  { value: 'semana_normal', label: 'Semana normal de entrenamiento' },
  { value: 'semana_partido', label: 'Semana con partido oficial' },
  { value: 'dia_partido', label: 'Día de partido' },
  { value: 'viaje', label: 'Viaje / desplazamiento' },
  { value: 'lesion', label: 'Lesión / inactividad' },
  { value: 'vacaciones', label: 'Vacaciones / fuera de temporada' },
  { value: 'pretemporada', label: 'Pretemporada (alta carga)' },
];

function getWeekRangeLabel(mondayInput) {
  const monday = mondayInput instanceof Date ? mondayInput : new Date(`${mondayInput}T00:00:00`);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const mondayDay = monday.getDate();
  const mondayMonth = months[monday.getMonth()];
  const sundayDay = sunday.getDate();
  const sundayMonth = months[sunday.getMonth()];

  if (monday.getMonth() === sunday.getMonth()) {
    return `Semana ${mondayDay}-${sundayDay} ${sundayMonth}`;
  } else {
    return `Semana ${mondayDay} ${mondayMonth} - ${sundayDay} ${sundayMonth}`;
  }
}

function defaultReportForm() {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  const weekStr = monday.toISOString().split('T')[0];

  return {
    semana: weekStr,
    contexto: 'semana_partido',
    title: getWeekRangeLabel(monday),
    subtitle: 'Plan nutricional',
    team: 'Valencia CF · Primer Equipo',
    author: 'Carlos Ferrando · Nutralab',
    handle: '@c.ferrando',
    microcycle: '',
    rules: [
      'Ningun dia en deficit calorico. Carga glucogenica continua, HC en cada ingesta principal.',
      'Pescado azul 4-5 tomas minimo. Frutos rojos diarios. Curcuma cada cena.',
      'Batido post-entreno y post-partido obligatorio: whey 30 g + colageno 15 g + Vit C 200 mg.',
      'Caseina nocturna (requeson o cottage) en todo el grupo durante esta semana.',
      'Hidratacion reforzada. Reposicion 1,5 L por kg perdido en las 4-6 h post.',
      'Sueno 8 h. Cero alcohol. Cafeina solo el dia de partido (3 mg/kg a -45 min).',
    ].join('\n'),
    buffet: 'Desayuno y comidas usan exclusivamente las opciones del listado oficial de Paterna (huevos, pavo, jamon serrano, porridge, focaccia, pan blanco, frutos rojos, fruta entera, yogur de proteina, AOVE...). Las meriendas se hacen en casa: yogur de proteina + tortitas de arroz + fruta + frutos secos (15 g) y, solo MD-1, browniato disponible.',
    calendario: {
      lunes: 'entreno',
      martes: 'entreno',
      miercoles: 'descanso',
      jueves: 'entreno',
      viernes: 'entreno',
      sabado: 'descanso',
      domingo: 'descanso',
    },
  };
}

function filenameFromResponse(response, fallback) {
  const header = response.headers.get('Content-Disposition') || '';
  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

function getPlayerPlan(player) {
  if (player.kcal_objetivo) {
    return { kcal: Number(player.kcal_objetivo), calculated: false };
  }

  const weightKg = Number(player.peso_kg || 0);
  if (!weightKg) return { kcal: null, calculated: false };

  const dayType = resolveNutritionDayType(player.factor_actividad || 1.55);
  const calc = cunninghamPlan({
    weightKg,
    bodyFatPct: player.porcentaje_grasa ? Number(player.porcentaje_grasa) : null,
    leanMassKg: player.masa_magra_kg ? Number(player.masa_magra_kg) : null,
    activityFactor: dayType.factor,
    proteinGkg: dayType.proteinGkg,
    carbsGkg: dayType.carbsGkg,
    fatGkg: dayType.fatGkg,
  });

  return { kcal: calc.kcal, calculated: true };
}

export default function DashboardContent({ players = [], team }) {
  const router = useRouter();
  const [playersState, setPlayersState] = useState(players);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [reportModal, setReportModal] = useState({ opened: false, player: null });
  const [reportForm, setReportForm] = useState(defaultReportForm);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);

  const [generatingReport, setGeneratingReport] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableMenus, setAvailableMenus] = useState([]);
  const [selectedMenuWeek, setSelectedMenuWeek] = useState('');
  const [filters, setFilters] = useState({ name: '', email: '', position: '' });
  const [page, setPage] = useState(1);
  const totalPlayers = playersState.length;
  const playersWithPlan = playersState.map((player) => ({ ...player, plan: getPlayerPlan(player) }));
  const positionOptions = useMemo(() => {
    const positions = Array.from(new Set(playersState.map((player) => player.posicion).filter(Boolean))).sort();
    return [
      { value: '', label: 'Todas' },
      ...positions.map((position) => ({ value: position, label: position })),
    ];
  }, [playersState]);
  const filteredPlayers = useMemo(() => {
    const name = normalize(filters.name);
    const email = normalize(filters.email);
    const position = filters.position;

    return playersWithPlan.filter((player) => {
      const fullName = normalize(`${player.nombre || ''} ${player.apellidos || ''}`);
      const playerEmail = normalize(player.auth_email);
      const playerPosition = player.posicion || '';

      return (
        (!name || fullName.includes(name)) &&
        (!email || playerEmail.includes(email)) &&
        (!position || playerPosition === position)
      );
    });
  }, [filters.email, filters.name, filters.position, playersWithPlan]);
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE));
  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPlayers.slice(start, start + PAGE_SIZE);
  }, [filteredPlayers, page]);

  useEffect(() => {
    setPage(1);
  }, [filters.email, filters.name, filters.position]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function updateCredentials(jugadorId, credentials) {
    setPlayersState((prev) => prev.map((player) => (
      String(player.id) === String(jugadorId)
        ? { ...player, ...credentials }
        : player
    )));
  }

  async function deletePlayer(player) {
    const ok = window.confirm(`¿Eliminar a ${player.nombre} ${player.apellidos || ''}?`);
    if (!ok) return;

    setDeletingId(player.id);
    try {
      const formData = new FormData();
      formData.append('id', player.id);
      const res = await fetch('/api/players?delete=1', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Error eliminando jugador');
      setPlayersState((prev) => prev.filter((item) => String(item.id) !== String(player.id)));
      notifications.show({
        color: 'green',
        title: 'Jugador eliminado',
        message: `${player.nombre} ${player.apellidos || ''}`.trim(),
      });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo eliminar',
        message: e.message,
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function loadAvailableMenus(weekStr) {
    try {
      const url = team?.id ? `/api/menu-semanal?equipo_id=${team.id}` : '/api/menu-semanal';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const menusList = data.menus || [];
        setAvailableMenus(menusList);

        // Find if a menu matches the selected week
        const match = menusList.find((m) => m.semana === weekStr);
        if (match) {
          setSelectedMenuWeek(match.semana);
          updateReportField('semanaMenu', match.semana);
        } else if (menusList.length > 0) {
          setSelectedMenuWeek(menusList[0].semana);
          updateReportField('semanaMenu', menusList[0].semana);
        }
      }
    } catch (e) {
      console.error('Error loading menus list:', e);
    }
  }

  function openReportModal(player = null) {
    setReportModal({ opened: true, player });
    setShowAdvanced(false);

    if (player) {
      setSelectedPlayerIds([player.id]);
    } else {
      setSelectedPlayerIds(playersState.map((p) => p.id));
    }

    loadAvailableMenus(reportForm.semana);
  }

  function closeReportModal() {
    if (generatingReport) return;
    setReportModal({ opened: false, player: null });
  }

  function updateReportField(field, value) {
    setReportForm((current) => ({ ...current, [field]: value }));
  }

  function updateCalendarioDay(dayKey, value) {
    setReportForm((current) => ({
      ...current,
      calendario: {
        ...current.calendario,
        [dayKey]: value,
      },
    }));
  }



  async function generateReport() {
    const jugadorIds = reportModal.player ? [reportModal.player.id] : selectedPlayerIds;
    if (jugadorIds.length === 0) {
      notifications.show({
        color: 'red',
        title: 'Error al generar informe',
        message: 'Debes seleccionar al menos un jugador.',
      });
      return;
    }

    if (!selectedMenuWeek) {
      notifications.show({
        color: 'red',
        title: 'Error al generar informe',
        message: 'Debes seleccionar un menú del buffet comedor para poder generar el informe.',
      });
      return;
    }

    setGeneratingReport(true);
    try {
      const res = await fetch('/api/reports/weekly-squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta: reportForm,
          jugadorIds,
          calendario: reportForm.calendario,
          team_id: team?.id,
          semanaMenu: selectedMenuWeek
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo generar el informe');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filenameFromResponse(
        res,
        reportModal.player ? `Informe_${reportModal.player.nombre || 'Jugador'}.pdf` : 'Informe_Plantilla.pdf'
      );
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      notifications.show({
        color: 'green',
        title: 'Informe generado',
        message: reportModal.player
          ? `PDF individual de ${reportModal.player.nombre} listo para descargar.`
          : 'PDF de plantilla listo para descargar.',
      });
      setReportModal({ opened: false, player: null });
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'No se pudo generar el informe',
        message: e.message,
      });
    } finally {
      setGeneratingReport(false);
    }
  }

  return (
    <Stack gap="lg">
      {/* 1. RESUMEN / ACCIONES */}
      <Paper
        p={{ base: 'sm', sm: 'md' }}
        shadow="sm"
        radius="xl"
        withBorder
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,249,245,0.94))',
          zIndex: 10,
          position: 'relative'
        }}
      >
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="sm">
              <Tooltip label="Volver a equipos" withArrow>
                <ActionIcon component={Anchor} href="/dashboard" variant="light" color="gray" radius="xl" size={42}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
              </Tooltip>
              <ThemeIcon color="dark" variant="light" radius="xl" size={42}>
                <IconUsers size={21} />
              </ThemeIcon>
              <Box>
                <Title order={3} fw={850} c="#24291f" lh={1.1}>
                  {team?.nombre || 'Equipo'}
                </Title>
                <Text size="xs" c="dimmed" mt={2}>
                  {team?.temporada ? `${team.temporada}` : ''}
                </Text>
              </Box>
            </Group>

            <DashboardActions players={playersState} team={team} />
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
            <DashboardStat
              title="Jugadores activos"
              icon={IconUsers}
              color="blue"
              value={totalPlayers}
              description="Plantilla en seguimiento"
              onClick={() => openReportModal()}
            />
            <DashboardStat
              title="Evolución equipo"
              icon={IconChartLine}
              color="blue"
              value="Ver análisis →"
              description="Tendencias y comparativas"
              href={team?.id ? `/dashboard/equipo/${team.id}/evolucion` : '#'}
            />
            <DashboardStat
              title="Menú esta semana"
              icon={IconCalendarEvent}
              color="teal"
              value="Ver menú →"
              description="Sube foto o PDF del comedor"
              href={team?.id ? `/dashboard/equipo/${team.id}/menu` : '#'}
            />
          </SimpleGrid>

          <Paper p={6} radius="xl" shadow="xs" withBorder bg="white" w="100%">
            <Group gap={8} w="100%" wrap="wrap" align="center">
              <TextInput
                placeholder="Buscar por nombre"
                leftSection={<IconSearch size={16} style={{ opacity: 0.7 }} />}
                variant="filled"
                radius="xl"
                size="sm"
                value={filters.name}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setFilters((current) => ({ ...current, name: value }));
                }}
                style={{ flex: 2, minWidth: 190 }}
              />
              <TextInput
                placeholder="Buscar por email"
                leftSection={<IconMail size={16} style={{ opacity: 0.7 }} />}
                variant="filled"
                radius="xl"
                size="sm"
                value={filters.email}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setFilters((current) => ({ ...current, email: value }));
                }}
                style={{ flex: 2, minWidth: 190 }}
              />
              <Select
                placeholder="Posición"
                leftSection={<IconUsers size={16} style={{ opacity: 0.7 }} />}
                data={positionOptions}
                value={filters.position}
                onChange={(value) => setFilters((current) => ({ ...current, position: value || '' }))}
                variant="filled"
                radius="xl"
                size="sm"
                allowDeselect={false}
                style={{ flex: 1, minWidth: 150 }}
              />
            </Group>
          </Paper>
        </Stack>
      </Paper>

      {/* 3. LISTADO DE JUGADORES (TABLA) */}
      <Box>
        {filteredPlayers.length > 0 ? (
          <Paper radius="lg" p={0} bg="white" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
            <ScrollArea>
              <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: 800 }}>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th style={{ paddingLeft: 24 }}>Jugador</Table.Th>
                    <Table.Th visibleFrom="xs">Métricas</Table.Th>
                    <Table.Th visibleFrom="sm">Plan</Table.Th>
                    <Table.Th>Posición</Table.Th>
                    <Table.Th w={70} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedPlayers.map((player) => (
                    <Table.Tr
                      h={75}
                      key={player.id}
                      onClick={() => router.push(`/dashboard/jugador/${player.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* COLUMNA 1: JUGADOR */}
                      <Table.Td style={{ paddingLeft: 24 }}>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar size={42} radius="xl" color="initials">
                            {initials(`${player.nombre} ${player.apellidos || ''}`)}
                          </Avatar>
                          <Box style={{ minWidth: 0 }}>
                            <Group gap={6} wrap="nowrap">
                              <Text fz="sm" fw={600} c="dark.4" truncate>
                                {player.nombre} {player.apellidos}
                              </Text>
                              {!player.auth_user_id && (
                                <Tooltip label="El usuario no tiene credenciales para entrar" withArrow>
                                  <ThemeIcon color="yellow" variant="light" radius="xl" size="sm" style={{ flex: '0 0 auto' }}>
                                    <IconAlertTriangle size={14} />
                                  </ThemeIcon>
                                </Tooltip>
                              )}
                            </Group>
                            <Text c="dimmed" fz="xs" style={{ lineHeight: 1 }} truncate>
                              {player.auth_email || 'Sin credenciales de acceso'}
                            </Text>
                          </Box>
                        </Group>
                      </Table.Td>

                      {/* COLUMNA 2: MÉTRICAS */}
                      <Table.Td visibleFrom="xs">
                        {player.peso_kg || player.porcentaje_grasa ? (
                          <>
                            <Text fz="sm" fw={500} c="dark.4">
                              {player.peso_kg ? `${player.peso_kg} kg` : '—'}
                              {player.porcentaje_grasa ? ` · ${player.porcentaje_grasa}% GC` : ''}
                            </Text>
                            <Text fz="xs" c="dimmed">Composición</Text>
                          </>
                        ) : (
                          <Text fz="sm" c="dimmed">—</Text>
                        )}
                      </Table.Td>

                      {/* COLUMNA 3: KCAL OBJETIVO */}
                      <Table.Td visibleFrom="sm">
                        {player.plan.kcal ? (
                          <Group gap={6} wrap="nowrap">
                            <IconFlame size={14} style={{ opacity: 0.5 }} color="var(--mantine-color-orange-6)" />
                            <Box>
                              <Text fz="sm" fw={500} c="dark.4" lh={1.2}>
                                {player.plan.kcal} kcal
                              </Text>
                              <Text fz="xs" c="dimmed">
                                {player.plan.calculated ? 'Estimado' : 'Objetivo'}
                              </Text>
                            </Box>
                          </Group>
                        ) : (
                          <Text fz="sm" c="dimmed">—</Text>
                        )}
                      </Table.Td>

                      {/* COLUMNA 4: POSICIÓN */}
                      <Table.Td>
                        <Badge variant="light" color="gray" radius="sm">
                          {player.posicion || 'Sin posición'}
                        </Badge>
                      </Table.Td>

                      {/* COLUMNA 5: ACCIONES */}
                      <Table.Td>
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          <Menu shadow="md" width={220} position="bottom-end" withArrow radius="md">
                            <Menu.Target>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                radius="xl"
                                loading={deletingId === player.id}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <IconDots size={18} stroke={1.5} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown onClick={(event) => event.stopPropagation()}>
                              <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => setEditingPlayer(player)}>
                                Editar
                              </Menu.Item>
                              <Menu.Item leftSection={<IconFileTypePdf size={14} />} onClick={() => openReportModal(player)}>
                                Generar informe
                              </Menu.Item>
                              <PlayerCredentialsButton
                                jugador={player}
                                menuItem
                                onSaved={(credentials) => updateCredentials(player.id, credentials)}
                              />
                              <Menu.Divider />
                              <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => deletePlayer(player)}>
                                Eliminar
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            <Group justify="center" p="md" bg="gray.0" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                radius="xl"
              />
            </Group>
          </Paper>
        ) : (
          <NothingFound
            withPaper
            icon={IconUserPlus}
            title={playersState.length ? 'Sin resultados' : 'Sin jugadores'}
            description={playersState.length ? 'No hay jugadores que coincidan con los filtros.' : 'Importa un Excel o añade un jugador manualmente para empezar.'}
          />
        )}
      </Box>

      <Modal
        opened={!!editingPlayer}
        onClose={() => setEditingPlayer(null)}
        title={
          <Group gap="xs">
            <IconPencil size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={700}>Editar jugador</Text>
          </Group>
        }
        size="xl"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        {editingPlayer && <PlayerForm initial={editingPlayer} team={team} />}
      </Modal>

      <Modal
        opened={reportModal.opened}
        onClose={closeReportModal}
        title={
          <Group gap="xs">
            <IconFileText size={22} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Stack gap={0}>
              <Text fw={800} size="md">
                {reportModal.player ? `Informe de ${reportModal.player.nombre}` : 'Informe semanal de plantilla'}
              </Text>
              <Text size="xs" c="dimmed">
                Configuración del plan y la estructura de la semana
              </Text>
            </Stack>
          </Group>
        }
        size="1000px"
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <Box style={{ position: 'relative', minHeight: generatingReport ? '450px' : 'auto' }}>
          <AiGenerationOverlay opened={generatingReport} messages={SQUAD_GENERATION_MESSAGES} />
          <Stack gap="md">
            {/* Panel 1: Datos de la Semana */}
            <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(231, 245, 255, 0.35)', borderColor: '#a5d8ff' }}>
              <Group gap="xs" mb="xs">
                <ThemeIcon color="blue" size="sm" radius="xl" variant="light">
                  <IconCalendar size={14} />
                </ThemeIcon>
                <Text fw={700} size="sm" c="blue.9">Configuración de la Semana</Text>
              </Group>

              <Stack gap="sm">
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                  <TextInput
                    type="date"
                    label="Fecha de la semana (Lunes)"
                    value={reportForm.semana}
                    onChange={(event) => {
                      const val = event.currentTarget.value;
                      updateReportField('semana', val);
                      if (val) {
                        updateReportField('title', getWeekRangeLabel(val));
                      }
                      const match = availableMenus.find((m) => m.semana === val);
                      if (match) {
                        setSelectedMenuWeek(match.semana);
                        updateReportField('semanaMenu', match.semana);
                      }
                    }}
                  />
                  <TextInput
                    label="Título de semana"
                    value={reportForm.title}
                    onChange={(event) => updateReportField('title', event.currentTarget.value)}
                  />
                  <Select
                    label="Contexto general"
                    placeholder="Selecciona el contexto"
                    data={CONTEXTOS}
                    value={reportForm.contexto || 'semana_partido'}
                    onChange={(val) => updateReportField('contexto', val || 'semana_partido')}
                    allowDeselect={false}
                  />
                </SimpleGrid>

                <Box>
                  <Button
                    variant="subtle"
                    size="xs"
                    color="blue"
                    leftSection={<IconSettings size={14} />}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{ paddingLeft: 0 }}
                  >
                    {showAdvanced ? 'Ocultar configuración avanzada ▲' : 'Mostrar configuración avanzada ▼'}
                  </Button>

                  {showAdvanced && (
                    <Paper withBorder p="md" radius="md" mt="xs" style={{ background: '#ffffff', borderColor: '#e9ecef' }}>
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                          label="Subtítulo"
                          value={reportForm.subtitle}
                          onChange={(event) => updateReportField('subtitle', event.currentTarget.value)}
                        />
                        <TextInput
                          label="Club / equipo"
                          value={reportForm.team}
                          onChange={(event) => updateReportField('team', event.currentTarget.value)}
                        />
                        <TextInput
                          label="Autor / firma"
                          value={reportForm.author}
                          onChange={(event) => updateReportField('author', event.currentTarget.value)}
                        />
                        <TextInput
                          label="Handle / contacto"
                          value={reportForm.handle}
                          onChange={(event) => updateReportField('handle', event.currentTarget.value)}
                        />
                      </SimpleGrid>
                    </Paper>
                  )}
                </Box>
              </Stack>
            </Paper>

            {/* Panel 2: Menú del Buffet Comedor */}
            <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(230, 252, 245, 0.35)', borderColor: '#96f2d7' }}>
              <Group gap="xs" mb="xs">
                <ThemeIcon color="teal" size="sm" radius="xl" variant="light">
                  <IconChefHat size={14} />
                </ThemeIcon>
                <Text fw={700} size="sm" c="teal.9">Menú del Buffet Comedor</Text>
              </Group>

              <Box>
                <Select
                  label="Menú del comedor a sincronizar"
                  placeholder="Selecciona una semana..."
                  value={selectedMenuWeek}
                  onChange={(val) => {
                    setSelectedMenuWeek(val || '');
                    updateReportField('semanaMenu', val || '');
                  }}
                  data={availableMenus.map((m) => ({
                    value: m.semana,
                    label: `Menú de la semana del ${m.semana}`,
                  }))}
                />
              </Box>
            </Paper>

            {/* Panel 3: Tipos de Día */}
            <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(243, 240, 246, 0.4)', borderColor: '#e1dbec' }}>
              <Group gap="xs" mb="xs">
                <ThemeIcon color="grape" size="sm" radius="xl" variant="light">
                  <IconCalendarEvent size={14} />
                </ThemeIcon>
                <Text fw={700} size="sm" c="grape.9">Planificación del Tipo de Día</Text>
              </Group>

              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                {DAYS_OF_WEEK.map((day) => (
                  <Select
                    key={day.key}
                    label={day.label}
                    value={reportForm.calendario?.[day.key] || 'entreno'}
                    onChange={(val) => updateCalendarioDay(day.key, val)}
                    data={DAY_TYPE_OPTIONS}
                    size="sm"
                  />
                ))}
              </SimpleGrid>
            </Paper>

            {/* Panel 4: Seleccionar Jugadores */}
            {!reportModal.player && (
              <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(237, 242, 255, 0.35)', borderColor: '#bac8ff' }}>
                <Group justify="space-between" mb="xs" align="center">
                  <Group gap="xs">
                    <ThemeIcon color="indigo" size="sm" radius="xl" variant="light">
                      <IconUsers size={14} />
                    </ThemeIcon>
                    <Text fw={700} size="sm" c="indigo.9">
                      Destinatarios ({selectedPlayerIds.length} de {playersState.length})
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Button
                      variant="subtle"
                      size="compact-xs"
                      color="indigo"
                      onClick={() => setSelectedPlayerIds(playersState.map((p) => p.id))}
                    >
                      Seleccionar todos
                    </Button>
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-xs"
                      onClick={() => setSelectedPlayerIds([])}
                    >
                      Deseleccionar todos
                    </Button>
                  </Group>
                </Group>
                <ScrollArea h={140} offsetScrollbars style={{ border: '1px solid var(--mantine-color-gray-2)', borderRadius: 'var(--mantine-radius-md)', padding: '8px', backgroundColor: '#ffffff' }}>
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                    {playersState.map((player) => {
                      const isSelected = selectedPlayerIds.includes(player.id);
                      return (
                        <Checkbox
                          key={player.id}
                          label={`${player.nombre} ${player.apellidos || ''}`.trim()}
                          checked={isSelected}
                          onChange={(event) => {
                            const checked = event.currentTarget.checked;
                            setSelectedPlayerIds((prev) =>
                              checked
                                ? [...prev, player.id]
                                : prev.filter((id) => id !== player.id)
                            );
                          }}
                          size="sm"
                        />
                      );
                    })}
                  </SimpleGrid>
                </ScrollArea>
              </Paper>
            )}

            {/* Panel 5: Textos e Indicaciones */}
            <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'rgba(248, 249, 250, 0.5)', borderColor: '#e9ecef' }}>
              <Group gap="xs" mb="xs">
                <ThemeIcon color="gray" size="sm" radius="xl" variant="light">
                  <IconBook size={14} />
                </ThemeIcon>
                <Text fw={700} size="sm" c="gray.9">Contenido e Indicaciones del PDF</Text>
              </Group>

              <Stack gap="sm">
                <Textarea
                  label="Microciclo / calendario"
                  placeholder="Ej. Partido Domingo vs Barcelona. Lunes y Martes entreno normal..."
                  minRows={3}
                  autosize
                  value={reportForm.microcycle}
                  onChange={(event) => updateReportField('microcycle', event.currentTarget.value)}
                />
                <Textarea
                  label="Reglas de la semana"
                  placeholder="Ej. Hidratación regular, suplementación básica..."
                  minRows={3}
                  autosize
                  value={reportForm.rules}
                  onChange={(event) => updateReportField('rules', event.currentTarget.value)}
                />
                <Textarea
                  label="Equipamiento del buffet"
                  placeholder="Ej. Indicaciones de cómo servirse según día de entreno/partido..."
                  minRows={3}
                  autosize
                  value={reportForm.buffet}
                  onChange={(event) => updateReportField('buffet', event.currentTarget.value)}
                />
              </Stack>
            </Paper>

            <Group justify="space-between" align="center" mt="xs">
              <Text size="sm" c="dimmed">
                {reportModal.player
                  ? 'Se generará un PDF individual en una sola página A4.'
                  : `Se generará un PDF con portada y ${selectedPlayerIds.length} fichas individuales.`}
              </Text>
              <Button
                leftSection={<IconDownload size={16} />}
                radius="xl"
                color="blue"
                loading={generatingReport}
                onClick={generateReport}
              >
                Generar PDF
              </Button>
            </Group>
          </Stack>
        </Box>
      </Modal>
    </Stack>
  );
}
