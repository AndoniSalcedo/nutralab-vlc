'use client';

import { useEffect, useMemo, useState } from 'react';

import { initials, filenameFromResponse, getPlayerAvatarUrl } from '@/lib/utils';
import { Button, Group, Paper, Stack, Text, Box, Table, ScrollArea, Avatar, ActionIcon, Menu, Tooltip, TextInput, Select, Pagination, Modal, Divider } from '@mantine/core';
import { deletePlayer } from '@/services/player';
import { getWeeklyMenus } from '@/services/menu';
import { generateWeeklySquadReport } from '@/services/report';
import { notifications } from '@mantine/notifications';
import { IconChevronDown, IconDots } from '@/components/icons3d';
import Icon3D from '@/components/Icon3D';
import NothingFound from '@/components/NothingFound';
import PlayerCredentialsButton from '@/components/PlayerCredentialsButton';
import { calculateByObjective, getTeamNutritionDayTypes } from '@/lib/metrics/anthropometry';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/modals/ConfirmModal';
import NewPlayerModal from '@/components/modals/NewPlayerModal';
import ImportDataModal from '@/components/modals/ImportDataModal';
import SendMessageModal from '@/components/modals/SendMessageModal';
import TransferPlayersModal from '@/components/modals/TransferPlayersModal';
import PlayerEditModal from '@/components/modals/PlayerEditModal';
import SquadReportModal from '@/components/modals/SquadReportModal';
import SquadReportReviewModal from '@/components/modals/SquadReportReviewModal';
import SquadWeightModal from '@/components/modals/SquadWeightModal';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';
import TeamTecnicosConfig from '@/components/TeamTecnicosConfig';
import { TeamHeaderRightSection, TeamHeaderFilters } from '@/components/TeamHeaderContext';


const PAGE_SIZE = 8;

function PlayerPositionText({ position }) {
  if (!position) {
    return <Text fz="sm" c="dimmed">—</Text>;
  }

  return (
    <Text fz="sm" fw={500} c="dark.4" style={{ textTransform: 'capitalize' }}>
      {position}
    </Text>
  );
}

function PlayerSemaforoIndicator({ semaforo }) {
  if (!semaforo?.hasPesajes && !semaforo?.hasReference) {
    return (
      <Tooltip label="Sin registros para calcular peso objetivo de referencia" withArrow radius="md">
        <Text fz="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
          Sin pesajes
        </Text>
      </Tooltip>
    );
  }

  const { status, label, pesoActual, pesoReferencia, diff, masaMagra, porcentajeGrasaObjetivo } = semaforo;
  const isPositive = diff > 0;
  const formattedDiff = diff !== null ? (isPositive ? `+${diff.toFixed(2)} kg` : `${diff.toFixed(2)} kg`) : '0.00 kg';
  const fatPctLabel = porcentajeGrasaObjetivo ? `${porcentajeGrasaObjetivo}%` : '10%';

  const statusConfigMap = {
    verde: {
      color: '#2e7d32',
      dotColor: '#2e7d32',
      title: 'Óptimo',
    },
    amarillo: {
      color: '#b45309',
      dotColor: '#f59f00',
      title: 'Precaución',
    },
    rojo: {
      color: '#c92a2a',
      dotColor: '#e03131',
      title: diff < 0 ? 'Pérdida' : 'Exceso',
    },
  };

  const cfg = statusConfigMap[status] || statusConfigMap.verde;

  return (
    <Tooltip
      withArrow
      radius="md"
      multiline
      w={250}
      label={
        <Stack gap={4} p={4}>
          <Group justify="space-between" align="center">
            <Text size="xs" fw={700} c={cfg.color}>
              ● {label}
            </Text>
            <Text size="xs" fw={700} c={cfg.color} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {status}
            </Text>
          </Group>
          <Divider my={2} style={{ opacity: 0.2 }} />
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Peso Actual:</Text>
            <Text size="xs" fw={700}>{pesoActual} kg</Text>
          </Group>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Peso Ref ({fatPctLabel} grasa):</Text>
            <Text size="xs" fw={700}>{pesoReferencia} kg</Text>
          </Group>
          {masaMagra && (
            <Group justify="space-between">
              <Text size="xs" c="dimmed">Masa Magra (Antropo):</Text>
              <Text size="xs" fw={700}>{masaMagra} kg</Text>
            </Group>
          )}
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Variación:</Text>
            <Text size="xs" fw={700} c={cfg.color}>
              {formattedDiff}
            </Text>
          </Group>
          <Text size="10px" c="dimmed" mt={2} style={{ fontStyle: 'italic' }}>
            Margen verde (±0,50 kg) · Amarillo (±1,00 kg)
          </Text>
        </Stack>
      }
    >
      <Box style={{ cursor: 'pointer' }}>
        <Group gap={6} align="center" wrap="nowrap">
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: cfg.dotColor,
              boxShadow: `0 0 6px ${cfg.dotColor}`,
              flexShrink: 0,
            }}
          />
          <Text fz="sm" fw={700} style={{ color: cfg.color }}>
            {formattedDiff}
          </Text>
        </Group>
        <Text fz="11px" c="dimmed" mt={2}>
          {cfg.title} · Ref: <span style={{ fontWeight: 600 }}>{pesoReferencia} kg</span>
        </Text>
      </Box>
    </Tooltip>
  );
}

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}





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

function defaultReportForm(teamConfig) {
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
    microcycle: teamConfig?.pdfMicrocycle || '',
    rules: teamConfig?.pdfRules || '',
    buffet: teamConfig?.pdfBuffet || '',
    calendario: {
      lunes: 'entreno',
      martes: 'entreno',
      miercoles: 'descanso',
      jueves: 'entreno',
      viernes: 'entreno',
      sabado: 'descanso',
      domingo: 'descanso',
    },
    preMatchConfig: {
      enabled: false,
      diaPartido: 'sabado',
      horario: 'tarde',
    },
  };
}



function getPlayerPlan(player, teamConfig) {
  const weightKg = Number(player.peso_kg || 0);
  if (!weightKg) return { kcal: null, calculated: false };

  const objectiveKey = player.objetivo || 'mejora_rendimiento';
  const dayTypeKey = 'entreno';

  const result = calculateByObjective({ weightKg, objectiveKey, dayTypeKey, teamConfig });
  if (result) {
    return { kcal: result.kcal, calculated: true };
  }

  return { kcal: null, calculated: false };
}

export default function DashboardContent({ players = [], team, readOnly = false }) {
  const router = useRouter();
  const [playersState, setPlayersState] = useState(players);

  useEffect(() => {
    setPlayersState(players);
  }, [players]);

  const [editingPlayer, setEditingPlayer] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deletePlayerData, setDeletePlayerData] = useState(null);
  const [reportModal, setReportModal] = useState({ opened: false, player: null });
  const [reportForm, setReportForm] = useState(() => defaultReportForm(team?.configuracion_nutricional));
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [transferModal, setTransferModal] = useState({ opened: false, initialSelectedIds: [] });
  const closeModal = () => setActiveModal(null);

  const teamConfig = team?.configuracion_nutricional;

  const dayTypeOptions = useMemo(() => {
    return getTeamNutritionDayTypes(teamConfig).map((d) => ({
      value: d.key,
      label: d.label,
    }));
  }, [teamConfig]);

  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(null);
  const [reportWorkflow, setReportWorkflow] = useState(null);
  const [reviewPreview, setReviewPreview] = useState(null);
  const [reviewOpened, setReviewOpened] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableMenus, setAvailableMenus] = useState([]);
  const [selectedMenuWeek, setSelectedMenuWeek] = useState('');
  const [filters, setFilters] = useState({ name: '', email: '', position: '' });
  const [page, setPage] = useState(1);
  const playersWithPlan = playersState.map((player) => ({ ...player, plan: getPlayerPlan(player, team?.configuracion_nutricional) }));

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

  function handleDeletePlayer(player) {
    setDeletePlayerData(player);
  }

  async function confirmDeletePlayer() {
    if (!deletePlayerData) return;
    setDeletingId(deletePlayerData.id);
    try {
      await deletePlayer(deletePlayerData.id);
      setPlayersState((prev) => prev.filter((item) => String(item.id) !== String(deletePlayerData.id)));
      notifications.show({
        color: 'green',
        title: 'Jugador eliminado',
        message: `${deletePlayerData.nombre} ${deletePlayerData.apellidos || ''}`.trim(),
      });
      setDeletePlayerData(null);
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
      const data = await getWeeklyMenus(team?.id);
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
      } else {
        setSelectedMenuWeek('none');
        updateReportField('semanaMenu', 'none');
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
    if (generatingReport || reportWorkflow) return;
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



  async function downloadPdfFromResponse(res) {
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
  }

  function reportPayload(jugadorIds, extra = {}) {
    return {
      meta: reportForm,
      jugadorIds,
      calendario: reportForm.calendario,
      team_id: team?.id,
      semanaMenu: selectedMenuWeek,
      ...extra,
    };
  }

  function resetReportWorkflow(closeModal = true) {
    setGeneratingReport(false);
    setReviewLoading(false);
    setReportProgress(null);
    setReportWorkflow(null);
    setReviewPreview(null);
    setReviewOpened(false);
    if (closeModal) setReportModal({ opened: false, player: null });
  }

  async function generateAllPlayerPreviews(jugadorIds) {
    setGeneratingReport(true);
    const chunkSize = 3;
    const previews = [];

    for (let start = 0; start < jugadorIds.length; start += chunkSize) {
      const chunk = jugadorIds.slice(start, start + chunkSize);
      const names = chunk.map((id) => {
        const player = playersState.find((item) => String(item.id) === String(id));
        return player ? `${player.nombre} ${player.apellidos || ''}`.trim() : `Jugador ${id}`;
      }).join(', ');

      setReportProgress({
        current: start,
        total: jugadorIds.length,
        currentPlayerName: names,
      });

      const res = await generateWeeklySquadReport(reportPayload(chunk, {
        previewOnly: true,
        forceRegenerate: true,
      }));
      const data = await res.json();
      const chunkPreview = Array.isArray(data.preview) ? data.preview : [];
      const previewById = new Map(chunkPreview.map((item) => [String(item.id), item]));
      const orderedChunkPreview = chunk.map((id) => previewById.get(String(id)));

      if (orderedChunkPreview.some((item) => !item?.plan)) {
        throw new Error('La API no devolvió todos los borradores de los jugadores.');
      }

      previews.push(...orderedChunkPreview);
      setReportProgress({
        current: Math.min(start + chunk.length, jugadorIds.length),
        total: jugadorIds.length,
        currentPlayerName: start + chunk.length < jugadorIds.length ? 'Preparando siguientes jugadores...' : 'Todos los borradores generados.',
      });
    }

    if (!previews.length) throw new Error('No se generaron borradores para revisar.');

    setReportWorkflow({ jugadorIds, previews, index: 0, approved: [] });
    setReviewPreview(previews[0]);
    setReviewOpened(true);
    setReviewLoading(false);
    setGeneratingReport(false);
    setReportProgress(null);
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
        message: 'Debes seleccionar un menú del buffet comedor o elegir "Sin menú" para poder generar el informe.',
      });
      return;
    }

    if (selectedMenuWeek === 'none') {
      notifications.show({
        color: 'yellow',
        title: 'Generando sin menú',
        message: 'La IA tendrá libertad total para crear los platos ya que no se ha seleccionado menú comedor.',
      });
    }

    setReviewPreview(null);
    setReviewOpened(false);
    try {
      await generateAllPlayerPreviews(jugadorIds);
    } catch (e) {
      resetReportWorkflow(false);
      notifications.show({
        color: 'red',
        title: 'No se pudo generar el borrador',
        message: e.message,
      });
    }
  }

  async function commitApprovedPlayers(approved) {
    if (!approved.length) {
      resetReportWorkflow(true);
      notifications.show({
        color: 'blue',
        title: 'Informe descartado',
        message: 'Se han descartado todos los jugadores. No se ha guardado ningún informe.',
      });
      return;
    }

    const approvedIds = approved.map((item) => item.id);
    setReviewOpened(false);
    setGeneratingReport(true);
    setReportProgress({
      current: approvedIds.length,
      total: approvedIds.length,
      currentPlayerName: 'Guardando jugadores aprobados y compilando PDF final...',
    });

    const res = await generateWeeklySquadReport(reportPayload(approvedIds, {
      commitDraft: true,
      forceRegenerate: false,
      draftPlayers: approved,
    }));
    await downloadPdfFromResponse(res);

    notifications.show({
      color: 'green',
      title: 'Informe guardado y generado',
      message: reportModal.player
        ? `PDF individual de ${reportModal.player.nombre} listo para descargar.`
        : `${approved.length} jugadores guardados y PDF de plantilla listo.`,
    });
    resetReportWorkflow(true);
  }

  async function moveToNextReview(approved) {
    const { previews, index } = reportWorkflow;
    if (index + 1 < previews.length) {
      setReportWorkflow({ ...reportWorkflow, index: index + 1, approved });
      setReviewPreview(previews[index + 1]);
      setReviewLoading(false);
      return;
    }

    await commitApprovedPlayers(approved);
  }

  async function validateCurrentPreview() {
    if (!reportWorkflow || !reviewPreview) return;

    const approved = [
      ...reportWorkflow.approved,
      { id: reviewPreview.id, plan: reviewPreview.plan },
    ];
    setReviewLoading(true);

    try {
      await moveToNextReview(approved);
    } catch (e) {
      setReviewLoading(false);
      setGeneratingReport(false);
      setReportProgress(null);
      setReviewOpened(true);
      notifications.show({
        color: 'red',
        title: 'No se pudo completar el informe',
        message: e.message,
      });
    }
  }

  async function discardCurrentPreview() {
    if (!reportWorkflow) return;
    setReviewLoading(true);
    try {
      await moveToNextReview(reportWorkflow.approved);
    } catch (e) {
      setReviewLoading(false);
      setGeneratingReport(false);
      setReviewOpened(true);
      notifications.show({
        color: 'red',
        title: 'No se pudo completar la revisión',
        message: e.message,
      });
    }
  }

  function cancelReportWorkflow() {
    resetReportWorkflow(true);
    notifications.show({
      color: 'blue',
      title: 'Generación cancelada',
      message: 'No se ha guardado ningún borrador del informe.',
    });
  }

  const teamActionsDropdown = (
    <Menu.Dropdown>
      <Menu.Label>Mediciones y Reportes</Menu.Label>
      <Menu.Item
        leftSection={<Icon3D name="scale" size={20} />}
        onClick={() => setActiveModal('weight')}
      >
        Registrar pesajes
      </Menu.Item>
      <Menu.Item
        leftSection={<Icon3D name="document" size={20} />}
        onClick={() => openReportModal()}
      >
        Generar informe
      </Menu.Item>
      <Menu.Divider />
      <Menu.Label>Plantilla y Datos</Menu.Label>
      <Menu.Item
        leftSection={<Icon3D name="outbox" size={20} />}
        onClick={() => setActiveModal('import')}
      >
        Importar datos
      </Menu.Item>
      <Menu.Item
        leftSection={<Icon3D name="refresh" size={20} />}
        onClick={() => setTransferModal({ opened: true, initialSelectedIds: [] })}
      >
        Transferir o copiar
      </Menu.Item>
      <Menu.Divider />
      <Menu.Label>Staff y Comunicación</Menu.Label>
      <Menu.Item
        leftSection={<Icon3D name="chat" size={20} />}
        onClick={() => setActiveModal('message')}
      >
        Enviar mensaje
      </Menu.Item>
      <Menu.Item
        leftSection={<Icon3D name="shield" size={20} />}
        onClick={() => setActiveModal('tecnicos')}
      >
        Cuerpo técnico
      </Menu.Item>
    </Menu.Dropdown>
  );

  return (
    <BoneyardSkeleton name="team-dashboard" loading={false}>
      {/* 1. BOTONES DE ACCIÓN INTEGRADOS EN LA CABECERA */}
      <TeamHeaderRightSection>
        {!readOnly && (
          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* Móvil: botón más (+) compacto */}
            <Tooltip label="Nuevo jugador" withArrow>
              <ActionIcon
                hiddenFrom="sm"
                size={36}
                radius="xl"
                color="dark"
                onClick={() => setActiveModal('new-player')}
                aria-label="Nuevo jugador"
              >
                <Icon3D name="plus" size={18} />
              </ActionIcon>
            </Tooltip>

            {/* Escritorio: Botón completo */}
            <Button
              visibleFrom="sm"
              size="xs"
              radius="xl"
              color="dark"
              leftSection={<Icon3D name="plus" size={18} />}
              onClick={() => setActiveModal('new-player')}
            >
              Nuevo jugador
            </Button>

            {/* Móvil: botón engranaje (⚙) compacto */}
            <Box hiddenFrom="sm">
              <Menu shadow="md" width={240} position="bottom-end" withArrow radius="md">
                <Menu.Target>
                  <ActionIcon
                    variant="default"
                    size={36}
                    radius="xl"
                    aria-label="Acciones de equipo"
                  >
                    <Icon3D name="configuracion" size={20} />
                  </ActionIcon>
                </Menu.Target>
                {teamActionsDropdown}
              </Menu>
            </Box>

            {/* Escritorio: Botón completo */}
            <Box visibleFrom="sm">
              <Menu shadow="md" width={240} position="bottom-end" withArrow radius="md">
                <Menu.Target>
                  <Button
                    variant="default"
                    size="xs"
                    radius="xl"
                    leftSection={<Icon3D name="configuracion" size={18} />}
                    rightSection={<IconChevronDown size={14} />}
                  >
                    Acciones de equipo
                  </Button>
                </Menu.Target>
                {teamActionsDropdown}
              </Menu>
            </Box>
          </Group>
        )}
      </TeamHeaderRightSection>

      {/* 2. FILTROS Y BÚSQUEDA INTEGRADOS EN LA CABECERA */}
      <TeamHeaderFilters>
        <Box w="100%" style={{ minWidth: 0 }}>
          <Group gap={8} wrap="wrap" align="center" w="100%">
            <TextInput
              placeholder="Buscar jugador por nombre..."
              leftSection={<Icon3D name="search" size={18} />}
              variant="filled"
              radius="xl"
              size="sm"
              value={filters.name}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setFilters((current) => ({ ...current, name: value }));
              }}
              style={{ flex: '2 1 180px', minWidth: 0 }}
            />
            <Select
              placeholder="Filtrar por posición"
              leftSection={<Icon3D name="soccer" size={18} />}
              data={positionOptions || []}
              value={filters.position}
              onChange={(value) => setFilters((current) => ({ ...current, position: value || '' }))}
              variant="filled"
              radius="xl"
              size="sm"
              allowDeselect={false}
              style={{ flex: '1 1 140px', minWidth: 0 }}
            />
            <TextInput
              placeholder="Buscar por email..."
              leftSection={<Icon3D name="envelope" size={18} />}
              variant="filled"
              radius="xl"
              size="sm"
              value={filters.email}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setFilters((current) => ({ ...current, email: value }));
              }}
              style={{ flex: '1.5 1 160px', minWidth: 0 }}
            />
          </Group>
        </Box>
      </TeamHeaderFilters>

      <Stack gap="lg" style={{ width: '100%', minWidth: 0 }}>
        {/* 3. LISTADO DE JUGADORES (TABLA) */}
        <Box style={{ width: '100%', minWidth: 0 }}>
          {filteredPlayers.length > 0 ? (
            <Paper radius="xl" p={0} bg="white" shadow="xs" withBorder style={{ overflow: 'hidden', borderColor: 'rgba(222,226,230,0.8)', width: '100%', minWidth: 0 }}>
              <ScrollArea style={{ width: '100%', minWidth: 0 }}>
                <Table verticalSpacing="sm" highlightOnHover w="100%" miw={{ base: '100%', sm: 760 }}>
                  <Table.Thead bg="rgba(248, 249, 250, 0.95)">
                    <Table.Tr>
                      <Table.Th style={{ paddingLeft: 16, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mantine-color-gray-6)' }}>Jugador</Table.Th>
                      <Table.Th visibleFrom="xs" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mantine-color-gray-6)' }}>Métricas</Table.Th>
                      <Table.Th visibleFrom="xs" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mantine-color-gray-6)' }}>Semáforo Peso</Table.Th>
                      <Table.Th visibleFrom="sm" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mantine-color-gray-6)' }}>Plan Nutricional</Table.Th>
                      <Table.Th style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mantine-color-gray-6)' }}>Posición</Table.Th>
                      {!readOnly && <Table.Th w={50} />}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedPlayers.map((player) => (
                      <Table.Tr
                        h={74}
                        key={player.id}
                        onClick={() => router.push(`/dashboard/jugador/${player.id}`)}
                        style={{ cursor: 'pointer', transition: 'background-color 120ms ease' }}
                      >
                        {/* COLUMNA 1: JUGADOR */}
                        <Table.Td style={{ paddingLeft: 16 }}>
                          <Group gap="sm" wrap="nowrap">
                            <Avatar
                              src={getPlayerAvatarUrl(player)}
                              size={42}
                              radius="xl"
                              color="initials"
                              style={{ border: '1.5px solid rgba(222, 226, 230, 0.7)', flexShrink: 0 }}
                            >
                              {initials(`${player.nombre} ${player.apellidos || ''}`)}
                            </Avatar>
                            <Box style={{ minWidth: 0, flex: 1 }}>

                              <Group gap={6} wrap="nowrap">
                                <Text fz="sm" fw={600} c="dark.5" truncate>
                                  {player.nombre} {player.apellidos}
                                </Text>
                                {!player.auth_user_id && (
                                  <Tooltip label="El usuario no tiene credenciales para entrar" withArrow>
                                    <Box component="span" style={{ display: 'inline-flex', verticalAlign: 'middle', flexShrink: 0 }}>
                                      <Icon3D name="warning" size={16} />
                                    </Box>
                                  </Tooltip>
                                )}
                              </Group>
                              <Text c="dimmed" fz="xs" style={{ lineHeight: 1.2 }} truncate>
                                {player.auth_email || 'Sin credenciales de acceso'}
                              </Text>

                              {/* Indicadores en móvil sin necesidad de columnas adicionales */}
                              <Group gap={6} align="center" hiddenFrom="xs" mt={3}>
                                {player.peso_kg ? (
                                  <Text fz="xs" fw={500} c="dimmed">
                                    {player.peso_kg} kg
                                  </Text>
                                ) : null}
                                {player.semaforo?.diff !== null && player.semaforo?.diff !== undefined && (
                                  <Text
                                    fz="xs"
                                    fw={600}
                                    c={
                                      player.semaforo.status === 'verde'
                                        ? '#2e7d32'
                                        : player.semaforo.status === 'amarillo'
                                        ? '#b45309'
                                        : '#c92a2a'
                                    }
                                  >
                                    ● {player.semaforo.diff > 0 ? `+${player.semaforo.diff.toFixed(1)}` : player.semaforo.diff.toFixed(1)} kg
                                  </Text>
                                )}
                              </Group>
                            </Box>
                          </Group>
                        </Table.Td>

                        {/* COLUMNA 2: MÉTRICAS */}
                        <Table.Td visibleFrom="xs">
                          {player.peso_kg || player.porcentaje_grasa ? (
                            <Box>
                              <Text fz="sm" fw={600} c="dark.5">
                                {player.peso_kg ? `${player.peso_kg} kg` : '—'}
                                {player.porcentaje_grasa ? (
                                  <Text component="span" c="dimmed" fw={400} fz="xs"> · {player.porcentaje_grasa}% GC</Text>
                                ) : ''}
                              </Text>
                              <Text fz="xs" c="dimmed">Composición corporal</Text>
                            </Box>
                          ) : (
                            <Text fz="sm" c="dimmed">—</Text>
                          )}
                        </Table.Td>

                        {/* COLUMNA 3: SEMÁFORO */}
                        <Table.Td visibleFrom="xs">
                          <PlayerSemaforoIndicator semaforo={player.semaforo} />
                        </Table.Td>

                        {/* COLUMNA 4: KCAL OBJETIVO */}
                        <Table.Td visibleFrom="sm">
                          {player.plan?.kcal ? (
                            <Group gap={8} wrap="nowrap" align="center">
                              <Icon3D name="fire" size={24} />
                              <Box>
                                <Text fz="sm" fw={600} c="dark.5" lh={1.1}>
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

                        {/* COLUMNA 5: POSICIÓN */}
                        <Table.Td>
                          <PlayerPositionText position={player.posicion} />
                        </Table.Td>

                        {/* COLUMNA 5: ACCIONES */}
                        {!readOnly && (
                          <Table.Td>
                            <Group gap={4} justify="flex-end" wrap="nowrap">
                              <Menu shadow="md" width={220} position="bottom-end" withArrow radius="md" keepMounted>
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
                                  <Menu.Item leftSection={<Icon3D name="edit" size={18} />} onClick={() => setEditingPlayer(player)}>
                                    Editar
                                  </Menu.Item>
                                  <Menu.Item leftSection={<Icon3D name="memo" size={18} />} onClick={() => openReportModal(player)}>
                                    Generar informe
                                  </Menu.Item>
                                  <Menu.Divider />
                                  <Menu.Item leftSection={<Icon3D name="refresh" size={18} />} onClick={() => setTransferModal({ opened: true, initialSelectedIds: [player.id] })}>
                                    Transferir a otro equipo
                                  </Menu.Item>
                                  <PlayerCredentialsButton
                                    jugador={player}
                                    menuItem
                                    onSaved={(credentials) => updateCredentials(player.id, credentials)}
                                  />
                                  <Menu.Divider />
                                  <Menu.Item color="red" leftSection={<Icon3D name="trash" size={18} />} onClick={() => handleDeletePlayer(player)}>
                                    Eliminar
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            </Group>
                          </Table.Td>
                        )}
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
              icon3d="user"
              title={playersState.length ? 'Sin resultados' : 'Sin jugadores'}
              description={playersState.length ? 'No hay jugadores que coincidan con los filtros.' : 'Importa un Excel o añade un jugador manualmente para empezar.'}
            />
          )}
        </Box>

        <PlayerEditModal
          opened={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          player={editingPlayer}
          team={team}
        />

        <SquadReportModal
          opened={reportModal.opened}
          onClose={closeReportModal}
          reportModal={reportModal}
          generatingReport={generatingReport}
          reportProgress={reportProgress}
          reportForm={reportForm}
          updateReportField={updateReportField}
          availableMenus={availableMenus}
          selectedMenuWeek={selectedMenuWeek}
          setSelectedMenuWeek={setSelectedMenuWeek}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          dayTypeOptions={dayTypeOptions}
          updateCalendarioDay={updateCalendarioDay}
          selectedPlayerIds={selectedPlayerIds}
          setSelectedPlayerIds={setSelectedPlayerIds}
          playersState={playersState}
          generateReport={generateReport}
        />

        <SquadReportReviewModal
          opened={reviewOpened}
          preview={reviewPreview}
          index={reportWorkflow?.index || 0}
          total={reportWorkflow?.jugadorIds?.length || 0}
          loading={reviewLoading}
          onValidate={validateCurrentPreview}
          onDiscard={discardCurrentPreview}
          onCancel={cancelReportWorkflow}
        />

        <NewPlayerModal
          opened={activeModal === 'new-player'}
          onClose={closeModal}
          team={team}
        />

        <ImportDataModal
          opened={activeModal === 'import'}
          onClose={closeModal}
          team={team}
        />

        <SendMessageModal
          opened={activeModal === 'message'}
          onClose={closeModal}
          players={playersState}
          team={team}
          onSent={closeModal}
        />

        <SquadWeightModal
          opened={activeModal === 'weight'}
          onClose={closeModal}
          players={playersState}
          team={team}
        />

        <Modal
          opened={activeModal === 'tecnicos'}
          onClose={closeModal}
          size="lg"
          radius="lg"
          withCloseButton={false}
          padding={0}
        >
          <TeamTecnicosConfig team={team} readOnly={readOnly} />
        </Modal>
        <ConfirmModal
          opened={!!deletingId || !!deletePlayerData}
          onClose={() => {
            setDeletingId(null);
            setDeletePlayerData(null);
          }}
          onConfirm={confirmDeletePlayer}
          loading={!!deletingId}
          title="Eliminar Jugador"
          message={`¿Estás seguro que deseas eliminar a ${deletePlayerData?.nombre}? Todos sus datos, métricas y plan nutricional se perderán. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar jugador"
        />

        <TransferPlayersModal 
          opened={transferModal.opened} 
          onClose={() => setTransferModal({ opened: false, initialSelectedIds: [] })} 
          team={team} 
          players={playersState}
          initialSelectedIds={transferModal.initialSelectedIds}
        />
      </Stack>
    </BoneyardSkeleton>
  );
}
