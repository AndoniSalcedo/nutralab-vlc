'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Modal, 
  Stack, 
  Select, 
  Button, 
  Group, 
  Text, 
  Paper, 
  Checkbox, 
  ThemeIcon, 
  Loader, 
  Center,
  Box,
  ScrollArea,
  Table
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconShield } from '@tabler/icons-react';
import { getTeams } from '@/services/team';

const EMPTY_DAY_TYPES = [];

export default function ProtocolImportModal({ 
  opened, 
  onClose, 
  currentTeamId, 
  currentDayTypes = EMPTY_DAY_TYPES,
  onImported 
}) {
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [sourceTeamId, setSourceTeamId] = useState('');
  
  // Selected protocol IDs: { [protocolId]: boolean }
  const [selectedProtocolIds, setSelectedProtocolIds] = useState({});
  // Target day type mappings: { [protocolId]: targetDayTypeKey }
  const [dayTypeMappings, setDayTypeMappings] = useState({});

  useEffect(() => {
    if (opened) {
      setTeamsLoading(true);
      getTeams()
        .then((teamList) => {
          const others = (teamList || []).filter((t) => String(t.id) !== String(currentTeamId));
          setTeams(others);
          if (others.length > 0) {
            setSourceTeamId(String(others[0].id));
          } else {
            setSourceTeamId('');
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

  const sourceTeam = teams.find((t) => String(t.id) === String(sourceTeamId));
  const sourceProtocols = useMemo(
    () => sourceTeam?.configuracion_nutricional?.protocols || [],
    [sourceTeam]
  );
  const sourceDayTypes = useMemo(
    () => sourceTeam?.configuracion_nutricional?.dayTypes || [],
    [sourceTeam]
  );

  // Reset mappings and selections when sourceTeamId changes
  useEffect(() => {
    if (!sourceTeamId || sourceProtocols.length === 0) {
      setSelectedProtocolIds({});
      setDayTypeMappings({});
      return;
    }

    const initialSelections = {};
    const initialMappings = {};

    sourceProtocols.forEach((prot) => {
      // Auto-select all by default
      initialSelections[prot.id] = true;

      // Auto-match day type key if exists in current team, else fallback to first currentDayType
      const match = currentDayTypes.find((d) => d.key === prot.dayTypeKey);
      if (match) {
        initialMappings[prot.id] = match.key;
      } else if (currentDayTypes.length > 0) {
        initialMappings[prot.id] = currentDayTypes[0].key;
      } else {
        initialMappings[prot.id] = prot.dayTypeKey;
      }
    });

    setSelectedProtocolIds(initialSelections);
    setDayTypeMappings(initialMappings);
  }, [sourceTeamId, currentDayTypes, sourceProtocols]);

  const toggleSelectAll = () => {
    const allSelected = sourceProtocols.length > 0 && sourceProtocols.every((p) => selectedProtocolIds[p.id]);
    const nextSelections = {};
    sourceProtocols.forEach((p) => {
      nextSelections[p.id] = !allSelected;
    });
    setSelectedProtocolIds(nextSelections);
  };

  const selectedCount = Object.values(selectedProtocolIds).filter(Boolean).length;

  const handleImport = async () => {
    const protocolsToImport = sourceProtocols
      .filter((p) => selectedProtocolIds[p.id])
      .map((p) => ({
        id: p.id,
        targetDayTypeKey: dayTypeMappings[p.id] || p.dayTypeKey,
        name: p.name,
      }));

    if (protocolsToImport.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/teams/protocols/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_import',
          sourceTeamId,
          targetTeamId: currentTeamId,
          protocols: protocolsToImport,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al importar protocolos');

      notifications.show({
        color: 'green',
        title: 'Protocolos importados',
        message: `Se han importado exitosamente ${data.importedCount} protocolo(s) desde ${sourceTeam?.nombre}.`,
      });

      if (onImported && data.imported) {
        onImported(data.imported);
      }

      onClose();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al importar',
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
            <IconDownload size={18} />
          </ThemeIcon>
          <Text fw={700} size="md">Importar Protocolos de Otro Equipo</Text>
        </Group>
      }
      size="lg"
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
            Para importar protocolos se requiere tener al menos otro equipo registrado.
          </Text>
          <Button variant="default" onClick={onClose} radius="xl" mt="xs">
            Cerrar
          </Button>
        </Stack>
      ) : (
        <Stack gap="md" py="xs">
          <Select
            label="Equipo de origen"
            description="Selecciona el equipo desde el cual deseas copiar protocolos"
            placeholder="Selecciona equipo..."
            data={teams.map((t) => ({
              value: String(t.id),
              label: `${t.nombre}${t.temporada ? ` (${t.temporada})` : ''}`,
            }))}
            value={sourceTeamId}
            onChange={(val) => setSourceTeamId(val || '')}
            required
            allowDeselect={false}
            size="sm"
            radius="md"
          />

          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="xs" fw={700} c="dark.3" tt="uppercase">
                Protocolos disponibles ({sourceProtocols.length})
              </Text>
              {sourceProtocols.length > 0 && (
                <Button variant="subtle" size="compact-xs" color="blue" onClick={toggleSelectAll}>
                  {sourceProtocols.every((p) => selectedProtocolIds[p.id]) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Button>
              )}
            </Group>

            {sourceProtocols.length === 0 ? (
              <Paper p="md" radius="md" bg="gray.0" withBorder>
                <Text size="sm" c="dimmed" ta="center">
                  El equipo seleccionado no tiene protocolos configurados.
                </Text>
              </Paper>
            ) : (
              <ScrollArea.Autosize mah={320} offsetScrollbars>
                <Table verticalSpacing="xs" horizontalSpacing="sm" withTableBorder withColumnBorders={false} striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={40}>
                        <Checkbox
                          checked={sourceProtocols.length > 0 && sourceProtocols.every((p) => selectedProtocolIds[p.id])}
                          indeterminate={sourceProtocols.some((p) => selectedProtocolIds[p.id]) && !sourceProtocols.every((p) => selectedProtocolIds[p.id])}
                          onChange={toggleSelectAll}
                          size="xs"
                        />
                      </Table.Th>
                      <Table.Th>Protocolo</Table.Th>
                      <Table.Th style={{ minWidth: 160 }}>Asignar a Tipo de Día</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {sourceProtocols.map((p) => {
                      const isSelected = !!selectedProtocolIds[p.id];
                      const origDayType = sourceDayTypes.find((d) => d.key === p.dayTypeKey);

                      return (
                        <Table.Tr key={p.id} style={{ opacity: isSelected ? 1 : 0.6 }}>
                          <Table.Td>
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => {
                                const val = e.currentTarget.checked;
                                setSelectedProtocolIds((prev) => ({ ...prev, [p.id]: val }));
                              }}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={600} c="dark.4">{p.name}</Text>
                            <Text size="xs" c="dimmed">
                              Origen: {origDayType?.label || p.dayTypeKey} · {p.timeline?.length || 0} pasos
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Select
                              data={currentDayTypes.map((d) => ({
                                value: d.key,
                                label: d.label || d.key,
                              }))}
                              value={dayTypeMappings[p.id] || (currentDayTypes[0]?.key || '')}
                              onChange={(val) => {
                                setDayTypeMappings((prev) => ({ ...prev, [p.id]: val || '' }));
                              }}
                              disabled={!isSelected}
                              size="xs"
                              radius="md"
                              allowDeselect={false}
                            />
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea.Autosize>
            )}
          </Box>

          <Group justify="flex-end" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
            <Button variant="default" onClick={onClose} radius="xl" disabled={loading}>
              Cancelar
            </Button>
            <Button
              color="blue"
              onClick={handleImport}
              loading={loading}
              radius="xl"
              leftSection={<IconDownload size={16} />}
              disabled={selectedCount === 0}
            >
              Importar {selectedCount > 0 ? `(${selectedCount}) Protocolos` : ''}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
