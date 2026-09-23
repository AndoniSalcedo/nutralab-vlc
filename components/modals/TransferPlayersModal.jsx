'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Divider,
  Grid,
  Group,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import Icon3D from '@/components/Icon3D';
import { IconSearch } from '@/components/icons3d';
import ResponsiveModal from './ResponsiveModal';
import { notifications } from '@mantine/notifications';
import { getTeams } from '@/actions/teamActions';
import { transferPlayers } from '@/actions/playerActions';
import { initials, getPlayerAvatarUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function TransferPlayersModal({
  opened,
  onClose,
  team,
  players = [],
  initialSelectedIds = [],
}) {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [targetTeamId, setTargetTeamId] = useState(null);
  const [action, setAction] = useState('move');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const fetchTeams = async () => {
    try {
      const allTeams = await getTeams();
      setTeams(allTeams.filter((t) => t.id !== team?.id));
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    if (opened) {
      setSelectedIds(initialSelectedIds);
      setTargetTeamId(null);
      setAction('move');
      setSearchQuery('');
      fetchTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, initialSelectedIds]);

  const teamOptions = useMemo(() => {
    return teams.map((t) => ({
      value: String(t.id),
      label: `${t.nombre} ${t.temporada ? `(${t.temporada})` : ''}`,
    }));
  }, [teams]);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const q = searchQuery.toLowerCase();
    return players.filter((p) => {
      const name = `${p.nombre || ''} ${p.apellidos || ''}`.toLowerCase();
      return name.includes(q) || (p.posicion || '').toLowerCase().includes(q);
    });
  }, [players, searchQuery]);

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: 'Debes seleccionar al menos un jugador.',
      });
      return;
    }
    if (!targetTeamId) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: 'Debes seleccionar un equipo de destino.',
      });
      return;
    }

    setLoading(true);
    try {
      await transferPlayers({ playerIds: selectedIds, targetTeamId, action });

      notifications.show({
        color: 'green',
        title: 'Operación completada',
        message:
          action === 'move'
            ? 'Jugadores movidos correctamente.'
            : 'Jugadores copiados correctamente.',
      });

      onClose();
      router.refresh();
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Error al transferir',
        message: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === players.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(players.map((p) => p.id));
    }
  };

  const togglePlayer = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const modalTitle = (
    <Group justify="space-between" align="center" w="100%" pr={{ base: 2, sm: 16 }} wrap="nowrap">
      <Group gap="xs" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
        <Icon3D name="refresh" size={22} />
        <Text fw={700} fz={{ base: 'sm', sm: 'md' }} c="dark.6" truncate>
          Transferir o Copiar
        </Text>
      </Group>
      <Group gap={4} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
        <Text size="8px" c={selectedIds.length > 0 ? '#16a34a' : 'dimmed'}>●</Text>
        <Text fz="xs" fw={700} c="dark.5">
          {selectedIds.length} seleccionados
        </Text>
      </Group>
    </Group>
  );

  return (
    <ResponsiveModal
      opened={opened}
      onClose={onClose}
      title={modalTitle}
      size="lg"
      padding={{ base: 'xs', sm: 'md' }}
      radius="xl"
    >
      <Stack gap="xs" style={{ width: '100%', minWidth: 0, height: '100%' }}>
        {/* Selector de tipo de acción (Mover vs Copiar) */}
        <SegmentedControl
          value={action}
          onChange={setAction}
          data={[
            { value: 'move', label: 'Mover (elimina de este equipo)' },
            { value: 'copy', label: 'Copiar (mantiene en este equipo)' },
          ]}
          fullWidth
          radius="xl"
          size="xs"
          color="dark"
        />

        {/* Selección del equipo destino */}
        <Select
          label="Equipo de destino"
          placeholder="Selecciona un equipo de destino..."
          data={teamOptions}
          value={targetTeamId}
          onChange={setTargetTeamId}
          searchable
          radius="md"
          size="sm"
          nothingFoundMessage="No se encontraron otros equipos"
          required
        />

        {/* Barra de búsqueda y selección de jugadores */}
        <Group justify="space-between" align="center" wrap="nowrap">
          <TextInput
            placeholder="Filtrar jugadores..."
            size="xs"
            radius="xl"
            leftSection={<IconSearch size={13} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          {players.length > 0 && (
            <Button
              variant="subtle"
              size="compact-xs"
              color="dark"
              onClick={toggleSelectAll}
            >
              {selectedIds.length === players.length ? 'Deseleccionar todos' : 'Todos'}
            </Button>
          )}
        </Group>

        {/* Grid de tarjetas directas de jugadores sin caja contenedora extra */}
        <ScrollArea.Autosize mah={{ base: 'calc(100dvh - 310px)', sm: 340 }} type="auto">
          <Grid gutter={6}>
            {filteredPlayers.map((player) => {
              const isSelected = selectedIds.includes(player.id);
              const activeBorder = action === 'move' ? '#93c5fd' : '#86efac';
              const activeBg = action === 'move' ? '#eff6ff' : '#f0fdf4';

              return (
                <Grid.Col span={{ base: 12, sm: 6 }} key={player.id}>
                  <Paper
                    p="xs"
                    radius="md"
                    onClick={() => togglePlayer(player.id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? activeBg : '#ffffff',
                      border: isSelected ? `1.5px solid ${activeBorder}` : '1px solid #e2e8f0',
                      transition: 'all 120ms ease',
                      userSelect: 'none',
                    }}
                  >
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Avatar
                          src={getPlayerAvatarUrl(player)}
                          size={32}
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

                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}}
                        tabIndex={-1}
                        color={action === 'move' ? 'blue' : 'teal'}
                        style={{ pointerEvents: 'none' }}
                      />
                    </Group>
                  </Paper>
                </Grid.Col>
              );
            })}

            {filteredPlayers.length === 0 && (
              <Grid.Col span={12}>
                <Text size="xs" c="dimmed" ta="center" py="md">
                  No se encontraron jugadores.
                </Text>
              </Grid.Col>
            )}
          </Grid>
        </ScrollArea.Autosize>


        {/* Barra inferior consistente */}
        <Divider mt="auto" />
        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            radius="xl"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="filled"
            color="dark"
            size="sm"
            radius="xl"
            style={{ flex: 1 }}
            onClick={handleSubmit}
            loading={loading}
            disabled={selectedIds.length === 0 || !targetTeamId}
          >
            {action === 'move' ? 'Mover' : 'Copiar'} {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </Button>
        </Group>
      </Stack>
    </ResponsiveModal>
  );
}

