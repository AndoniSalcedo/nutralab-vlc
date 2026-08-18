'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Stack, 
  Select, 
  Button, 
  Group, 
  Text, 
  Paper, 
  Radio, 
  ThemeIcon, 
  Loader, 
  Center,
  Box
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFolderShare, IconArrowsExchange, IconClipboardList, IconShield } from '@tabler/icons-react';
import { getTeams } from '@/services/team';
import { NUTRITION_DAY_TYPES } from '@/lib/calculations';

export default function ProtocolTransferModal({ 
  opened, 
  onClose, 
  protocol, 
  currentTeamId, 
  currentTeamName, 
  currentDayTypes = [],
  onTransferred 
}) {
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  
  const [action, setAction] = useState('copy'); // 'copy' | 'move'
  const [targetTeamId, setTargetTeamId] = useState('');
  const [targetDayTypeKey, setTargetDayTypeKey] = useState('');

  // Fetch user's teams on open
  useEffect(() => {
    if (opened) {
      setTeamsLoading(true);
      getTeams()
        .then((teamList) => {
          const others = (teamList || []).filter((t) => String(t.id) !== String(currentTeamId));
          setTeams(others);
          if (others.length > 0) {
            setTargetTeamId(String(others[0].id));
          } else {
            setTargetTeamId('');
          }
        })
        .catch((err) => {
          notifications.show({
            color: 'red',
            title: 'Error al cargar equipos',
            message: err.message || 'No se pudieron recuperar los equipos',
          });
        })
        .finally(() => {
          setTeamsLoading(false);
        });
    }
  }, [opened, currentTeamId]);

  // When targetTeamId or protocol changes, auto-select appropriate target day type
  useEffect(() => {
    if (!targetTeamId) {
      setTargetDayTypeKey('');
      return;
    }

    const selectedTeam = teams.find((t) => String(t.id) === String(targetTeamId));
    const targetDayTypes = selectedTeam?.configuracion_nutricional?.dayTypes || NUTRITION_DAY_TYPES;

    if (targetDayTypes.length > 0) {
      // Try to find matching dayTypeKey
      const match = targetDayTypes.find((d) => d.key === protocol?.dayTypeKey);
      if (match) {
        setTargetDayTypeKey(match.key);
      } else {
        setTargetDayTypeKey(targetDayTypes[0].key);
      }
    } else {
      setTargetDayTypeKey('');
    }
  }, [targetTeamId, protocol, teams]);

  const selectedTargetTeam = teams.find((t) => String(t.id) === String(targetTeamId));
  const targetDayTypes = selectedTargetTeam?.configuracion_nutricional?.dayTypes || NUTRITION_DAY_TYPES;

  const currentDayTypeObj = currentDayTypes.find((d) => d.key === protocol?.dayTypeKey);

  const handleSubmit = async () => {
    if (!targetTeamId || !targetDayTypeKey || !protocol) return;

    setLoading(true);
    try {
      const res = await fetch('/api/teams/protocols/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          sourceTeamId: currentTeamId,
          targetTeamId,
          protocol,
          targetDayTypeKey
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al transferir el protocolo');

      const targetTeamName = selectedTargetTeam?.nombre || 'Equipo destino';

      notifications.show({
        color: 'green',
        title: action === 'copy' ? 'Protocolo copiado' : 'Protocolo movido',
        message: `El protocolo "${protocol.name}" ha sido ${action === 'copy' ? 'copiado' : 'movido'} a ${targetTeamName}.`,
      });

      if (onTransferred) {
        onTransferred({
          action,
          protocol,
          targetTeamId,
          targetDayTypeKey,
          targetProtocol: data.targetProtocol,
        });
      }

      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error en la operación',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="blue" variant="light" radius="xl" size="md">
            <IconFolderShare size={18} />
          </ThemeIcon>
          <Text fw={700} size="md">Copiar / Mover Protocolo a Otro Equipo</Text>
        </Group>
      }
      size="md"
      radius="md"
    >
      {teamsLoading ? (
        <Center py="xl">
          <Loader size="sm" color="blue" />
        </Center>
      ) : teams.length === 0 ? (
        <Stack py="md" align="center" gap="sm">
          <ThemeIcon color="gray" variant="light" size="xl" radius="xl">
            <IconShield size={28} />
          </ThemeIcon>
          <Text size="sm" fw={600} c="dark.3" ta="center">
            No tienes otros equipos disponibles
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            Crea otro equipo en el sistema para poder transferir o copiar protocolos entre plantillas.
          </Text>
          <Button variant="default" onClick={onClose} radius="xl" mt="xs">
            Cerrar
          </Button>
        </Stack>
      ) : (
        <Stack gap="md" py="xs">
          {/* Ficha resumen del protocolo actual */}
          <Paper p="sm" radius="md" bg="gray.0" withBorder>
            <Group justify="space-between" align="center">
              <Box style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Protocolo a transferir</Text>
                <Text size="sm" fw={700} c="dark.4">{protocol?.name}</Text>
                <Text size="xs" c="dimmed">
                  {currentTeamName} · Tipo de día: {currentDayTypeObj?.label || protocol?.dayTypeKey}
                </Text>
              </Box>
              <ThemeIcon color="blue" variant="light" size="lg" radius="md">
                <IconClipboardList size={20} />
              </ThemeIcon>
            </Group>
          </Paper>

          {/* Selector de Acción */}
          <Radio.Group
            value={action}
            onChange={setAction}
            label="Tipo de operación"
            description="Elige si deseas duplicar o trasladar el protocolo"
          >
            <Stack gap="xs" mt="xs">
              <Radio
                value="copy"
                label={
                  <Box>
                    <Text size="sm" fw={600}>Copiar protocolo</Text>
                    <Text size="xs" c="dimmed">Crea un duplicado en el equipo destino manteniendo este intacto.</Text>
                  </Box>
                }
              />
              <Radio
                value="move"
                label={
                  <Box>
                    <Text size="sm" fw={600}>Mover protocolo</Text>
                    <Text size="xs" c="dimmed">Traslada el protocolo al nuevo equipo y lo elimina del equipo actual.</Text>
                  </Box>
                }
              />
            </Stack>
          </Radio.Group>

          {/* Selección de Equipo Destino */}
          <Select
            label="Equipo de destino"
            placeholder="Selecciona equipo..."
            data={teams.map((t) => ({
              value: String(t.id),
              label: `${t.nombre}${t.temporada ? ` (${t.temporada})` : ''}`,
            }))}
            value={targetTeamId}
            onChange={(val) => setTargetTeamId(val || '')}
            required
            allowDeselect={false}
            size="sm"
            radius="md"
          />

          {/* Selección de Tipo de Día de Destino */}
          <Select
            label="Tipo de día en equipo destino"
            placeholder="Selecciona tipo de día..."
            data={targetDayTypes.map((d) => ({
              value: d.key,
              label: d.label || d.key,
            }))}
            value={targetDayTypeKey}
            onChange={(val) => setTargetDayTypeKey(val || '')}
            required
            allowDeselect={false}
            size="sm"
            radius="md"
          />

          <Group justify="flex-end" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
            <Button variant="default" onClick={onClose} radius="xl" disabled={loading}>
              Cancelar
            </Button>
            <Button
              color={action === 'move' ? 'orange' : 'blue'}
              onClick={handleSubmit}
              loading={loading}
              radius="xl"
              leftSection={action === 'move' ? <IconArrowsExchange size={16} /> : <IconFolderShare size={16} />}
              disabled={!targetTeamId || !targetDayTypeKey}
            >
              {action === 'move' ? 'Mover Protocolo' : 'Copiar Protocolo'}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
