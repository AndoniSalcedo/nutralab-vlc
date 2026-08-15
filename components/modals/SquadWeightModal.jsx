'use client';

import React, { useState, useMemo } from 'react';
import {
  Modal,
  Group,
  Text,
  Stack,
  TextInput,
  Button,
  ScrollArea,
  Avatar,
  Box,
  Divider,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconScale, IconCalendar, IconSearch, IconCheck } from '@tabler/icons-react';
import { savePesaje } from '@/services/pesaje';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { initials } from '@/lib/utils';

export default function SquadWeightModal({ opened, onClose, players = [] }) {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [weights, setWeights] = useState({});
  const [saving, setSaving] = useState(false);

  // Filter players based on search query
  const filteredPlayers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return players;
    return players.filter((p) => {
      const fullName = `${p.nombre || ''} ${p.apellidos || ''}`.toLowerCase();
      return fullName.includes(q);
    });
  }, [players, search]);

  const dateInputToIso = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  async function handleSave() {
    const entries = Object.entries(weights)
      .map(([playerId, val]) => ({ playerId, value: val.trim() }))
      .filter((e) => e.value !== '');

    if (entries.length === 0) {
      notifications.show({
        color: 'yellow',
        title: 'Atención',
        message: 'No has introducido el peso de ningún jugador.',
      });
      return;
    }

    // Validate that entered weights are numbers
    for (const entry of entries) {
      const val = Number(entry.value);
      if (isNaN(val) || val <= 0) {
        const player = players.find((p) => String(p.id) === String(entry.playerId));
        const name = player ? `${player.nombre} ${player.apellidos || ''}` : 'Jugador';
        notifications.show({
          color: 'red',
          title: 'Error de validación',
          message: `El peso introducido para ${name} no es un número válido.`,
        });
        return;
      }
    }

    setSaving(true);
    const dateStr = dateInputToIso(date);

    try {
      const promises = entries.map((entry) =>
        savePesaje({
          jugador_id: entry.playerId,
          fecha: dateStr,
          peso_kg: parseFloat(entry.value),
        })
      );

      await Promise.all(promises);

      notifications.show({
        color: 'green',
        title: 'Pesos registrados',
        message: `Se han guardado las métricas de peso para ${entries.length} jugadores.`,
      });

      // Reset weights inputs and search
      setWeights({});
      setSearch('');
      onClose();
      router.refresh();
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Error al guardar pesos',
        message: err.message || 'Ocurrió un error inesperado al registrar los pesos.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconScale size={20} style={{ color: 'var(--mantine-color-orange-6)' }} />
          <Text fw={800} size="lg">Registrar peso del equipo</Text>
        </Group>
      }
      size="md"
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
    >
      <Stack gap="md">
        <DateInput
          label="Fecha de medición"
          required
          value={date}
          onChange={(value) => value && setDate(value)}
          placeholder="Selecciona la fecha"
          valueFormat="DD/MM/YYYY"
          leftSection={<IconCalendar size={16} />}
          radius="md"
        />

        <TextInput
          placeholder="Buscar jugador..."
          leftSection={<IconSearch size={16} style={{ opacity: 0.7 }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          radius="md"
          variant="filled"
        />

        <Divider label="Lista de Jugadores" labelPosition="center" />

        <ScrollArea.Autosize maxHeight="45vh" offsetScrollbars>
          <Stack gap="xs" pr="xs">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => {
                const fullName = `${player.nombre} ${player.apellidos || ''}`.trim();
                const pesoActual = player.peso_kg;
                return (
                  <Group key={player.id} justify="space-between" align="center" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                      <Avatar
                        src={player.avatar_url || (player.avatar_size ? `/api/players/avatar?id=${player.id}` : undefined)}
                        size={36}
                        radius="xl"
                        color="initials"
                      >
                        {initials(fullName)}
                      </Avatar>

                      <Box style={{ minWidth: 0 }}>
                        <Text size="sm" fw={600} truncate c="dark.4">
                          {fullName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {pesoActual ? `Último: ${pesoActual} kg` : 'Sin peso registrado'}
                        </Text>
                      </Box>
                    </Group>

                    <TextInput
                      placeholder="kg"
                      type="number"
                      step="any"
                      min={0}
                      w={90}
                      radius="md"
                      value={weights[player.id] ?? ''}
                      onChange={(e) => setWeights({ ...weights, [player.id]: e.target.value })}
                      styles={{
                        input: { textAlign: 'right' }
                      }}
                    />
                  </Group>
                );
              })
            ) : (
              <Text size="sm" c="dimmed" ta="center" py="lg">
                No se encontraron jugadores.
              </Text>
            )}
          </Stack>
        </ScrollArea.Autosize>

        <Divider />

        <Group justify="flex-end" mt="xs">
          <Button size="xs" radius="xl" variant="subtle" color="gray" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            size="xs"
            radius="xl"
            color="orange"
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
            loading={saving}
          >
            Guardar pesos
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
