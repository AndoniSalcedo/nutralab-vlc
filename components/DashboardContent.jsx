'use client';

import { useEffect, useMemo, useState } from 'react';
import { initials, filenameFromResponse } from '@/lib/utils';
import { Anchor, Group, Paper, SimpleGrid, Stack, Text, Title, ThemeIcon, Box, Table, ScrollArea, Avatar, Badge, ActionIcon, Menu, Tooltip, TextInput, Select, Pagination, Grid } from '@mantine/core';
import { deletePlayer } from '@/services/player';
import { getWeeklyMenus } from '@/services/menu';
import { generateWeeklySquadReport } from '@/services/report';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconArrowLeft, IconArrowRight, IconCalendarEvent, IconChartLine, IconDots, IconFileTypePdf, IconFlame, IconMail, IconSearch, IconTrash, IconUsers, IconUserPlus, IconPencil, IconSettings, IconBottle, IconPlus, IconFileSpreadsheet, IconReportMedical } from '@tabler/icons-react';
import NothingFound from '@/components/NothingFound/NothingFound';
import PlayerCredentialsButton from '@/components/PlayerCredentialsButton';
import { calculateByObjective, getTeamNutritionDayTypes } from '@/lib/calculations';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/modals/ConfirmModal';
import NewPlayerModal from '@/components/modals/NewPlayerModal';
import ImportDataModal from '@/components/modals/ImportDataModal';
import SendMessageModal from '@/components/modals/SendMessageModal';
import PlayerEditModal from '@/components/modals/PlayerEditModal';
import SquadReportModal from '@/components/modals/SquadReportModal';
import BoneyardSkeleton from '@/components/bones/BoneyardSkeleton';

const PAGE_SIZE = 8;

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
      py={6}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        cursor: isClickable ? 'pointer' : 'default',
        font: 'inherit',
        height: '100%',
        minHeight: 56,
        borderRadius: 'var(--mantine-radius-xl)',
        background: 'rgba(248,249,245,0.82)',
        border: '1px solid rgba(222,226,230,0.9)',
        transition: 'border-color 120ms ease, transform 120ms ease',
      }}
    >
      <Group gap="xs" wrap="nowrap" align="center" style={{ width: '100%' }}>
        <ThemeIcon color={color} variant="light" radius="md" size={32} style={{ flex: '0 0 auto' }}>
          <Icon size={16} stroke={1.6} />
        </ThemeIcon>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text fw={400} c="dimmed" fz={10} tt="uppercase" lts={0.6} truncate style={{ whiteSpace: 'nowrap' }}>
            {title}
          </Text>
          <Group gap={6} align="baseline" wrap="nowrap">
            <Text fw={700} size="sm" c="#24291f" lh={1.1} style={{ whiteSpace: 'nowrap' }}>
              {value}
            </Text>
            <Text size="xs" c="dimmed" truncate visibleFrom="sm" style={{ whiteSpace: 'nowrap' }}>
              {description}
            </Text>
          </Group>
        </Box>
        {isClickable && (
          <ThemeIcon color={color} variant="subtle" radius="xl" size={24} style={{ flex: '0 0 auto' }}>
            <IconArrowRight size={14} stroke={1.8} />
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



function getPlayerPlan(player, teamConfig) {
  if (player.kcal_objetivo) {
    return { kcal: Number(player.kcal_objetivo), calculated: false };
  }

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

export default function DashboardContent({ players = [], team }) {
  const router = useRouter();
  const [playersState, setPlayersState] = useState(players);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deletePlayerData, setDeletePlayerData] = useState(null);
  const [reportModal, setReportModal] = useState({ opened: false, player: null });
  const [reportForm, setReportForm] = useState(defaultReportForm);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(null);

  const teamConfig = team?.configuracion_nutricional;

  const dayTypeOptions = useMemo(() => {
    return getTeamNutritionDayTypes(teamConfig).map((d) => ({
      value: d.key,
      label: d.label,
    }));
  }, [teamConfig]);

  const [generatingReport, setGeneratingReport] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableMenus, setAvailableMenus] = useState([]);
  const [selectedMenuWeek, setSelectedMenuWeek] = useState('');
  const [filters, setFilters] = useState({ name: '', email: '', position: '' });
  const [page, setPage] = useState(1);
  const totalPlayers = playersState.length;
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

    setGeneratingReport(true);
    try {
      const res = await generateWeeklySquadReport({
        meta: reportForm,
        jugadorIds,
        calendario: reportForm.calendario,
        team_id: team?.id,
        semanaMenu: selectedMenuWeek
      });

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
    <BoneyardSkeleton name="team-dashboard" loading={false}>
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
          <Grid align="center" gutter="md">
            {/* Left part: Back arrow and Team Stack */}
            <Grid.Col span={{ base: 12, md: 'content' }}>
              <Group gap={0} justify="center" align="center" wrap="nowrap" style={{ height: '100%' }}>
                <Tooltip label="Volver a equipos" withArrow>
                  <ActionIcon component={Anchor} href="/dashboard" variant="light" color="gray" radius="xl" size={42}>
                    <IconArrowLeft size={20} />
                  </ActionIcon>
                </Tooltip>

                <Stack gap="xs" align="center" style={{ flex: 1 }}>
                  <ThemeIcon color="dark" variant="light" radius="xl" size={54}>
                    <IconUsers size={28} />
                  </ThemeIcon>
                  <Stack gap={2} align="center">
                    <Title order={3} fw={850} c="#24291f" lh={1.1} style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {team?.nombre || 'Equipo'}
                    </Title>
                    <Text size="xs" c="dimmed" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {team?.temporada ? `${team.temporada}` : ''}
                    </Text>
                  </Stack>
                </Stack>
              </Group>
            </Grid.Col>

            {/* Right part: Grid of 8 buttons */}
            <Grid.Col span={{ base: 12, md: 'auto' }}>
              <SimpleGrid cols={{ base: 2, lg: 3 }} spacing="xs">
                {/* Row 1: Modals */}
                <DashboardStat
                  title="Plantilla"
                  icon={IconUsers}
                  color="blue"
                  value={`${totalPlayers} jugadores`}
                  onClick={() => openReportModal()}
                />
                <DashboardStat
                  title="Importar datos"
                  icon={IconFileSpreadsheet}
                  color="teal"
                  value="Excel / CSV"
                  onClick={() => setActiveModal('import')}
                />
                <DashboardStat
                  title="Mensaje"
                  icon={IconMail}
                  color="blue"
                  value="Enviar mensaje"
                  onClick={() => setActiveModal('message')}
                />
                <DashboardStat
                  title="Nuevo jugador"
                  icon={IconPlus}
                  color="blue"
                  value="Añadir jugador"
                  onClick={() => setActiveModal('new-player')}
                />

                {/* Row 2 & 3: Redirects */}
                <DashboardStat
                  title="Suplementación"
                  icon={IconBottle}
                  color="grape"
                  value="Ver suplementos"
                  href={team?.id ? `/dashboard/equipo/${team.id}/suplementacion` : '#'}
                />
                <DashboardStat
                  title="Evolución equipo"
                  icon={IconChartLine}
                  color="blue"
                  value="Ver análisis"
                  href={team?.id ? `/dashboard/equipo/${team.id}/evolucion` : '#'}
                />
                <DashboardStat
                  title="Analíticas equipo"
                  icon={IconReportMedical}
                  color="red"
                  value="Ver analíticas"
                  href={team?.id ? `/dashboard/equipo/${team.id}/analiticas` : '#'}
                />
                <DashboardStat
                  title="Menú esta semana"
                  icon={IconCalendarEvent}
                  color="teal"
                  value="Ver menú"
                  href={team?.id ? `/dashboard/equipo/${team.id}/menu` : '#'}
                />
                <DashboardStat
                  title="Configuración"
                  icon={IconSettings}
                  color="gray"
                  value="Ajustes de equipo"
                  href={team?.id ? `/dashboard/equipo/${team.id}/configuracion` : '#'}
                />
              </SimpleGrid>
            </Grid.Col>
          </Grid>

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
                              <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDeletePlayer(player)}>
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
      <ConfirmModal
        opened={!!deletePlayerData}
        onClose={() => setDeletePlayerData(null)}
        onConfirm={confirmDeletePlayer}
        title="Eliminar jugador"
        message={deletePlayerData ? `¿Seguro que deseas eliminar a ${deletePlayerData.nombre} ${deletePlayerData.apellidos || ''}?` : ''}
        confirmLabel="Eliminar"
        loading={deletingId !== null}
      />
      </Stack>
    </BoneyardSkeleton>
  );
}
