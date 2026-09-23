'use client';

import React, { useState, useMemo } from 'react';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Menu,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconMinus,
  IconCheck,
  IconDroplet,
  IconBolt,
  IconArrowLeft,
  IconArrowRight,
  IconChevronDown,
  IconFileSpreadsheet,
  IconArrowsExchange,
} from '@/components/icons3d';
import Icon3D from '@/components/Icon3D';
import ResponsiveModal from './ResponsiveModal';
import { initials, getPlayerAvatarUrl } from '@/lib/utils';
import {
  INTRAPARTIDO_TIMINGS,
  INTRAPARTIDO_PRODUCTS,
  PRODUCTS_MAP,
  calculateNutrientTotals,
  generateInitialMockSession,
} from '@/data/intrapartido-mock';

const COMPETITION_OPTIONS = [
  { value: 'LaLiga EA Sports', label: 'LaLiga EA Sports' },
  { value: 'LaLiga Hypermotion', label: 'LaLiga Hypermotion' },
  { value: 'Copa del Rey', label: 'Copa del Rey' },
  { value: 'Supercopa de España', label: 'Supercopa de España' },
  { value: 'Champions League', label: 'Champions League' },
  { value: 'Europa League', label: 'Europa League' },
  { value: 'Conference League', label: 'Conference League' },
  { value: 'Supercopa de Europa', label: 'Supercopa de Europa' },
  { value: 'Mundial de Clubes', label: 'Mundial de Clubes' },
  { value: 'Amistoso', label: 'Amistoso' },
];

const LOCATION_OPTIONS = [
  { value: 'Mestalla', label: 'Mestalla (Local)' },
  { value: 'Visitante', label: 'Visitante' },
  { value: 'Campo Neutral', label: 'Campo Neutral' },
];

const POSITION_FILTER_OPTIONS = [
  { value: 'todas', label: 'Todas las posiciones' },
  { value: 'Portero', label: 'Porteros' },
  { value: 'Defensa', label: 'Defensas' },
  { value: 'Centrocampista', label: 'Centrocampistas' },
  { value: 'Delantero', label: 'Delanteros' },
];

const POSITION_FILTER_SHORT_OPTIONS = [
  { value: 'todas', label: 'Todas' },
  { value: 'Portero', label: 'Porteros' },
  { value: 'Defensa', label: 'Defensas' },
  { value: 'Centrocampista', label: 'Medios' },
  { value: 'Delantero', label: 'Delanteros' },
];

function dateValue(value) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function dateInputToIso(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function IntrapartidoModal({
  opened,
  onClose,
  players = [],
  team = null,
}) {
  // Estado de la sesión del partido (en memoria)
  const [session, setSession] = useState(() => generateInitialMockSession(players));

  // Paso principal del flujo: 'alineacion' -> 'fases' -> 'resumen'
  const [currentStep, setCurrentStep] = useState('alineacion');

  // Índice de la fase activa del partido (0 a 6)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  // Sub-filtro dentro de fases: 'titulares' | 'suplentes'
  const [groupFilter, setGroupFilter] = useState('titulares');

  // Búsqueda y filtro de posición
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('todas');

  // Map de jugadores completo
  const allPlayersMap = useMemo(() => {
    return new Map(players.map((p) => [String(p.id), p]));
  }, [players]);

  const activeRosterSet = useMemo(() => {
    return new Set(session.activeRosterIds);
  }, [session.activeRosterIds]);

  const starterSet = useMemo(() => {
    return new Set(session.starterIds);
  }, [session.starterIds]);

  const currentTiming = INTRAPARTIDO_TIMINGS[currentPhaseIndex] || INTRAPARTIDO_TIMINGS[0];

  // Actualizar metadatos del partido (rival, competición, lugar, fecha)
  const handleUpdateMatchInfo = (field, value) => {
    setSession((prev) => ({
      ...prev,
      matchInfo: {
        ...(prev.matchInfo || {}),
        [field]: value,
      },
    }));
  };

  // Alternar condición de un jugador en la pantalla de alineación
  const handleTogglePlayerStatus = (playerId) => {
    const pId = String(playerId);
    setSession((prev) => {
      const isStarter = prev.starterIds.includes(pId);
      const isConvocado = prev.activeRosterIds.includes(pId);

      let nextStarters = [...prev.starterIds];
      let nextRoster = [...prev.activeRosterIds];

      if (!isConvocado) {
        if (nextStarters.length < 11) {
          nextStarters.push(pId);
        }
        nextRoster.push(pId);
      } else if (isStarter) {
        nextStarters = nextStarters.filter((id) => id !== pId);
      } else {
        nextRoster = nextRoster.filter((id) => id !== pId);
      }

      return {
        ...prev,
        starterIds: nextStarters,
        activeRosterIds: nextRoster,
      };
    });
  };

  // Sustituir jugador (un titular sale y un suplente entra)
  const handleSubstitute = (outgoingPlayerId, incomingPlayerId) => {
    const outId = String(outgoingPlayerId);
    const inId = String(incomingPlayerId);

    const outPlayer = allPlayersMap.get(outId);
    const inPlayer = allPlayersMap.get(inId);

    setSession((prev) => {
      const nextStarters = new Set(prev.starterIds);
      const nextRoster = new Set(prev.activeRosterIds);

      nextRoster.add(outId);
      nextRoster.add(inId);

      nextStarters.delete(outId);
      nextStarters.add(inId);

      return {
        ...prev,
        starterIds: Array.from(nextStarters),
        activeRosterIds: Array.from(nextRoster),
      };
    });

    notifications.show({
      color: 'teal',
      title: 'Cambio realizado',
      message: `Entra ${inPlayer?.nombre || 'Jugador'} por ${outPlayer?.nombre || 'Jugador'} (${currentTiming.short}).`,
    });
  };

  // Mover jugador al banquillo directamente
  const handleDemoteToBench = (playerId) => {
    const pId = String(playerId);
    const player = allPlayersMap.get(pId);
    setSession((prev) => ({
      ...prev,
      starterIds: prev.starterIds.filter((id) => id !== pId),
    }));
    notifications.show({
      color: 'blue',
      title: 'Pasa al banquillo',
      message: `${player?.nombre || 'Jugador'} pasa a suplente.`,
    });
  };

  // Mover jugador a titular directamente
  const handlePromoteToStarter = (playerId) => {
    const pId = String(playerId);
    const player = allPlayersMap.get(pId);
    setSession((prev) => {
      const nextStarters = new Set(prev.starterIds);
      nextStarters.add(pId);
      return {
        ...prev,
        starterIds: Array.from(nextStarters),
      };
    });
    notifications.show({
      color: 'green',
      title: 'Pasa a titular',
      message: `${player?.nombre || 'Jugador'} pasa al once titular.`,
    });
  };

  // Registrar toma (+1 o -1 de un producto en la fase actual)
  const handleModifyProduct = (playerId, productId, amount = 1) => {
    const pId = String(playerId);
    const timingId = currentTiming.id;

    setSession((prev) => {
      const currentIntakes = prev.intakes[pId] || {};
      const currentPhase = currentIntakes[timingId] || {};
      const currentQty = currentPhase[productId] || 0;
      const newQty = Math.max(0, currentQty + amount);

      const updatedPhase = { ...currentPhase };
      if (newQty > 0) {
        updatedPhase[productId] = newQty;
      } else {
        delete updatedPhase[productId];
      }

      return {
        ...prev,
        intakes: {
          ...prev.intakes,
          [pId]: {
            ...currentIntakes,
            [timingId]: updatedPhase,
          },
        },
      };
    });
  };

  // Reparto rápido en lote al grupo activo (titulares o suplentes) en la fase actual
  const handleBatchDistribute = (productId) => {
    const prod = PRODUCTS_MAP.get(productId);
    const prodName = prod?.nombre || 'Producto';
    const timingId = currentTiming.id;
    const isSuplentes = groupFilter === 'suplentes';

    // Determinar los destinatarios según la pestaña activa (titulares o suplentes convocados)
    const targetIds = isSuplentes
      ? session.activeRosterIds.filter((pId) => !starterSet.has(pId))
      : session.starterIds;

    if (targetIds.length === 0) {
      notifications.show({
        color: 'yellow',
        title: 'Sin jugadores',
        message: isSuplentes
          ? 'No hay suplentes en la convocatoria activa.'
          : 'No hay titulares seleccionados en el once.',
      });
      return;
    }

    setSession((prev) => {
      const nextIntakes = { ...prev.intakes };
      targetIds.forEach((pId) => {
        const playerIntakes = nextIntakes[pId] || {};
        const phaseIntakes = playerIntakes[timingId] || {};
        const currentQty = phaseIntakes[productId] || 0;

        nextIntakes[pId] = {
          ...playerIntakes,
          [timingId]: {
            ...phaseIntakes,
            [productId]: currentQty + 1,
          },
        };
      });
      return { ...prev, intakes: nextIntakes };
    });

    const targetDesc = isSuplentes
      ? `a los suplentes (${targetIds.length})`
      : `al once titular (${targetIds.length})`;

    notifications.show({
      color: 'teal',
      title: 'Toma repartida',
      message: `+1 ${prodName} repartido ${targetDesc} en ${currentTiming.short}.`,
    });
  };

  // Lista de jugadores de la fase actual
  const currentPhasePlayers = useMemo(() => {
    const list = players.filter((p) => {
      const pId = String(p.id);
      if (!activeRosterSet.has(pId)) return false;
      if (groupFilter === 'titulares') return starterSet.has(pId);
      if (groupFilter === 'suplentes') return !starterSet.has(pId);
      return true;
    });

    return list.filter((p) => {
      if (positionFilter !== 'todas' && p.posicion !== positionFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const fullName = `${p.nombre || ''} ${p.apellidos || ''}`.toLowerCase();
      return fullName.includes(q) || (p.posicion || '').toLowerCase().includes(q);
    });
  }, [players, activeRosterSet, starterSet, groupFilter, searchQuery, positionFilter]);

  // Listas de suplentes y titulares disponibles para hacer sustituciones
  const availableSubstitutes = useMemo(() => {
    return session.activeRosterIds
      .filter((id) => !starterSet.has(id))
      .map((id) => allPlayersMap.get(id))
      .filter(Boolean);
  }, [session.activeRosterIds, starterSet, allPlayersMap]);

  const currentStartersList = useMemo(() => {
    return session.starterIds
      .map((id) => allPlayersMap.get(id))
      .filter(Boolean);
  }, [session.starterIds, allPlayersMap]);

  // Totales acumulados para el balance
  const teamNutrients = useMemo(() => {
    const allIntakesList = [];
    Object.values(session.intakes).forEach((timingsMap) => {
      Object.values(timingsMap).forEach((productsMap) => {
        Object.entries(productsMap).forEach(([productId, cantidad]) => {
          allIntakesList.push({ productId, cantidad });
        });
      });
    });
    return calculateNutrientTotals(allIntakesList);
  }, [session.intakes]);

  const playerNutrientsMap = useMemo(() => {
    const map = new Map();
    session.activeRosterIds.forEach((pId) => {
      const playerTimings = session.intakes[pId] || {};
      const intakesList = [];
      Object.values(playerTimings).forEach((productsMap) => {
        Object.entries(productsMap).forEach(([productId, cantidad]) => {
          intakesList.push({ productId, cantidad });
        });
      });
      map.set(pId, calculateNutrientTotals(intakesList));
    });
    return map;
  }, [session.intakes, session.activeRosterIds]);

  const handleExportExcel = () => {
    notifications.show({
      color: 'teal',
      title: 'Informe generado',
      message: 'Descargando informe detallado de hidratación intrapartido.',
    });
  };

  const handleSaveSession = () => {
    notifications.show({
      color: 'teal',
      title: 'Registro guardado',
      message: 'Se han guardado las tomas de hidratación y nutrición del partido con éxito.',
    });
    onClose();
  };

  // Título dinámico del modal
  const modalTitle = useMemo(() => {
    if (currentStep === 'alineacion') {
      return (
        <Group justify="space-between" align="center" w="100%" pr={{ base: 2, sm: 16 }} wrap="nowrap">
          <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
            <Icon3D name="plantilla" size={22} />
            <Box style={{ minWidth: 0 }}>
              <Text fw={700} fz={{ base: 'sm', sm: 'md' }} c="dark.6" truncate>
                Alineación y Convocatoria
              </Text>
              {session.matchInfo?.rival && (
                <Text fz="10px" c="dimmed" truncate>
                  {session.matchInfo.rival} · {session.matchInfo.lugar}
                </Text>
              )}
            </Box>
          </Group>
          <Group gap={4} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
            <Text size="8px" c="#16a34a">●</Text>
            <Text fz="xs" fw={700} c="dark.5">
              {session.starterIds.length}/11 Titulares
            </Text>
          </Group>
        </Group>
      );
    }

    if (currentStep === 'fases') {
      return (
        <Group justify="space-between" align="center" w="100%" pr={{ base: 2, sm: 16 }} wrap="nowrap">
          <Group gap="xs" align="center" wrap="nowrap">
            <Icon3D name={currentTiming.icon} size={22} />
            <Group gap={6} align="center" wrap="nowrap">
              <Text fw={700} fz={{ base: 'sm', sm: 'md' }} c="dark.6">
                {currentTiming.label}
              </Text>
              <Text fz="xs" c="dimmed" fw={500}>
                ({currentPhaseIndex + 1}/{INTRAPARTIDO_TIMINGS.length})
              </Text>
            </Group>
          </Group>

          <Button
            size="compact-xs"
            radius="xl"
            variant="light"
            color="dark"
            leftSection={<Icon3D name="document" size={13} />}
            onClick={() => setCurrentStep('resumen')}
          >
            Balance
          </Button>
        </Group>
      );
    }

    // Step 'resumen'
    return (
      <Group justify="space-between" align="center" w="100%" pr={{ base: 2, sm: 16 }} wrap="nowrap">
        <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
          <Icon3D name="document" size={22} />
          <Box style={{ minWidth: 0 }}>
            <Text fw={700} fz={{ base: 'sm', sm: 'md' }} c="dark.6" truncate>
              Balance Nutricional
            </Text>
            {session.matchInfo?.rival && (
              <Text fz="10px" c="dimmed" truncate>
                {session.matchInfo.rival} · {session.matchInfo.lugar}
              </Text>
            )}
          </Box>
        </Group>
        {team?.nombre && (
          <Text fz="xs" c="dimmed" truncate style={{ flexShrink: 0 }}>
            {team.nombre}
          </Text>
        )}
      </Group>
    );
  }, [currentStep, currentTiming, currentPhaseIndex, session.starterIds.length, session.matchInfo, team]);


  return (
    <ResponsiveModal
      opened={opened}
      onClose={onClose}
      title={modalTitle}
      size="1100px"
      padding={{ base: 'xs', sm: 'md' }}
      radius="xl"
      styles={{ body: { overflow: 'hidden' } }}
    >
      <Stack gap="xs" style={{ width: '100%', minWidth: 0, height: '100%' }}>

        {/* ============================================================= */}
        {/* PASO 1: CONVOCATORIA Y ONCE INICIAL                           */}
        {/* ============================================================= */}
        {currentStep === 'alineacion' && (
          <Stack gap="xs" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* Metadatos del encuentro (inputs y selects alineados con el sistema visual) */}
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }} spacing="xs">
              <TextInput
                placeholder="Rival..."
                variant="filled"
                radius="xl"
                size="xs"
                leftSection={<Icon3D name="soccer" size={16} />}
                value={session.matchInfo?.rival || ''}
                onChange={(e) => handleUpdateMatchInfo('rival', e.currentTarget.value)}
              />
              <Select
                placeholder="Competición"
                leftSection={<Icon3D name="trophy" size={16} />}
                data={COMPETITION_OPTIONS}
                value={session.matchInfo?.competicion || 'LaLiga EA Sports'}
                onChange={(val) => handleUpdateMatchInfo('competicion', val || '')}
                variant="filled"
                radius="xl"
                size="xs"
                allowDeselect={false}
                comboboxProps={{ zIndex: 2500, withinPortal: true }}
              />
              <Select
                placeholder="Lugar"
                leftSection={<Icon3D name="pin" size={16} />}
                data={LOCATION_OPTIONS}
                value={session.matchInfo?.lugar || 'Mestalla'}
                onChange={(val) => handleUpdateMatchInfo('lugar', val || '')}
                variant="filled"
                radius="xl"
                size="xs"
                allowDeselect={false}
                comboboxProps={{ zIndex: 2500, withinPortal: true }}
              />
              <DateInput
                placeholder="Fecha del partido"
                value={dateValue(session.matchInfo?.fecha)}
                onChange={(val) => handleUpdateMatchInfo('fecha', dateInputToIso(val))}
                valueFormat="DD/MM/YYYY"
                variant="filled"
                radius="xl"
                size="xs"
                leftSection={<Icon3D name="calendar" size={16} />}
                popoverProps={{ zIndex: 2500, withinPortal: true }}
                clearable
              />
            </SimpleGrid>

            {/* Buscador de jugadores y filtro por posición alineados */}
            <Group gap="xs" wrap="nowrap" w="100%">
              <TextInput
                placeholder="Buscar jugador..."
                size="xs"
                radius="xl"
                variant="filled"
                leftSection={<Icon3D name="search" size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                style={{ flex: 1, minWidth: 0 }}
              />
              <Select
                placeholder="Posición"
                leftSection={<Icon3D name="soccer" size={16} />}
                data={POSITION_FILTER_OPTIONS}
                value={positionFilter}
                onChange={(val) => setPositionFilter(val || 'todas')}
                variant="filled"
                radius="xl"
                size="xs"
                allowDeselect={false}
                style={{ flex: '0 0 160px' }}
                comboboxProps={{ zIndex: 2500, withinPortal: true }}
              />
            </Group>

            {/* Grid de jugadores interactivo */}
            <ScrollArea.Autosize mah={{ base: 'calc(100dvh - 310px)', sm: 380 }} type="auto">
              <Grid gutter="xs">
                {players
                  .filter((p) => {
                    if (positionFilter !== 'todas' && p.posicion !== positionFilter) return false;
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    const name = `${p.nombre || ''} ${p.apellidos || ''}`.toLowerCase();
                    return name.includes(q) || (p.posicion || '').toLowerCase().includes(q);
                  })
                  .map((player) => {
                    const pId = String(player.id);
                    const isStarter = starterSet.has(pId);
                    const isConvocado = activeRosterSet.has(pId);

                    let statusLabel = 'No convocado';
                    let statusColor = 'dimmed';
                    let statusBg = '#ffffff';
                    let statusBorder = '#e2e8f0';

                    if (isStarter) {
                      statusLabel = 'TITULAR';
                      statusColor = '#16a34a';
                      statusBg = '#f0fdf4';
                      statusBorder = '#86efac';
                    } else if (isConvocado) {
                      statusLabel = 'SUPLENTE';
                      statusColor = '#2563eb';
                      statusBg = '#eff6ff';
                      statusBorder = '#93c5fd';
                    }

                    return (
                      <Grid.Col span={{ base: 12, sm: 6 }} key={player.id}>
                        <Paper
                          p="xs"
                          radius="md"
                          onClick={() => handleTogglePlayerStatus(player.id)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: statusBg,
                            border: `1.5px solid ${statusBorder}`,
                            transition: 'all 120ms ease',
                            userSelect: 'none',
                          }}
                        >
                          <Group justify="space-between" align="center" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                              <Avatar
                                src={getPlayerAvatarUrl(player)}
                                size={36}
                                radius="xl"
                                color="initials"
                              >
                                {initials(`${player.nombre} ${player.apellidos || ''}`)}
                              </Avatar>
                              <Box style={{ minWidth: 0 }}>
                                <Text fz="xs" fw={600} c="dark.6" truncate>
                                  {player.nombre} {player.apellidos}
                                </Text>
                                <Text fz="10px" c="dimmed" truncate>
                                  {player.posicion || 'Sin posición'}
                                </Text>
                              </Box>
                            </Group>

                            <Group gap={6} wrap="nowrap">
                              <Text size="9px" c={statusColor}>●</Text>
                              <Text fz="11px" fw={700} c={statusColor}>
                                {statusLabel}
                              </Text>
                            </Group>
                          </Group>
                        </Paper>
                      </Grid.Col>
                    );
                  })}
              </Grid>
            </ScrollArea.Autosize>

            {/* Barra inferior: alineada con el formato de dos columnas de las fases */}
            <Divider mt="auto" />
            <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
              <Paper
                radius="xl"
                px="sm"
                style={{
                  flex: 1,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Text size="9px" c={session.starterIds.length === 11 ? 'teal.6' : 'orange.6'}>●</Text>
                <Text fz="xs" fw={700} c="dark.6">
                  {session.starterIds.length}/11 Titulares
                </Text>
              </Paper>

              <Button
                variant="filled"
                color="dark"
                size="sm"
                radius="xl"
                style={{ flex: 1, height: 36 }}
                rightSection={<IconArrowRight size={14} />}
                onClick={() => setCurrentStep('fases')}
                disabled={session.starterIds.length === 0}
              >
                Continuar
              </Button>
            </Group>
          </Stack>
        )}



        {/* ============================================================= */}
        {/* PASO 2: SEGUIMIENTO POR FASES DEL ENCUENTRO                   */}
        {/* ============================================================= */}
        {currentStep === 'fases' && (
          <Stack gap="xs" style={{ flex: 1 }}>
            {/* Barra de herramientas móvil y escritorio */}
            <Stack gap={6}>
              {/* Selector de grupo en móvil: a ancho completo para dedos */}
              <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                <SegmentedControl
                  value={groupFilter}
                  onChange={setGroupFilter}
                  data={[
                    { label: `Titulares (${session.starterIds.length})`, value: 'titulares' },
                    { label: `Suplentes (${session.activeRosterIds.length - session.starterIds.length})`, value: 'suplentes' },
                  ]}
                  radius="xl"
                  size="xs"
                  color="dark"
                  style={{ flex: 1 }}
                />

                {/* Menú de reparto colectivo */}
                <Menu shadow="md" width={220} position="bottom-end" radius="md" zIndex={2500} withinPortal>
                  <Menu.Target>
                    <Button
                      variant="light"
                      color="grape"
                      size="xs"
                      radius="xl"
                      leftSection={<IconBolt size={13} />}
                      rightSection={<IconChevronDown size={13} />}
                      px={10}
                    >
                      Repartir
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>
                      Reparto a {groupFilter === 'suplentes' ? 'suplentes' : 'titulares'} ({currentTiming.short})
                    </Menu.Label>
                    <Menu.Item onClick={() => handleBatchDistribute('agua-250')}>
                      +1 Agua 250ml
                    </Menu.Item>
                    <Menu.Item onClick={() => handleBatchDistribute('isotonico-250')}>
                      +1 Isotónico 250ml
                    </Menu.Item>
                    <Menu.Item onClick={() => handleBatchDistribute('gel-30')}>
                      +1 Gel 30g
                    </Menu.Item>
                    <Menu.Item onClick={() => handleBatchDistribute('platano-medio')}>
                      +1 Medio Plátano
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              {/* Filtro de búsqueda y posición alineados */}
              <Group gap="xs" wrap="nowrap" w="100%">
                <TextInput
                  placeholder="Filtrar por jugador..."
                  size="xs"
                  radius="xl"
                  variant="filled"
                  leftSection={<Icon3D name="search" size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <Select
                  placeholder="Posición"
                  leftSection={<Icon3D name="soccer" size={16} />}
                  data={POSITION_FILTER_SHORT_OPTIONS}
                  value={positionFilter}
                  onChange={(val) => setPositionFilter(val || 'todas')}
                  variant="filled"
                  radius="xl"
                  size="xs"
                  allowDeselect={false}
                  style={{ flex: '0 0 120px' }}
                  comboboxProps={{ zIndex: 2500, withinPortal: true }}
                />
              </Group>
            </Stack>

            {/* Lista directa y táctil de jugadores adaptada a móvil y escritorio */}
            <ScrollArea.Autosize mah={{ base: 'calc(100dvh - 215px)', sm: 500 }} type="auto">
              <Stack gap={8}>
                {currentPhasePlayers.length === 0 ? (
                  <Paper p="xl" radius="md" style={{ textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <Text fz="sm" c="dimmed">No hay jugadores en esta sección.</Text>
                  </Paper>
                ) : (
                  currentPhasePlayers.map((player) => {
                    const pId = String(player.id);
                    const phaseIntakes = session.intakes[pId]?.[currentTiming.id] || {};
                    const intakeEntries = Object.entries(phaseIntakes);

                    return (
                      <Paper
                        key={player.id}
                        p={{ base: 8, sm: 'sm' }}
                        radius="md"
                        style={{
                          border: '1px solid #f1f5f9',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        {/* Fila 1: Datos de jugador y consumos actuales */}
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                            <Avatar
                              src={getPlayerAvatarUrl(player)}
                              size={34}
                              radius="xl"
                              color="initials"
                            >
                              {initials(`${player.nombre} ${player.apellidos || ''}`)}
                            </Avatar>
                            <Box style={{ minWidth: 0 }}>
                              <Text fz="xs" fw={600} c="dark.6" truncate>
                                {player.nombre} {player.apellidos}
                              </Text>
                              <Text fz="10px" c="dimmed" truncate>
                                {player.posicion || 'Sin posición'}
                              </Text>
                            </Box>

                            {/* Botón táctil para hacer sustitución/cambio */}
                            {starterSet.has(pId) ? (
                              <Menu shadow="md" width={240} position="bottom-start" radius="md" zIndex={2500} withinPortal>
                                <Menu.Target>
                                  <Button
                                    size="compact-xs"
                                    radius="xl"
                                    variant="subtle"
                                    color="gray"
                                    leftSection={<IconArrowsExchange size={12} />}
                                    styles={{ label: { fontSize: 10, fontWeight: 600 } }}
                                    px={6}
                                  >
                                    Cambio
                                  </Button>
                                </Menu.Target>
                                <Menu.Dropdown style={{ maxHeight: 280, overflowY: 'auto' }}>
                                  <Menu.Label>Sustituir por (entra al campo):</Menu.Label>
                                  {availableSubstitutes.length === 0 ? (
                                    <Menu.Item disabled>No hay suplentes en banquillo</Menu.Item>
                                  ) : (
                                    availableSubstitutes.map((sub) => (
                                      <Menu.Item
                                        key={sub.id}
                                        leftSection={
                                          <Avatar src={getPlayerAvatarUrl(sub)} size={22} radius="xl" color="initials">
                                            {initials(`${sub.nombre} ${sub.apellidos || ''}`)}
                                          </Avatar>
                                        }
                                        onClick={() => handleSubstitute(player.id, sub.id)}
                                      >
                                        {sub.nombre} {sub.apellidos}
                                      </Menu.Item>
                                    ))
                                  )}
                                  <Menu.Divider />
                                  <Menu.Item
                                    color="red"
                                    onClick={() => handleDemoteToBench(player.id)}
                                  >
                                    Pasar a suplente
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            ) : (
                              <Menu shadow="md" width={240} position="bottom-start" radius="md" zIndex={2500} withinPortal>
                                <Menu.Target>
                                  <Button
                                    size="compact-xs"
                                    radius="xl"
                                    variant="subtle"
                                    color="blue"
                                    leftSection={<IconArrowsExchange size={12} />}
                                    styles={{ label: { fontSize: 10, fontWeight: 600 } }}
                                    px={6}
                                  >
                                    Entrar
                                  </Button>
                                </Menu.Target>
                                <Menu.Dropdown style={{ maxHeight: 280, overflowY: 'auto' }}>
                                  <Menu.Label>Entra al campo por (sale titular):</Menu.Label>
                                  {currentStartersList.length === 0 ? (
                                    <Menu.Item disabled>No hay titulares</Menu.Item>
                                  ) : (
                                    currentStartersList.map((starter) => (
                                      <Menu.Item
                                        key={starter.id}
                                        leftSection={
                                          <Avatar src={getPlayerAvatarUrl(starter)} size={22} radius="xl" color="initials">
                                            {initials(`${starter.nombre} ${starter.apellidos || ''}`)}
                                          </Avatar>
                                        }
                                        onClick={() => handleSubstitute(starter.id, player.id)}
                                      >
                                        {starter.nombre} {starter.apellidos}
                                      </Menu.Item>
                                    ))
                                  )}
                                  <Menu.Divider />
                                  <Menu.Item
                                    color="green"
                                    onClick={() => handlePromoteToStarter(player.id)}
                                  >
                                    Pasar a titular directamente
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            )}
                          </Group>

                          {/* Chips de tomas actuales en esta fase */}
                          <Box style={{ flexShrink: 0, textAlign: 'right' }}>
                            {intakeEntries.length === 0 ? (
                              <Text fz="11px" c="dimmed" style={{ fontStyle: 'italic' }}>
                                Sin tomas
                              </Text>
                            ) : (
                              <Group gap={4} justify="flex-end" wrap="wrap">
                                {intakeEntries.map(([prodId, qty]) => {
                                  const prod = PRODUCTS_MAP.get(prodId);
                                  if (!prod) return null;
                                  return (
                                    <Group
                                      key={prodId}
                                      gap={2}
                                      style={{
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 6,
                                        padding: '1px 5px',
                                      }}
                                    >
                                      <Text size="11px" fw={600} c="dark.5">
                                        {qty}x {prod.short}
                                      </Text>
                                      <ActionIcon
                                        size={16}
                                        variant="subtle"
                                        color="red"
                                        radius="xl"
                                        onClick={() => handleModifyProduct(player.id, prodId, -1)}
                                      >
                                        <IconMinus size={10} />
                                      </ActionIcon>
                                    </Group>
                                  );
                                })}
                              </Group>
                            )}
                          </Box>
                        </Group>

                        {/* Fila 2: Botonera táctil de 4 botones distribuidos para el pulgar */}
                        <Grid gutter={4} mt={6}>
                          <Grid.Col span={3}>
                            <Button
                              fullWidth
                              size="xs"
                              radius="md"
                              variant="light"
                              color="blue"
                              px={2}
                              styles={{ label: { fontSize: 11, fontWeight: 700 } }}
                              onClick={() => handleModifyProduct(player.id, 'agua-250', 1)}
                            >
                              + Agua
                            </Button>
                          </Grid.Col>

                          <Grid.Col span={3}>
                            <Button
                              fullWidth
                              size="xs"
                              radius="md"
                              variant="light"
                              color="orange"
                              px={2}
                              styles={{ label: { fontSize: 11, fontWeight: 700 } }}
                              onClick={() => handleModifyProduct(player.id, 'isotonico-250', 1)}
                            >
                              + Iso
                            </Button>
                          </Grid.Col>

                          <Grid.Col span={3}>
                            <Button
                              fullWidth
                              size="xs"
                              radius="md"
                              variant="light"
                              color="grape"
                              px={2}
                              styles={{ label: { fontSize: 11, fontWeight: 700 } }}
                              onClick={() => handleModifyProduct(player.id, 'gel-30', 1)}
                            >
                              + Gel
                            </Button>
                          </Grid.Col>

                          <Grid.Col span={3}>
                            <Menu shadow="md" width={220} position="bottom-end" radius="md" zIndex={2500} withinPortal>
                              <Menu.Target>
                                <Button
                                  fullWidth
                                  size="xs"
                                  radius="md"
                                  variant="default"
                                  px={2}
                                  styles={{ label: { fontSize: 11, fontWeight: 600 } }}
                                  leftSection={<IconPlus size={11} />}
                                >
                                  Más
                                </Button>
                              </Menu.Target>
                              <Menu.Dropdown style={{ maxHeight: 300, overflowY: 'auto' }}>
                                <Menu.Label>Bebidas</Menu.Label>
                                {INTRAPARTIDO_PRODUCTS.filter((p) => p.categoria === 'bebidas').map((prod) => (
                                  <Menu.Item
                                    key={prod.id}
                                    onClick={() => handleModifyProduct(player.id, prod.id, 1)}
                                  >
                                    + {prod.nombre}
                                  </Menu.Item>
                                ))}
                                <Menu.Divider />
                                <Menu.Label>Geles y Estimulantes</Menu.Label>
                                {INTRAPARTIDO_PRODUCTS.filter((p) => p.categoria === 'geles').map((prod) => (
                                  <Menu.Item
                                    key={prod.id}
                                    onClick={() => handleModifyProduct(player.id, prod.id, 1)}
                                  >
                                    + {prod.nombre}
                                  </Menu.Item>
                                ))}
                                <Menu.Divider />
                                <Menu.Label>Alimentos Sólidos</Menu.Label>
                                {INTRAPARTIDO_PRODUCTS.filter((p) => p.categoria === 'solidos').map((prod) => (
                                  <Menu.Item
                                    key={prod.id}
                                    onClick={() => handleModifyProduct(player.id, prod.id, 1)}
                                  >
                                    + {prod.nombre}
                                  </Menu.Item>
                                ))}
                              </Menu.Dropdown>
                            </Menu>
                          </Grid.Col>
                        </Grid>
                      </Paper>
                    );
                  })
                )}
              </Stack>
            </ScrollArea.Autosize>

            {/* Barra inferior: botones al 50% de ancho en móvil para acceso con pulgares */}
            <Divider mt="auto" />
            <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
              <Button
                variant="subtle"
                color="gray"
                size="sm"
                radius="xl"
                style={{ flex: 1 }}
                leftSection={<IconArrowLeft size={14} />}
                onClick={() => {
                  if (currentPhaseIndex > 0) {
                    setCurrentPhaseIndex((prev) => prev - 1);
                  } else {
                    setCurrentStep('alineacion');
                  }
                }}
              >
                {currentPhaseIndex > 0 ? 'Anterior' : 'Alineación'}
              </Button>

              {currentPhaseIndex < INTRAPARTIDO_TIMINGS.length - 1 ? (
                <Button
                  variant="filled"
                  color="dark"
                  size="sm"
                  radius="xl"
                  style={{ flex: 1 }}
                  rightSection={<IconArrowRight size={14} />}
                  onClick={() => setCurrentPhaseIndex((prev) => prev + 1)}
                >
                  {INTRAPARTIDO_TIMINGS[currentPhaseIndex + 1].short}
                </Button>
              ) : (
                <Button
                  variant="filled"
                  color="teal"
                  size="sm"
                  radius="xl"
                  style={{ flex: 1 }}
                  leftSection={<IconCheck size={14} />}
                  onClick={() => setCurrentStep('resumen')}
                >
                  Finalizar
                </Button>
              )}
            </Group>
          </Stack>
        )}

        {/* ============================================================= */}
        {/* PASO 3: INFORME FINAL Y BALANCE NUTRICIONAL                    */}
        {/* ============================================================= */}
        {currentStep === 'resumen' && (
          <Stack gap="xs" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
              <Text fz="xs" c="dimmed" truncate>
                Cómputo global y desglose por jugador.
              </Text>

              <Button
                variant="light"
                color="teal"
                size="xs"
                radius="xl"
                leftSection={<IconFileSpreadsheet size={15} />}
                onClick={handleExportExcel}
              >
                Excel
              </Button>
            </Group>

            {/* Tarjetas de totales del equipo */}
            <Paper p="xs" radius="md" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Grid gutter="xs" align="center">
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Group gap={6} wrap="nowrap">
                    <Box style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconDroplet size={16} color="#0284c7" />
                    </Box>
                    <Box>
                      <Text fz="10px" fw={500} c="dimmed">Volumen</Text>
                      <Text fz="xs" fw={700} c="dark.5">
                        {(teamNutrients.aguaMl / 1000).toFixed(1)} L
                      </Text>
                    </Box>
                  </Group>
                </Grid.Col>

                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Group gap={6} wrap="nowrap">
                    <Box style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconBolt size={16} color="#d97706" />
                    </Box>
                    <Box>
                      <Text fz="10px" fw={500} c="dimmed">Carbs</Text>
                      <Text fz="xs" fw={700} c="dark.5">
                        {Math.round(teamNutrients.carbsG)} g
                      </Text>
                    </Box>
                  </Group>
                </Grid.Col>

                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Group gap={6} wrap="nowrap">
                    <Box style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text fw={800} fz="11px" c="#7c3aed">Na</Text>
                    </Box>
                    <Box>
                      <Text fz="10px" fw={500} c="dimmed">Sodio</Text>
                      <Text fz="xs" fw={700} c="dark.5">
                        {Math.round(teamNutrients.sodioMg)} mg
                      </Text>
                    </Box>
                  </Group>
                </Grid.Col>

                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Group gap={6} wrap="nowrap">
                    <Box style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon3D name="fire" size={16} />
                    </Box>
                    <Box>
                      <Text fz="10px" fw={500} c="dimmed">Energía</Text>
                      <Text fz="xs" fw={700} c="dark.5">
                        {Math.round(teamNutrients.kcal)} kcal
                      </Text>
                    </Box>
                  </Group>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Tabla scrolleable de desglose por jugador (vertical y horizontal con cabecera fija) */}
            <ScrollArea.Autosize mah={{ base: 'calc(100dvh - 310px)', sm: 340 }} type="auto" offsetScrollbars>
              <Table verticalSpacing="xs" highlightOnHover striped miw={{ base: 560, sm: 700 }}>
                <Table.Thead bg="#f8fafc" style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <Table.Tr>
                    <Table.Th style={{ fontSize: 11, color: 'var(--mantine-color-gray-6)' }}>JUGADOR</Table.Th>
                    <Table.Th style={{ fontSize: 11, textAlign: 'center', color: 'var(--mantine-color-gray-6)' }}>ROL</Table.Th>
                    <Table.Th style={{ fontSize: 11, textAlign: 'right', color: 'var(--mantine-color-gray-6)' }}>LÍQUIDOS</Table.Th>
                    <Table.Th style={{ fontSize: 11, textAlign: 'right', color: 'var(--mantine-color-gray-6)' }}>CARBOHIDRATOS</Table.Th>
                    <Table.Th style={{ fontSize: 11, textAlign: 'right', color: 'var(--mantine-color-gray-6)' }}>SODIO</Table.Th>
                    <Table.Th style={{ fontSize: 11, textAlign: 'right', color: 'var(--mantine-color-gray-6)' }}>CALORÍAS</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {session.activeRosterIds.map((pId) => {
                    const player = allPlayersMap.get(pId);
                    const isStarter = starterSet.has(pId);
                    const totals = playerNutrientsMap.get(pId) || { aguaMl: 0, carbsG: 0, sodioMg: 0, kcal: 0 };
                    if (!player) return null;

                    return (
                      <Table.Tr key={pId}>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Avatar src={getPlayerAvatarUrl(player)} size={28} radius="xl" color="initials">
                              {initials(`${player.nombre} ${player.apellidos || ''}`)}
                            </Avatar>
                            <Text fz="xs" fw={600} c="dark.6" truncate>
                              {player.nombre} {player.apellidos}
                            </Text>
                          </Group>
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'center' }}>
                          <Group gap={4} justify="center" align="center" wrap="nowrap">
                            <Text size="8px" c={isStarter ? '#16a34a' : '#2563eb'}>●</Text>
                            <Text fz="11px" fw={500} c="dark.5">
                              {isStarter ? 'Titular' : 'Suplente'}
                            </Text>
                          </Group>
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text fz="xs" fw={700} c={totals.aguaMl > 0 ? '#0284c7' : 'dimmed'}>
                            {totals.aguaMl} ml
                          </Text>
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text fz="xs" fw={700} c={totals.carbsG > 0 ? '#d97706' : 'dimmed'}>
                            {totals.carbsG.toFixed(1)} g
                          </Text>
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text fz="xs" fw={600} c="dark.5">
                            {Math.round(totals.sodioMg)} mg
                          </Text>
                        </Table.Td>

                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text fz="xs" fw={700} c="dark.6">
                            {Math.round(totals.kcal)} kcal
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea.Autosize>


            {/* Barra inferior */}
            <Divider mt="auto" />
            <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
              <Button
                variant="subtle"
                color="gray"
                size="sm"
                radius="xl"
                style={{ flex: 1 }}
                leftSection={<IconArrowLeft size={14} />}
                onClick={() => setCurrentStep('fases')}
              >
                Volver
              </Button>

              <Button
                variant="filled"
                color="dark"
                size="sm"
                radius="xl"
                style={{ flex: 1 }}
                leftSection={<IconCheck size={14} />}
                onClick={handleSaveSession}
              >
                Guardar
              </Button>
            </Group>
          </Stack>
        )}

      </Stack>
    </ResponsiveModal>
  );
}
