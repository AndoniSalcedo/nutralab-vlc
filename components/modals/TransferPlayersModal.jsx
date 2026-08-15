import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Group, Text, Button, Select, Radio, Stack, Checkbox, Avatar, Box, ScrollArea } from '@mantine/core';
import { IconExchange } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getTeams } from '@/services/team';
import { transferPlayers } from '@/services/player';
import { initials } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function TransferPlayersModal({ opened, onClose, team, players = [], initialSelectedIds = [] }) {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [targetTeamId, setTargetTeamId] = useState(null);
  const [action, setAction] = useState('move');
  const [selectedIds, setSelectedIds] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (opened) {
      setSelectedIds(initialSelectedIds);
      setTargetTeamId(null);
      setAction('move');
      fetchTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, initialSelectedIds]);

  const fetchTeams = async () => {
    try {
      const allTeams = await getTeams();
      setTeams(allTeams.filter(t => t.id !== team?.id));
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const teamOptions = useMemo(() => {
    return teams.map(t => ({ value: String(t.id), label: `${t.nombre} ${t.temporada ? `(${t.temporada})` : ''}` }));
  }, [teams]);

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      notifications.show({ color: 'red', title: 'Error', message: 'Debes seleccionar al menos un jugador.' });
      return;
    }
    if (!targetTeamId) {
      notifications.show({ color: 'red', title: 'Error', message: 'Debes seleccionar un equipo de destino.' });
      return;
    }

    setLoading(true);
    try {
      await transferPlayers({ playerIds: selectedIds, targetTeamId, action });
      
      notifications.show({
        color: 'green',
        title: 'Éxito',
        message: action === 'move' 
          ? 'Jugadores movidos correctamente. Es posible que debas recargar la página para ver los cambios actualizados.' 
          : 'Jugadores copiados correctamente.',
      });
      
      onClose();
      router.refresh();
    } catch (e) {
      notifications.show({ color: 'red', title: 'Error al transferir', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === players.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(players.map(p => p.id));
    }
  };

  const togglePlayer = (id) => {
    setSelectedIds(current => 
      current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconExchange size={20} style={{ color: 'var(--mantine-color-blue-6)' }} />
          <Text fw={700}>Transferir jugadores</Text>
        </Group>
      }
      size="lg"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Stack gap="md">
        <Radio.Group
          name="transferAction"
          label="Acción a realizar"
          description="Elige si deseas mover los jugadores o hacer una copia en el equipo destino."
          value={action}
          onChange={setAction}
          withAsterisk
        >
          <Group mt="xs">
            <Radio value="move" label="Mover (elimina del equipo actual)" />
            <Radio value="copy" label="Copiar (mantiene en este equipo)" />
          </Group>
        </Radio.Group>

        <Select
          label="Equipo de destino"
          placeholder="Selecciona un equipo..."
          data={teamOptions}
          value={targetTeamId}
          onChange={setTargetTeamId}
          searchable
          withAsterisk
          nothingFoundMessage="No se encontraron otros equipos"
        />

        <Box>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>Jugadores seleccionados ({selectedIds.length})</Text>
            {players.length > 1 && (
              <Button variant="subtle" size="xs" onClick={toggleSelectAll}>
                {selectedIds.length === players.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </Button>
            )}
          </Group>
          
          <ScrollArea h={250} offsetScrollbars type="hover" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }}>
            <Stack gap={0}>
              {players.map(player => (
                <Box 
                  key={player.id} 
                  onClick={() => togglePlayer(player.id)}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--mantine-color-gray-2)',
                    backgroundColor: selectedIds.includes(player.id) ? 'var(--mantine-color-blue-0)' : 'transparent'
                  }}
                >
                  <Group wrap="nowrap">
                    <Checkbox 
                      checked={selectedIds.includes(player.id)} 
                      onChange={() => {}} 
                      tabIndex={-1}
                      style={{ pointerEvents: 'none' }}
                    />
                    <Avatar
                      src={player.avatar_url || (player.avatar_size ? `/api/players/avatar?id=${player.id}` : undefined)}
                      size={32}
                      radius="xl"
                      color="initials"
                    >
                      {initials(`${player.nombre} ${player.apellidos || ''}`)}
                    </Avatar>

                    <Box>
                      <Text size="sm" fw={500}>{player.nombre} {player.apellidos}</Text>
                      <Text size="xs" c="dimmed">{player.posicion || 'Sin posición'}</Text>
                    </Box>
                  </Group>
                </Box>
              ))}
              {players.length === 0 && (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  No hay jugadores en este equipo.
                </Text>
              )}
            </Stack>
          </ScrollArea>
        </Box>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            loading={loading} 
            disabled={selectedIds.length === 0 || !targetTeamId}
            color={action === 'move' ? 'blue' : 'teal'}
          >
            {action === 'move' ? 'Mover' : 'Copiar'} jugadores
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
